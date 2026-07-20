import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, notifyTo } from "@/lib/email/send";
import { clean, isEmail, spamGuard } from "@/lib/forms/submit";

// Per-listing contact form, for landlords who hide their phone/email. The
// landlord's address is never exposed to the sender; the message is persisted to
// contact_inquiries and forwarded to the LANDLORD (reply-to the sender), with a
// copy to the admin inbox. (Delivery goes live once the Resend domain is set up
// at the DNS changeover — the inquiry is stored regardless.)
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  if (clean(body.company)) return Response.json({ ok: true }); // honeypot

  const listingSlug = clean(body.listingSlug, 200);
  const listingTitle = clean(body.listingTitle, 200);
  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const email = clean(body.email, 200);
  const message = clean(body.message, 4000);

  if (!name || (!phone && !isEmail(email)) || !message) {
    return Response.json(
      { ok: false, error: "Please add your name, a phone or email, and a message." },
      { status: 400 },
    );
  }

  const guard = await spamGuard(req, clean(body.turnstileToken, 4000) || undefined);
  if (!guard.ok) return Response.json({ ok: false, error: guard.error }, { status: guard.status });

  try {
    const { error } = await createPublicClient().from("contact_inquiries").insert({
      kind: "listing",
      listing_slug: listingSlug,
      sender_name: name,
      sender_email: email,
      sender_phone: phone,
      message,
    });
    if (error) console.error("[listing-contact] db insert error:", error.message);
  } catch (e) {
    console.error("[listing-contact] db insert threw", e);
  }

  // Forward to the landlord (their email isn't public, so look it up with the
  // service-role client), and copy the admin inbox for the record.
  // Send to the email the landlord entered ON THE LISTING (what they chose as the
  // contact for this place), falling back to their account email if they left the
  // listing's contact email blank.
  let ownerEmail: string | null = null;
  try {
    const admin = createAdminClient();
    const { data: listing } = await admin
      .from("listings")
      .select("owner_id, contact_email")
      .eq("slug", listingSlug)
      .single();
    ownerEmail = listing?.contact_email || null;
    if (!ownerEmail && listing?.owner_id) {
      const { data: prof } = await admin
        .from("profiles")
        .select("email")
        .eq("id", listing.owner_id)
        .single();
      ownerEmail = prof?.email || null;
    }
  } catch (e) {
    console.error("[listing-contact] owner lookup failed", e);
  }

  const text =
    `Listing: ${listingTitle || ""} (${listingSlug})\n` +
    `From: ${name}\nPhone: ${phone || "-"}\nEmail: ${email || "-"}\n\n${message}`;
  const subject = `New inquiry on listing: ${listingTitle || listingSlug}`;
  const replyTo = isEmail(email) ? email : undefined;

  // De-dupe if the admin inbox is also the owner.
  const recipients = [...new Set([ownerEmail, notifyTo()].filter(Boolean) as string[])];
  for (const to of recipients) {
    await sendEmail({ to, replyTo, subject, text });
  }

  return Response.json({ ok: true });
}
