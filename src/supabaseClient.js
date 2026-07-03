import { createClient } from "@supabase/supabase-js";

// === REPLACE THESE WITH YOUR ACTUAL SUPABASE CREDENTIALS IF NEEDED ===
const SUPABASE_URL = "https://ayypyoczarvufsmolfqx.supabase.co";
const SUPABASE_PUBLIC_KEY = "sb_publishable_ltVZzEdHHyaj93Ojkyebig_BerBT1TB";

// Initialize and export the single Supabase client instance
export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
