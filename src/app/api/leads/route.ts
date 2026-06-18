import { createPublicClient } from "@/lib/supabase/public";
import { sendEmail, notifyTo } from "@/lib/email/send";
import { clean, isEmail, spamGuard } from "@/lib/forms/submit";

// "Help me find a place" worker lead form. Persists to leads and notifies the
// admin so they can match the worker with housing near the job site.
export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, error: "Bad request." }, { status: 400 });
  }

  if (clean(body.company)) return Response.json({ ok: true }); // honeypot

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 40);
  const email = clean(body.email, 200);
  const jobSiteCity = clean(body.jobSiteCity, 120);
  const state = clean(body.state, 60);
  const note = clean(body.note, 2000);

  // Need a name, somewhere to reach them, and where the job is.
  if (!name || (!phone && !isEmail(email)) || !jobSiteCity) {
    return Response.json(
      {
        ok: false,
        error: "Please add your name, a phone or email, and the job site city.",
      },
      { status: 400 },
    );
  }

  const guard = await spamGuard(req, clean(body.turnstileToken, 4000) || undefined);
  if (!guard.ok) return Response.json({ ok: false, error: guard.error }, { status: guard.status });

  try {
    const { error } = await createPublicClient().from("leads").insert({
      name,
      phone,
      email,
      job_site_city: jobSiteCity,
      state,
      note,
    });
    if (error) console.error("[leads] db insert error:", error.message);
  } catch (e) {
    console.error("[leads] db insert threw", e);
  }

  const to = notifyTo();
  if (to) {
    await sendEmail({
      to,
      replyTo: isEmail(email) ? email : undefined,
      subject: `New housing lead: ${name} near ${jobSiteCity}${state ? `, ${state}` : ""}`,
      text:
        `Name: ${name}\nPhone: ${phone || "-"}\nEmail: ${email || "-"}\n` +
        `Job site: ${jobSiteCity}${state ? `, ${state}` : ""}\n\n${note || "(no extra notes)"}`,
    });
  }

  return Response.json({ ok: true });
}
