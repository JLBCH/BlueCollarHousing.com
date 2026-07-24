"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Copy, Trash2, Send, Undo2, Loader2, CreditCard, Receipt, Plus } from "lucide-react";
import {
  deleteListing,
  duplicateListing,
  setListingStatus,
} from "@/app/dashboard/listings/actions";
import { subscribeListing, openBillingPortal } from "@/app/dashboard/billing/actions";
import { billingState } from "@/lib/listings/billing-state";

// Pre-launch: hides the checkout buttons and shows a check-back note instead.
// Baked in at build time (NEXT_PUBLIC_*), flipped by env var + redeploy; the
// subscribeListing server action enforces the same flag as a backstop.
const PAYMENTS_PAUSED = process.env.NEXT_PUBLIC_PAYMENTS_PAUSED === "1";

const btn =
  "inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-2.5 py-1.5 text-[13px] font-semibold text-navy hover:border-navy/40 disabled:opacity-50";
const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-lg bg-orange px-2.5 py-1.5 text-[13px] font-semibold text-white hover:bg-orange-dark disabled:opacity-50";

export function ListingActions({
  id,
  status,
  subscriptionStatus = "none",
  isComp = false,
  hasSubscription = false,
  expiresInDays,
  isResidential = false,
  isSecondary = false,
  atUnitCap = false,
  additionalUnits = 0,
}: {
  id: string;
  status: string;
  subscriptionStatus?: string;
  isComp?: boolean;
  hasSubscription?: boolean;
  expiresInDays?: number;
  /** Residential listings can spawn additional same-address units ($10/yr each). */
  isResidential?: boolean;
  /** This listing is itself an additional unit (belongs to a primary). */
  isSecondary?: boolean;
  /** This address already has the max 6 units — hide Add-unit + Duplicate. */
  atUnitCap?: boolean;
  /** If this is a PRIMARY, how many additional units hang off it (deleted with it). */
  additionalUnits?: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const bs = billingState({ status, subscriptionStatus, isComp, hasSubscription });
  const hasStripeSub = hasSubscription && !isComp;

  // Server actions can REJECT (Stripe/network failure, transport error), not
  // just return { ok: false } — without the catch, busy stays true forever and
  // every button on the card is dead until a reload.
  async function act(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (res.ok) router.refresh();
      else setError(res.error || "Something went wrong.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  // For actions that hand off to Stripe (checkout / portal): redirect to the URL.
  async function go(fn: () => Promise<{ ok: boolean; url?: string; error?: string }>) {
    setBusy(true);
    setError(null);
    try {
      const res = await fn();
      if (res.ok && res.url) {
        window.location.href = res.url;
        return;
      }
      setError(res.error || "Something went wrong.");
    } catch {
      setError("Something went wrong. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex flex-wrap justify-end gap-1.5">
        <Link href={`/dashboard/listings/${id}/edit`} className={btn}>
          <Pencil className="h-3.5 w-3.5" /> Edit
        </Link>

        {/* Free submit: no card needed to get into the approval queue. */}
        {(status === "draft" || status === "rejected") && (
          <button type="button" disabled={busy} onClick={() => act(() => setListingStatus(id, "pending"))} className={primaryBtn}>
            <Send className="h-3.5 w-3.5" /> Submit for approval
          </button>
        )}
        {/* Approved but never paid → complete checkout to publish. */}
        {bs === "awaiting_payment" && !PAYMENTS_PAUSED && (
          <button type="button" disabled={busy} onClick={() => go(() => subscribeListing(id))} className={primaryBtn}>
            <CreditCard className="h-3.5 w-3.5" /> Pay to publish
          </button>
        )}
        {/* Payment failing (still live in grace) → update the card. */}
        {bs === "past_due" && (
          <button type="button" disabled={busy} onClick={() => go(() => openBillingPortal())} className={primaryBtn}>
            <CreditCard className="h-3.5 w-3.5" /> Update payment
          </button>
        )}
        {/* Subscription ended → start it again (a fresh checkout). */}
        {bs === "lapsed" && !PAYMENTS_PAUSED && (
          <button type="button" disabled={busy} onClick={() => go(() => subscribeListing(id))} className={primaryBtn}>
            <CreditCard className="h-3.5 w-3.5" /> Reactivate
          </button>
        )}
        {/* Where a checkout button would be, say why it isn't there. */}
        {(bs === "awaiting_payment" || bs === "lapsed") && PAYMENTS_PAUSED && (
          <span className="inline-flex items-center rounded-lg border border-dashed border-line bg-bg-soft px-2.5 py-1.5 text-[13px] font-medium text-muted">
            Paid listings open soon — check back
          </span>
        )}
        {status === "pending" && (
          <button type="button" disabled={busy} onClick={() => act(() => setListingStatus(id, "draft"))} className={btn}>
            <Undo2 className="h-3.5 w-3.5" /> Withdraw
          </button>
        )}

        {hasStripeSub && (
          <button type="button" disabled={busy} onClick={() => go(() => openBillingPortal())} className={btn}>
            <Receipt className="h-3.5 w-3.5" /> Manage billing
          </button>
        )}

        {/* Duplex/triplex owners: add another unit at this same address ($10/yr).
            Shown only once the primary is LIVE and PAID — comped (free) listings
            can't spawn $10 units, and additional units can't publish until the
            primary is live. Hidden at the 6-unit max. */}
        {isResidential && !isSecondary && !atUnitCap && !isComp && bs === "live" && (
          <Link href={`/dashboard/listings/new/residential?sameAddressAs=${id}`} className={btn}>
            <Plus className="h-3.5 w-3.5" /> Add unit at this address
          </Link>
        )}

        {/* Duplicate is hidden at the 6-unit cap so it can't spawn a 7th. */}
        {!atUnitCap && (
          <button type="button" disabled={busy} onClick={() => act(() => duplicateListing(id))} className={btn}>
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
        )}
        {/* Inline confirm — window.confirm() is silently blocked in some Android
            in-app browsers / installed PWAs, so a tap-to-confirm never fired. */}
        {confirmDelete ? (
          <span className="inline-flex max-w-[280px] flex-col items-end gap-1.5 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[12px] text-red-700">
            <span className="text-right font-medium">
              {/* Terms 6.2 requires telling the owner what happens to the
                  subscription before they confirm a delete. */}
              {additionalUnits > 0 ? (
                <>
                  <strong>This is your primary listing.</strong> Deleting it will also permanently
                  delete its {additionalUnits} additional unit{additionalUnits === 1 ? "" : "s"} at
                  this address, and cancel the automatic renewal for all of them. You won&apos;t be
                  refunded for the rest of the term. This can&apos;t be undone.
                </>
              ) : bs === "awaiting_payment" && expiresInDays != null ? (
                `This approval expires in ${Math.max(expiresInDays, 0)} day${expiresInDays === 1 ? "" : "s"}. Once deleted it's gone — no refunds.`
              ) : bs === "live" || bs === "past_due" ? (
                "Deleting cancels your automatic renewal, so you won't be charged again. You won't be refunded for the rest of the term you've paid for, and this can't be undone."
              ) : (
                "Once deleted it's gone — this can't be undone."
              )}
            </span>
            <span className="flex items-center gap-2 font-semibold">
              Delete this listing?
              <button type="button" disabled={busy} onClick={() => act(() => deleteListing(id))} className="underline hover:no-underline">
                Yes, delete
              </button>
              <button type="button" disabled={busy} onClick={() => setConfirmDelete(false)} className="text-navy underline hover:no-underline">
                Cancel
              </button>
            </span>
          </span>
        ) : (
          <button
            type="button"
            disabled={busy}
            onClick={() => setConfirmDelete(true)}
            className={`${btn} text-red-600 hover:border-red-300`}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        )}

        {busy && <Loader2 className="h-4 w-4 animate-spin self-center text-muted" />}
      </div>
      {/* Submission is the consent gate that covers FREE (comped) listings too —
          they never reach a payment click, so agreement can't hang off purchase. */}
      {(status === "draft" || status === "rejected") && (
        <p className="text-right text-[11px] text-muted">
          By submitting your listing or using this website to find a listing you agree to our{" "}
          <Link href="/terms" className="underline hover:text-navy">
            Terms of Use
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline hover:text-navy">
            Privacy Policy
          </Link>
          .
        </p>
      )}
      {/* Terms 5.3: the authorization disclosure has to sit with the payment
          click. Stripe Checkout shows the exact amount and renewal date on the
          next screen; this states the annual auto-renew and how to stop it. */}
      {(bs === "awaiting_payment" || bs === "lapsed") && !PAYMENTS_PAUSED && (
        <p className="text-right text-[11px] text-muted">
          By paying you agree to our{" "}
          <Link href="/terms" className="underline hover:text-navy">
            Terms of Use
          </Link>{" "}
          and authorize this listing fee and its automatic annual renewal at the price shown
          at checkout. Cancel any time from this dashboard before the renewal date.
        </p>
      )}
      {error && <p className="text-[12px] font-medium text-red-600">{error}</p>}
    </div>
  );
}
