import { supabase, fmtBDT } from "./supabase";
export { fmtBDT };

export type VenueCard = {
  id: string;
  name: string;
  rating: string;
  location: string;
  tags: string[];
  img: string | null;
  pricing: { label: string; value: string | null; unit?: string }[];
  capacityPax: string;
  rooms: string;
  handpicked: boolean;
};

function toVenueCard(v: any): VenueCard {
  const pricing: VenueCard["pricing"] = [];
  if (v.veg_price != null) pricing.push({ label: "Veg", value: fmtBDT(v.veg_price), unit: "person" });
  if (v.non_veg_price != null) pricing.push({ label: "Non-veg", value: fmtBDT(v.non_veg_price), unit: "person" });
  if (v.rental_price != null && pricing.length === 0) pricing.push({ label: "Starting", value: fmtBDT(v.rental_price) });
  return {
    id: v.id,
    name: v.name,
    rating: (v.rating_avg ?? 0).toFixed(1),
    location: [v.area, v.city].filter(Boolean).join(", "),
    tags: v.tags || [],
    img: v.cover_image_url,
    pricing,
    capacityPax: v.capacity_min != null && v.capacity_max != null ? `${v.capacity_min}–${v.capacity_max} pax` : "",
    rooms: v.rooms ? `${v.rooms} Rooms` : "",
    handpicked: !!v.handpicked,
  };
}

export async function loadVenues(opts: {
  city?: string; handpicked?: boolean; minRating?: number; venueType?: string;
  limit?: number; offset?: number; sort?: string;
} = {}): Promise<VenueCard[]> {
  const { city, handpicked, minRating, venueType, limit = 12, offset = 0, sort = "recommended" } = opts;
  let q = supabase.from("venues").select(
    "id,name,city,area,venue_type,tags,handpicked,veg_price,non_veg_price,rental_price,capacity_min,capacity_max,rooms,rating_avg,rating_count,cover_image_url"
  );
  if (city) q = q.eq("city", city);
  if (handpicked != null) q = q.eq("handpicked", handpicked);
  if (venueType) q = q.eq("venue_type", venueType);
  if (minRating != null) q = q.gte("rating_avg", minRating);
  if (sort === "rating") q = q.order("rating_avg", { ascending: false });
  else if (sort === "price_low") q = q.order("rental_price", { ascending: true, nullsFirst: false });
  else if (sort === "price_high") q = q.order("rental_price", { ascending: false, nullsFirst: false });
  else if (sort === "capacity") q = q.order("capacity_max", { ascending: false, nullsFirst: false });
  else q = q.order("handpicked", { ascending: false }).order("rating_avg", { ascending: false });
  q = q.range(offset, offset + limit - 1);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).map(toVenueCard);
}

export async function loadVenueById(id: string) {
  if (!id) return null;
  const { data, error } = await supabase.from("venues").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function loadSimilarVenues(opts: { city?: string; excludeId?: string; limit?: number } = {}) {
  const { city, excludeId, limit = 6 } = opts;
  let q = supabase.from("venues").select(
    "id,name,city,area,tags,handpicked,veg_price,non_veg_price,rental_price,capacity_min,capacity_max,rooms,rating_avg,cover_image_url"
  ).order("rating_avg", { ascending: false }).limit(limit + 1);
  if (city) q = q.eq("city", city);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).filter((v: any) => v.id !== excludeId).slice(0, limit).map(toVenueCard);
}

export async function loadVendors(opts: {
  city?: string; category?: string; minRating?: number; verifiedOnly?: boolean;
  limit?: number; offset?: number; sort?: string;
} = {}) {
  const { city, category, minRating, verifiedOnly, limit = 12, offset = 0, sort = "recommended" } = opts;
  let q = supabase.from("vendor_listings").select(
    "id,title,category,city,price_from,price_to,rating_avg,rating_count,cover_image_url,badge,vendor_profile_id"
  );
  if (city) q = q.eq("city", city);
  if (category) q = q.eq("category", category);
  if (minRating != null) q = q.gte("rating_avg", minRating);
  if (sort === "rating") q = q.order("rating_avg", { ascending: false });
  else if (sort === "price_low") q = q.order("price_from", { ascending: true });
  else if (sort === "price_high") q = q.order("price_from", { ascending: false });
  else q = q.order("rating_avg", { ascending: false });
  q = q.range(offset, offset + limit - 1);
  const { data, error } = await q;
  if (error) throw error;
  let rows: any[] = data || [];
  if (verifiedOnly && rows.length) {
    const ids = rows.map((r) => r.vendor_profile_id).filter(Boolean);
    if (ids.length) {
      const { data: profs } = await supabase.from("vendor_profiles").select("id,verified").in("id", ids);
      const verified = new Set((profs || []).filter((p: any) => p.verified).map((p: any) => p.id));
      rows = rows.filter((r) => r.vendor_profile_id && verified.has(r.vendor_profile_id));
    } else rows = [];
  }
  return rows;
}

