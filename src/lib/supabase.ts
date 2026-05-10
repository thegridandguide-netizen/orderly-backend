import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://hkmahmlyuveklxvzcgug.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrbWFobWx5dXZla2x4dnpjZ3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NjAzNTMsImV4cCI6MjA5MzIzNjM1M30.ZfSivYhGTdfYRXVm6HLkx-RdbLrXgF-ykRR1VHMQ-TU";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export const fmtBDT = (n: number | null | undefined) =>
  n == null
    ? null
    : "৳ " +
      new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

export const DEPOSIT_RATE = 0.2;