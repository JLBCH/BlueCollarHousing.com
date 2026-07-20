import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { siteUrl } from "@/lib/stripe";

/**
 * Daily sweep for the approve-first / pay-after flow. An approved listing that
 * isn't comped or paid is hidden from the public (the listings_public gate);
 * this keeps those from lingering forever:
 *   - after REMINDER_DAY: email the landlord once to finish checkout
 *   - after EXPIRE_DAY:   the approval expires, the listing reverts to a draft
 *
 * Scheduled by Vercel Cron (see vercel.json). Vercel adds
 * `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set in the project,
 * which this route requires — so it can't be triggered by anyone else.
 */
// First reminder after 3 days unpaid, then once a week; expire at 4 weeks.
const FIRST_REMINDER_DAY = 3;
const REMINDER_INTERVAL_DAYS = 7;
const EXPIRE_DAY = 28;
const DAY_MS = 86_400_000;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createAdminClient();
  const { data: listings, error } = await db
    .from("listings")
    .select("id, title, owner_id, reviewed_at, payment_reminder_at")
    .eq("status", "approved")
    .eq("is_comp", false)
    // Only sweep listings that never had a subscription. A listing that was
    // paid and later canceled/lapsed is handled by Stripe's lifecycle + the
    // view gate — it must NOT be expired here (that would demote a listing that
    // was live for a year and email "no payment received").
    .is("stripe_subscription_id", null)
    .not("subscription_status", "in", "(active,trialing)")
    .not("reviewed_at", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Resolve owner emails in one query.
  const ownerIds = [...new Set((listings ?? []).map((l) => l.owner_id).filter(Boolean))];
  const emails = new Map<string, string>();
  if (ownerIds.length) {
    const { data: profs } = await db.from("profiles").select("id, email").in("id", ownerIds);
    for (const p of profs ?? []) if (p.email) emails.set(p.id, p.email);
  }

  const now = Date.now();
  let reminded = 0;
  let expired = 0;

  for (const l of listings ?? []) {
    if (!l.reviewed_at) continue;
    const ageDays = (now - new Date(l.reviewed_at).getTime()) / DAY_MS;
    const email = l.owner_id ? emails.get(l.owner_id) : undefined;

    if (ageDays >= EXPIRE_DAY) {
      // Approval expired (4 weeks unpaid) — back to draft so it leaves the
      // "awaiting payment" limbo. draft is an allowed status transition.
      await db.from("listings").update({ status: "draft", payment_reminder_at: null }).eq("id", l.id);
      expired++;
      if (email) {
        await sendEmail({
          to: email,
          subject: `Your listing "${l.title}" expired — no payment received`,
          text: `Your listing "${l.title}" was approved but hasn't been paid for within 4 weeks, so it's been moved back to a draft.\n\nYou can resubmit and complete checkout any time from your dashboard:\n${siteUrl()}/dashboard`,
        });
      }
    } else if (ageDays >= FIRST_REMINDER_DAY) {
      // Weekly nudge: send if we've never reminded, or it's been a week since the
      // last one. Gives reminders around day 3, 10, 17, 24 before the day-28 expiry.
      const daysSinceReminder = l.payment_reminder_at
        ? (now - new Date(l.payment_reminder_at).getTime()) / DAY_MS
        : Infinity;
      if (daysSinceReminder >= REMINDER_INTERVAL_DAYS) {
        await db.from("listings").update({ payment_reminder_at: new Date().toISOString() }).eq("id", l.id);
        reminded++;
        if (email) {
          await sendEmail({
            to: email,
            subject: `Reminder: finish publishing "${l.title}"`,
            text: `Your listing "${l.title}" is approved but not yet live. Complete checkout to publish it — approvals expire if unpaid after 4 weeks:\n${siteUrl()}/dashboard`,
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true, checked: listings?.length ?? 0, reminded, expired });
}