export async function loadVendorById(id: string) {
  if (!id) return null;
  const { data: v, error } = await supabase.from("vendor_listings").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!v) return null;
  if (v.vendor_profile_id) {
    const { data: p } = await supabase.from("vendor_profiles")
      .select("business_name,phone,city,service_areas,categories,verified,price_from,price_to,cover_image_url")
      .eq("id", v.vendor_profile_id).maybeSingle();
    (v as any).vendor_profiles = p || null;
  } else (v as any).vendor_profiles = null;
  return v;
}

export async function loadSimilarVendors(opts: { city?: string; category?: string; excludeId?: string; limit?: number } = {}) {
  const { city, category, excludeId, limit = 6 } = opts;
  let q = supabase.from("vendor_listings")
    .select("id,title,category,city,price_from,price_to,rating_avg,rating_count,cover_image_url,badge,gallery_image_urls")
    .order("rating_avg", { ascending: false }).limit(limit + 1);
  if (city) q = q.eq("city", city);
  if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).filter((v: any) => v.id !== excludeId).slice(0, limit);
}

export async function loadAlbums(opts: { featured?: boolean; limit?: number; offset?: number } = {}) {
  const { featured, limit = 12, offset = 0 } = opts;
  let q = supabase.from("albums").select("*").order("created_at", { ascending: false });
  if (featured != null) q = q.eq("featured", featured);
  q = q.range(offset, offset + limit - 1);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function loadPhotos(opts: { category?: string; city?: string; limit?: number; offset?: number } = {}) {
  const { category, city, limit = 24, offset = 0 } = opts;
  let q = supabase.from("photos").select("*").order("created_at", { ascending: false });
  if (category) q = q.eq("category", category);
  if (city) q = q.eq("city", city);
  q = q.range(offset, offset + limit - 1);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function loadPhotoById(id: string) {
  if (!id) return null;
  const { data: p, error } = await supabase.from("photos").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  if (!p) return null;
  if (p.album_id) {
    const { data: a } = await supabase.from("albums").select("title,city,cover_image_url").eq("id", p.album_id).maybeSingle();
    (p as any).albums = a || null;
  } else (p as any).albums = null;
  return p;
}

export async function loadRelatedPhotos(opts: { category?: string; album_id?: string; excludeId?: string; limit?: number } = {}) {
  const { category, album_id, excludeId, limit = 12 } = opts;
  let q = supabase.from("photos").select("*").order("created_at", { ascending: false }).limit(limit + 1);
  if (album_id) q = q.eq("album_id", album_id);
  else if (category) q = q.eq("category", category);
  const { data, error } = await q;
  if (error) throw error;
  return (data || []).filter((p: any) => p.id !== excludeId).slice(0, limit);
}

export async function loadEventCategories() {
  const { data, error } = await supabase.from("event_categories").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── auth ──
export async function getUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}
export async function signUp(p: { email: string; password: string; name: string }) {
  const { data, error } = await supabase.auth.signUp({
    email: p.email, password: p.password,
    options: { emailRedirectTo: window.location.origin, data: { name: p.name } },
  });
  if (error) throw error;
  return data;
}
export async function signIn(p: { email: string; password: string }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: p.email, password: p.password });
  if (error) throw error;
  return data;
}
export async function signOut() { await supabase.auth.signOut(); }
export async function signInWithGoogle() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google", options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

// ── wishlist ──
export async function listWishlist() {
  const u = await getUser(); if (!u) return [];
  const { data, error } = await supabase.from("wishlist_items").select("target_type,target_id");
  if (error) throw error;
  return data || [];
}
export async function toggleWishlist(target_type: string, target_id: string) {
  const u = await getUser(); if (!u) throw new Error("not_authenticated");
  const tt = target_type as "venue" | "vendor";
  const { data: existing } = await supabase.from("wishlist_items").select("id")
    .eq("user_id", u.id).eq("target_type", tt).eq("target_id", target_id).maybeSingle();
  if (existing) { await supabase.from("wishlist_items").delete().eq("id", (existing as any).id); return false; }
  const { error } = await supabase.from("wishlist_items").insert({ user_id: u.id, target_type: tt, target_id });
  if (error) throw error;
  return true;
}

