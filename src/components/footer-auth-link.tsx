"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const cls = "block py-2.5 hover:text-white";

/** Footer link that mirrors the header: "Log In" when signed out, "Dashboard"
 *  when signed in, so a logged-in user is never shown a "Log In" link. */
export function FooterAuthLink() {
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setAuthed(!!data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) =>
      setAuthed(!!session),
    );
    return () => sub.subscription.unsubscribe();
  }, []);

  return authed ? (
    <Link href="/dashboard" className={cls}>
      Dashboard
    </Link>
  ) : (
    <Link href="/login" className={cls}>
      Log In
    </Link>
  );
}
