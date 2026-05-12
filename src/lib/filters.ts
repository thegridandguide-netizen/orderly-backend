/**
 * Single source of truth for filter dropdowns shared across the user-side
 * filter chips AND the admin CRUD forms. Update here → both reflect.
 */
import { supabase } from "@/integrations/supabase/client";

export const CITIES = [
  "Dhaka", "Chittagong", "Sylhet", "Khulna", "Rajshahi",
  "Cox's Bazar", "Rangpur", "Barishal", "Gazipur", "Mymensingh",
] as const;

export const VENUE_TYPES = [
  { value: "banquet_hall", label: "Banquet Hall" },
  { value: "marriage_garden", label: "Marriage Garden" },
  { value: "resort", label: "Resort" },
  { value: "party_hall", label: "Party Hall" },
  { value: "destination", label: "Destination" },
  { value: "hotel", label: "4★+ Hotel" },
];

export const VENDOR_CATEGORIES = [
  { value: "photographer", label: "Photographer" },
  { value: "makeup", label: "Makeup Artist" },
  { value: "decorator", label: "Decorator" },
  { value: "caterer", label: "Caterer" },
  { value: "dj", label: "DJ & Music" },
  { value: "videographer", label: "Videographer" },
  { value: "planner", label: "Event Planner" },
];

export const PRICING_RULE_TYPES = [
  { value: "tax_percent", label: "Tax (%)" },
  { value: "discount_percent", label: "Discount (%)" },
  { value: "discount_flat", label: "Discount (flat)" },
  { value: "fee_percent", label: "Fee (%)" },
  { value: "fee_flat", label: "Fee (flat)" },
];

export const PRICING_RULE_SCOPES = [
  { value: "all", label: "All" },
  { value: "venue", label: "Venue only" },
  { value: "vendor", label: "Vendor only" },
];

export const APP_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "vendor", label: "Vendor" },
  { value: "customer", label: "Customer" },
];

/** Async loader for vendor_profile_id dropdowns (used inside admin forms). */
export async function loadVendorProfileOptions() {
  const { data } = await supabase.from("vendor_profiles")
    .select("id,business_name").order("business_name", { ascending: true });
  return (data || []).map((v: any) => ({ value: v.id, label: v.business_name }));
}

/** Async loader for album_id dropdowns. */
export async function loadAlbumOptions() {
  const { data } = await supabase.from("albums")
    .select("id,title").order("title", { ascending: true });
  return (data || []).map((a: any) => ({ value: a.id, label: a.title }));
}

/** Helpers to feed CrudTable's `options` prop directly (string-only). */
export const cityOptions = CITIES.map((c) => ({ value: c, label: c }));