// ── reviews ──
export async function listReviews(target_type: string, target_id: string) {
  const { data, error } = await supabase.from("reviews")
    .select("id,rating,comment,created_at,user_id")
    .eq("target_type", target_type as "venue" | "vendor").eq("target_id", target_id)
    .order("created_at", { ascending: false }).limit(20);
  if (error) throw error;
  return data || [];
}
export async function submitReview(p: { target_type: string; target_id: string; rating: number; comment: string }) {
  const u = await getUser(); if (!u) throw new Error("not_authenticated");
  const { error } = await supabase.from("reviews").insert({
    user_id: u.id,
    target_type: p.target_type as "venue" | "vendor",
    target_id: p.target_id,
    rating: p.rating,
    comment: p.comment,
  });
  if (error) throw error;
}

// ── enquiries ──
export async function submitEnquiry(payload: any) {
  const u = await getUser(); if (!u) throw new Error("not_authenticated");
  const { error } = await supabase.from("enquiries").insert({ ...payload, user_id: u.id });
  if (error) throw error;
}

// ── cart ──
export async function addToCart(p: { target_type: string; target_id: string; quantity?: number; meta?: any }) {
  const u = await getUser(); if (!u) throw new Error("not_authenticated");
  const tt = p.target_type as "venue" | "vendor";
  const quantity = p.quantity ?? 1;
  const { data: existing } = await supabase.from("cart_items").select("id,quantity")
    .eq("user_id", u.id).eq("target_type", tt).eq("target_id", p.target_id).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("cart_items")
      .update({ quantity: (existing as any).quantity + quantity, meta: p.meta || {} }).eq("id", (existing as any).id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("cart_items").insert({
      user_id: u.id, target_type: tt, target_id: p.target_id, quantity, meta: p.meta || {},
    });
    if (error) throw error;
  }
}

export type CartItem = {
  id: string; target_type: string; target_id: string; quantity: number;
  title: string; subtitle: string; image: string | null; unit_price: number; meta?: any;
};

export async function listCart(): Promise<CartItem[]> {
  const u = await getUser(); if (!u) return [];
  const { data: items, error } = await supabase.from("cart_items").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  if (!items?.length) return [];
  const venueIds = items.filter((i) => i.target_type === "venue").map((i) => i.target_id);
  const vendorIds = items.filter((i) => i.target_type === "vendor").map((i) => i.target_id);
  const [venues, vendors] = await Promise.all([
    venueIds.length
      ? supabase.from("venues").select("id,name,city,area,cover_image_url,veg_price,non_veg_price,rental_price").in("id", venueIds)
      : Promise.resolve({ data: [] as any[] }),
    vendorIds.length
      ? supabase.from("vendor_listings").select("id,title,category,city,cover_image_url,price_from").in("id", vendorIds)
      : Promise.resolve({ data: [] as any[] }),
  ]);
  const vMap = new Map((venues.data || []).map((v: any) => [v.id, v]));
  const vlMap = new Map((vendors.data || []).map((v: any) => [v.id, v]));
  return items.map((it: any) => {
    if (it.target_type === "venue") {
      const v: any = vMap.get(it.target_id);
      const unit_price = v ? (v.rental_price ?? v.veg_price ?? v.non_veg_price ?? 0) : 0;
      return { ...it, title: v?.name || "Venue", subtitle: [v?.area, v?.city].filter(Boolean).join(", "), image: v?.cover_image_url, unit_price };
    }
    const vl: any = vlMap.get(it.target_id);
    return { ...it, title: vl?.title || "Service", subtitle: [vl?.category, vl?.city].filter(Boolean).join(" · "), image: vl?.cover_image_url, unit_price: vl?.price_from ?? 0 };
  });
}
export async function updateCartQty(id: string, quantity: number) {
  if (quantity < 1) return removeFromCart(id);
  const { error } = await supabase.from("cart_items").update({ quantity }).eq("id", id);
  if (error) throw error;
}
export async function removeFromCart(id: string) {
  const { error } = await supabase.from("cart_items").delete().eq("id", id);
  if (error) throw error;
}
export async function cartCount() {
  const u = await getUser(); if (!u) return 0;
  const { count } = await supabase.from("cart_items").select("*", { count: "exact", head: true });
  return count || 0;
}

