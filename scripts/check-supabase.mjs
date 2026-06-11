// Connectivity + security check. Run: pnpm check:supabase
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("Missing env. Use: node --env-file=.env.local scripts/check-supabase.mjs");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });
console.log(`Project: ${url}\n`);

// 1. Public view returns approved listings.
{
  const { data, error, count } = await sb
    .from("listings_public")
    .select("slug, title, contact_phone", { count: "exact" });
  if (error) {
    console.log(`✗ listings_public error (run migrations?): ${error.code} ${error.message}`);
  } else {
    console.log(`✓ listings_public: ${count} approved listing(s) readable via public key`);
  }
}

// 2. Base table must NOT be readable with the public key (protects address etc.).
{
  const { data, error } = await sb.from("listings").select("address").limit(1);
  if (error) {
    console.log(`✓ base 'listings' table blocked to public key (${error.code})`);
  } else if (!data || data.length === 0) {
    console.log(`✓ base 'listings' table returns no rows to public key (RLS)`);
  } else {
    console.log(`✗ WARNING: base 'listings' table is readable by the public key!`);
  }
}

// 3. View must not expose the private address column.
{
  const { error } = await sb.from("listings_public").select("address").limit(1);
  if (error) {
    console.log(`✓ 'address' is not exposed by listings_public`);
  } else {
    console.log(`✗ WARNING: 'address' is selectable from listings_public!`);
  }
}
