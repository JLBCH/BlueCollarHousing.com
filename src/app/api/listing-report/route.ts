import { createPublicClient } from "@/lib/supabase/public";
import { sendEmail, notifyTo } from "@/lib/email/send";
import { clean, isEmail, spamGuard } from "@/lib/forms/submit";
import { asReportReason, REPORT_REASON_LABELS } from "@/lib/reports";

// "Report a problem" on a public listing (Joe's ask for the ~80 legacy
// listings he can't verify himself). Stored in listing_reports for the admin
// dashboard, with a best-effort heads-up email to the admin inbox.
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
  const reason = asReportReason(clean(body.reason, 40));
  const note = clean(body.note, 2000);
  const name = clean(body.name, 120);
  const email = clean(body.email, 200);

  if (!listingSlug || (!note && reason === "other")) {
    return Response.json(
      { ok: false, error: "Please tell us what's wrong with the listing." },
      { status: 400 },
    );
  }

  const guard = await spamGuard(req, clean(body.turnstileToken, 4000) || undefined);
  if (!guard.ok) return Response.json({ ok: false, error: guard.error }, { status: guard.status });

  try {
    const sb = createPublicClient();
    // Resolve the real row id so the report survives slug renames and lets the
    // admin join reports to listings; best-effort (null for already-gone slugs).
    let listingId: string | null = null;
    try {
      const { data: match } = await sb
        .from("listings_public")
        .select("id")
        .eq("slug", listingSlug)
        .maybeSingle();
      listingId = match?.id ?? null;
    } catch {
      // Fine — the slug/title strings still identify the listing for a human.
    }

    const { error } = await sb.from("listing_reports").insert({
      listing_id: listingId,
      listing_slug: listingSlug,
      listing_title: listingTitle,
      reason,
      note,
      reporter_name: name,
      reporter_email: isEmail(email) ? email : "",
    });
    if (error) {
      console.error("[listing-report] db insert error:", error.message);
      return Response.json(
        { ok: false, error: "Could not save your report. Please try again." },
        { status: 500 },
      );
    }
  } catch (e) {
    console.error("[listing-report] db insert threw", e);
    return Response.json(
      { ok: false, error: "Could not save your report. Please try again." },
      { status: 500 },
    );
  }

  const admin = notifyTo();
  if (admin) {
    await sendEmail({
      to: admin,
      subject: `Listing reported: ${listingTitle || listingSlug}`,
      text:
        `Listing: ${listingTitle || ""} (${listingSlug})\n` +
        `Reason: ${REPORT_REASON_LABELS[reason]}\n` +
        `From: ${name || "-"} ${email ? `<${email}>` : ""}\n\n` +
        `${note || "(no details given)"}\n\n` +
        `Review in the admin dashboard → Reports.`,
    });
  }

  return Response.json({ ok: true });
}
