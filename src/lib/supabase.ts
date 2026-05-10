// Re-export the generated Supabase client and shared formatters.
export { supabase } from "@/integrations/supabase/client";

export const fmtBDT = (n: number | null | undefined) =>
  n == null
    ? null
    : "৳ " +
      new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

export const DEPOSIT_RATE = 0.2;
