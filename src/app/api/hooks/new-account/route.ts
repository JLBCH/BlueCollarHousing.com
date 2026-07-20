import { NextResponse, type NextRequest } from "next/server";
import { sendEmail, notifyTo } from "@/lib/email/send";
import { buildSignupNotification } from "@/lib/email/signup-notify";

/**
 * Emails the admin (CONTACT_NOTIFY_EMAIL) whenever a new account is created.
 *
 * Wired to a Supabase Database Webhook on INSERT to public.profiles — that row
 * is created by the handle_new_user() trigger the instant a user signs up, so
 * this fires authoritatively for every real signup regardless of the email-
 * confirmation setting, and never for a random client (the signup itself is
 * client-side, so there's no server action to hook).
 *
 * Secret-gated the same way as the cron route: only Supabase's webhook, which
 * carries SIGNUP_WEBHOOK_SECRET, can reach it — nobody can spam the admin inbox.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SIGNUP_WEBHOOK_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  // Supabase DB webhook shape: { type, table, schema, record, old_record }.
  const record =
    payload && typeof payload === "object" && "record" in payload
      ? ((payload as { record: unknown }).record as Record<string, unknown>)
      : {};

  const to = notifyTo();
  if (!to) {
    // No notify address configured — acknowledge so the webhook doesn't retry.
    console.warn("[new-account] CONTACT_NOTIFY_EMAIL not set; skipping notify");
    return NextResponse.json({ ok: true, skipped: "no-notify-address" });
  }

  const { subject, text } = buildSignupNotification({
    email: typeof record.email === "string" ? record.email : null,
    full_name: typeof record.full_name === "string" ? record.full_name : null,
    phone: typeof record.phone === "string" ? record.phone : null,
    role: typeof record.role === "string" ? record.role : null,
  });

  const sent = await sendEmail({ to, subject, text });
  return NextResponse.json({ ok: sent });
}
