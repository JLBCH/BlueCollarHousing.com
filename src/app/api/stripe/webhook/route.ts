import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import type Stripe from "stripe";
import { stripe, siteUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, notifyTo } from "@/lib/email/send";
import { cancelEffectiveAt, cancelJustScheduled, type SubCancelPrev } from "@/lib/stripe-cancel";

type Db = ReturnType<typeof createAdminClient>;

/** Look up the owner's email + listing title for a notification. */
async function owner(db: Db, listingId: string): Promise<{ email: string; title: string } | null> {
  const { data: l } = await db.from("listings").select("title, owner_id").eq("id", listingId).single();
  if (!l?.owner_id) return null;
  const { data: p } = await db.from("profiles").select("email").eq("id", l.owner_id).single();
  return p?.email ? { email: p.email, title: l.title } : null;
}

/**
 * Stripe webhook: keeps each listing's subscription state in sync. Authenticated
 * by the Stripe signature (not a user session), so it uses the service-role
 * client to write past RLS.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Not configured." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const db = createAdminClient();
  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const listingId = s.metadata?.listing_id;
      const userId = s.metadata?.user_id;
      const subId = typeof s.subscription === "string" ? s.subscription : s.subscription?.id;
      const customerId = typeof s.customer === "string" ? s.customer : s.customer?.id;
      if (!listingId) {
        // Missing metadata means we can't attach the payment to a listing. Fail
        // loudly (non-200) so Stripe retries and it surfaces, rather than
        // silently capturing a payment that never activates a listing.
        console.error("[stripe webhook] checkout.session.completed missing listing_id", s.id);
        return NextResponse.json({ error: "Missing listing_id metadata." }, { status: 400 });
      }
      // Always record the subscription + customer link.
      await db.from("listings").update({ stripe_subscription_id: subId ?? null }).eq("id", listingId);
      if (userId && customerId) {
        await db.from("profiles").update({ stripe_customer_id: customerId }).eq("id", userId);
      }
      // Record which promo code (if any) was applied, for admin visibility.
      try {
        const full = await stripe.checkout.sessions.retrieve(s.id, { expand: ["discounts.promotion_code"] });
        const promo = full.discounts?.[0]?.promotion_code;
        const code = promo && typeof promo === "object" ? promo.code : null;
        if (code) await db.from("listings").update({ coupon_code: code }).eq("id", listingId);
      } catch (e) {
        console.warn("[stripe webhook] could not read promo code:", e);
      }
      // Only mark active/paid when the money actually settled. Async methods
      // (ACH, some bank redirects) fire this event with payment_status "unpaid";
      // the async_payment_succeeded/failed events below finish those.
      if (s.payment_status === "paid" || s.payment_status === "no_payment_required") {
        await db.from("listings").update({ subscription_status: "active" }).eq("id", listingId);
        // Legacy pay-first drafts: nudge into the queue (no-op once approved).
        await db.from("listings").update({ status: "pending" }).eq("id", listingId).eq("status", "draft");
      }
    } else if (event.type === "checkout.session.async_payment_succeeded") {
      const s = event.data.object as Stripe.Checkout.Session;
      const listingId = s.metadata?.listing_id;
      if (listingId) {
        await db.from("listings").update({ subscription_status: "active" }).eq("id", listingId);
      }
    } else if (event.type === "checkout.session.async_payment_failed") {
      const s = event.data.object as Stripe.Checkout.Session;
      const listingId = s.metadata?.listing_id;
      if (listingId) {
        const o = await owner(db, listingId);
        if (o) {
          await sendEmail({
            to: o.email,
            subject: `Payment failed for "${o.title}"`,
            text: `The payment for your listing "${o.title}" didn't go through, so it isn't published yet. You can try again from your dashboard:\n${siteUrl()}/dashboard`,
          });
        }
      }
    } else if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const listingId = sub.metadata?.listing_id;
      const status = event.type === "customer.subscription.deleted" ? "canceled" : sub.status;

      // Resolve the listing (by metadata, else by subscription id) so we can both
      // update status and email the owner if it just went offline.
      let targetId = listingId ?? null;
      if (targetId) {
        await db.from("listings").update({ subscription_status: status }).eq("id", targetId);
      } else if (sub.id) {
        const { data: row } = await db
          .from("listings")
          .update({ subscription_status: status })
          .eq("stripe_subscription_id", sub.id)
          .select("id")
          .maybeSingle();
        targetId = row?.id ?? null;
      }

      // Tell the landlord AND the admin when a lapse takes (or threatens) a listing.
      if (targetId && (status === "canceled" || status === "past_due" || status === "unpaid")) {
        const o = await owner(db, targetId);
        if (o) {
          const past = status === "past_due";
          const recipients = [...new Set([o.email, notifyTo()].filter(Boolean) as string[])];
          for (const to of recipients) {
            await sendEmail({
              to,
              subject: past
                ? `Payment failed — action needed for "${o.title}"`
                : `Listing "${o.title}" is offline`,
              text: past
                ? `The recurring payment for "${o.title}" failed. We'll keep retrying for a few days and the listing stays up in the meantime — update the card to avoid it going offline:\n${siteUrl()}/dashboard`
                : `The subscription for "${o.title}" has ended, so the listing is no longer visible.\n${siteUrl()}/dashboard`,
            });
          }
        }
      }

      // The moment a landlord clicks "cancel", notify the admin + owner — the
      // listing stays live until the period ends. Legacy cancels flip
      // cancel_at_period_end; newer Stripe API versions schedule via cancel_at
      // and leave the boolean false, so both shapes are handled by the helper.
      if (
        targetId &&
        event.type === "customer.subscription.updated" &&
        cancelJustScheduled(sub, event.data.previous_attributes as SubCancelPrev | undefined)
      ) {
        const o = await owner(db, targetId);
        const endTs = cancelEffectiveAt(sub, sub.items?.data?.[0]?.current_period_end ?? null);
        const when = endTs
          ? new Date(endTs * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
          : "the end of the billing period";
        const recipients = [...new Set([o?.email, notifyTo()].filter(Boolean) as string[])];
        for (const to of recipients) {
          await sendEmail({
            to,
            subject: `Subscription canceled — "${o?.title ?? "a listing"}" ends ${when}`,
            text: `The subscription for "${o?.title ?? "a listing"}" was canceled. The listing stays live until ${when}, then it goes offline.\n${siteUrl()}/dashboard`,
          });
        }
      }
    }
  } catch (e) {
    console.error("[stripe webhook] handler error:", e);
    return NextResponse.json({ error: "Handler error." }, { status: 500 });
  }

  // Subscription events flip listings on/off the public site — refresh the
  // static homepage so its map pins stay current (cheap: just marks it stale).
  revalidatePath("/");

  return NextResponse.json({ received: true });
}
