import { createPublicClient } from "@/lib/supabase/public";
import { sendEmail, notifyTo } from "@/lib/email/send";
import { clean, isEmail, spamGuard } from "@/lib/forms/submit";

// General site contact form (/contact). Persists to contact_inquiries and
// notifies the admin/owner. Both steps are best-effort so the visitor always
// gets a clean result once validation + spam checks pass.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  // Honeypot: real people leave it empty. Pretend success for bots.
  if (clean(body.company)) return Response.json({ ok: true });

  const name = clean(body.name, 120);
  const email = clean(body.email, 200);
  const phone = clean(body.phone, 40);
  const message = clean(body.message, 4000);

  if (!name || !isEmail(email) || !message) {
    return Response.json(
      { ok: false, error: "Please add your name, a valid email and a message." },
      { status: 400 },
    );
  }

  const guard = await spamGuard(req, clean(body.turnstileToken, 4000) || undefined);
  if (!guard.ok) return Response.json({ ok: false, error: guard.error }, { status: guard.status });

  try {
    const { error } = await createPublicClient().from("contact_inquiries").insert({
      kind: "general",
      sender_name: name,
      sender_email: email,
      sender_phone: phone,
      message,
    });
    if (error) console.error("[contact] db insert error:", error.message);
  } catch (e) {
    console.error("[contact] db insert threw", e);
  }

  const to = notifyTo();
  if (to) {
    await sendEmail({
      to,
      replyTo: email,
      subject: `New contact message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || "-"}\n\n${message}`,
    });
  }

  return Response.json({ ok: true });
}
