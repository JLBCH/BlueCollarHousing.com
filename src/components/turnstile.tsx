"use client";

import { useEffect, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          "error-callback"?: () => void;
        },
      ) => string;
      reset: (id?: string) => void;
      remove: (id?: string) => void;
    };
  }
}

/**
 * Cloudflare Turnstile widget. Renders nothing until
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is set, so forms work today and gain the
 * challenge automatically once Turnstile keys are provisioned. Calls onToken
 * with the solved token; onExpire fires when a solved token expires (tokens are
 * single-use and short-lived). To force a fresh token after a failed submit,
 * remount this component with a changing `key` — it removes the old widget on
 * unmount and renders a new one.
 */
export function Turnstile({
  onToken,
  onExpire,
}: {
  onToken: (token: string) => void;
  onExpire?: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  useEffect(() => {
    if (!SITE_KEY || !ref.current) return;
    const el = ref.current;
    const render = () => {
      // Guard against a double render (React strict mode runs effects twice).
      if (!window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(el, {
        sitekey: SITE_KEY,
        callback: onToken,
        "expired-callback": () => {
          window.turnstile?.reset(widgetId.current ?? undefined);
          onExpire?.();
        },
        "error-callback": () => onExpire?.(),
      });
    };

    const id = "cf-turnstile-script";
    if (window.turnstile) {
      render();
    } else if (!document.getElementById(id)) {
      const s = document.createElement("script");
      s.id = id;
      s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      s.async = true;
      s.onload = render;
      document.head.appendChild(s);
    } else {
      document.getElementById(id)!.addEventListener("load", render, { once: true });
    }

    return () => {
      const wid = widgetId.current;
      widgetId.current = null;
      if (wid && window.turnstile?.remove) {
        try {
          window.turnstile.remove(wid);
        } catch {
          /* widget already gone */
        }
      }
    };
  }, [onToken, onExpire]);

  if (!SITE_KEY) return null;
  return <div ref={ref} className="my-1" />;
}