// ── bookings ──
export async function createBooking(p: {
  items: Array<CartItem & { cart_id?: string }>;
  event_date?: string; guest_count?: number; contact_phone?: string; notes?: string;
  payment_method: string; payment_type?: "deposit" | "full";
}) {
  const u = await getUser(); if (!u) throw new Error("not_authenticated");
  if (!p.items?.length) throw new Error("Cart is empty");
  const subtotal = p.items.reduce((s, it) => s + (Number(it.unit_price) || 0) * (it.quantity || 1), 0);
  const total_amount = subtotal;
  const deposit_amount = Math.round(total_amount * 0.2);
  const receipt_number = `BK-${new Date().getFullYear()}-${Math.floor(Math.random() * 99999).toString().padStart(5, "0")}`;
  const { data: booking, error } = await supabase.from("bookings").insert({
    user_id: u.id, status: "pending",
    subtotal, total_amount, deposit_amount, currency: "BDT",
    event_date: p.event_date, guest_count: p.guest_count, contact_phone: p.contact_phone, notes: p.notes,
    payment_method: p.payment_method, payment_type: p.payment_type ?? "deposit",
    receipt_number,
  }).select().single();
  if (error) throw error;
  const lineItems = p.items.map((it) => ({
    booking_id: booking.id,
    target_type: it.target_type as "venue" | "vendor", target_id: it.target_id,
    title_snapshot: it.title, image_snapshot: it.image,
    unit_price: it.unit_price, quantity: it.quantity || 1,
    line_total: (Number(it.unit_price) || 0) * (it.quantity || 1),
    meta: it.meta || {},
  }));
  const { error: liErr } = await supabase.from("booking_items").insert(lineItems);
  if (liErr) throw liErr;
  const ids = p.items.map((it: any) => it.cart_id || it.id).filter(Boolean);
  if (ids.length) await supabase.from("cart_items").delete().in("id", ids);
  return booking;
}

export async function listMyBookings() {
  const u = await getUser(); if (!u) return [];
  const { data, error } = await supabase.from("bookings")
    .select("*, booking_items(*)").order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── admin ──
export async function isAdmin() {
  const u = await getUser(); if (!u) return false;
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id).eq("role", "admin").maybeSingle();
  return !!data;
}
export async function adminListBookings(opts: { status?: string; limit?: number } = {}) {
  let q = supabase.from("bookings").select("*, booking_items(*), payment_proofs(*)")
    .order("created_at", { ascending: false }).limit(opts.limit ?? 100);
  if (opts.status) q = q.eq("status", opts.status as any);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
export async function adminUpdateBooking(id: string, patch: any) {
  const { error } = await supabase.from("bookings").update(patch).eq("id", id);
  if (error) throw error;
}
// ── admin generic CRUD ──
export type AdminTable =
  | "venues" | "vendor_profiles" | "vendor_listings"
  | "albums" | "photos" | "event_categories"
  | "pricing_rules" | "bookings" | "transactions"
  | "user_roles" | "profiles" | "enquiries";

export async function adminList(table: AdminTable, opts: { limit?: number; orderBy?: string; ascending?: boolean } = {}) {
  const { limit = 200, orderBy = "created_at", ascending = false } = opts;
  const { data, error } = await supabase.from(table as any).select("*").order(orderBy, { ascending }).limit(limit);
  if (error) throw error;
  return data || [];
}
export async function adminCreate(table: AdminTable, row: any) {
  const { data, error } = await supabase.from(table as any).insert(row).select().single();
  if (error) throw error;
  return data;
}
export async function adminUpdate(table: AdminTable, id: string, patch: any) {
  const { data, error } = await supabase.from(table as any).update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data;
}
export async function adminDelete(table: AdminTable, id: string) {
  const { error } = await supabase.from(table as any).delete().eq("id", id);
  if (error) throw error;
}
export async function adminStats() {
  const tables: AdminTable[] = ["venues", "vendor_listings", "bookings", "profiles"];
  const counts: Record<string, number> = {};
  await Promise.all(tables.map(async (t) => {
    const { count } = await supabase.from(t as any).select("*", { count: "exact", head: true });
    counts[t] = count || 0;
  }));
  const { data: revenue } = await supabase.from("bookings").select("amount_paid");
  counts.revenue = (revenue || []).reduce((s: number, b: any) => s + Number(b.amount_paid || 0), 0);
  return counts;
}
