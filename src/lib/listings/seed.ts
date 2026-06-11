import seedJson from "./seed.json";
import type { Listing } from "./types";

/** Seed listings, single source of truth, mirrored into Supabase by the
 *  generated SQL (see ../../../supabase/migrations). Used as a fallback when
 *  the database is empty or unreachable. */
export const SEED_LISTINGS = seedJson as Listing[];
