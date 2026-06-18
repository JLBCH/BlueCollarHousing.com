import { createPublicClient } from "@/lib/supabase/public";
import { sendEmail, notifyTo } from "@/lib/email/send";
import { clean, isEmail, spamGuard } from "@/lib/forms/submit";

// Per-listing contact form, for landlords who hide their phone/email. The
// landlord's address is never exposed to the sender; the message is captured
// and (once the admin app + service role land in M2/M3) forwarded to the
// landlord. For now it persists to contact_inquiries and notifies the admin.
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

  const to = notifyTo();
  if (to) {
    await sendEmail({
      to,
      replyTo: isEmail(email) ? email : undefined,
      subject: `New inquiry on listing: ${listingTitle || listingSlug}`,
      text:
        `Listing: ${listingTitle || ""} (${listingSlug})\n` +
        `From: ${name}\nPhone: ${phone || "-"}\nEmail: ${email || "-"}\n\n${message}`,
    });
  }

  return Response.json({ ok: true });
}
