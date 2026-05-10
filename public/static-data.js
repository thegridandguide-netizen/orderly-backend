/* Eventix – Lovable Cloud data layer for the static site.
   Exposes window.eventixData with read-only loaders backed by Supabase. */
(function () {
  // ──────────────────────────────────────────────────────────────────────
  // SUPABASE CONNECTION  (the ONLY place the static site connects to Supabase)
  //
  // To point this app at your OWN Supabase project:
  //   1. Create a project at https://supabase.com/dashboard
  //   2. Run supabase/schema-export.sql in its SQL Editor
  //   3. Replace the two values below with your project's URL + anon key
  //      (Settings → API in the Supabase dashboard)
  //
  // The anon key is safe to commit — Row Level Security policies on every
  // table (see supabase/migrations/) protect the data.
  // ──────────────────────────────────────────────────────────────────────
  const SUPABASE_URL = "https://hkmahmlyuveklxvzcgug.supabase.co";
  const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhrbWFobWx5dXZla2x4dnpjZ3VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NjAzNTMsImV4cCI6MjA5MzIzNjM1M30.ZfSivYhGTdfYRXVm6HLkx-RdbLrXgF-ykRR1VHMQ-TU";

  // supabase-js is loaded from the CDN by each HTML page (see <script> tags).
  // window.supabase is the UMD namespace it exposes.
  const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true },
  });

  // ── helpers ────────────────────────────────────────────────────────────
  const fmtBDT = (n) =>
    n == null
      ? null
      : "৳ " +
        new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  // Map a DB venue row to the shape buildVenueCard() in app.js expects.
  function toVenueCard(v) {
    const pricing = [];
    if (v.veg_price != null)
      pricing.push({ label: "Veg", value: fmtBDT(v.veg_price), unit: "person" });
    if (v.non_veg_price != null)
      pricing.push({ label: "Non-veg", value: fmtBDT(v.non_veg_price), unit: "person" });
    if (v.rental_price != null && pricing.length === 0)
      pricing.push({ label: "Starting", value: fmtBDT(v.rental_price) });

    const capacityPax =
      v.capacity_min != null && v.capacity_max != null
        ? `${v.capacity_min}–${v.capacity_max} pax`
        : "";

    return {
      id: v.id,
      name: v.name,
      rating: (v.rating_avg ?? 0).toFixed(1),
      location: [v.area, v.city].filter(Boolean).join(", "),
      tags: v.tags || [],
      img: v.cover_image_url,
      pricing,
      capacityPax,
      rooms: v.rooms ? `${v.rooms} Rooms` : "",
      handpicked: !!v.handpicked,
    };
  }

  // ── venues ────────────────────────────────────────────────────────────
  async function loadVenues({
    city,
    handpicked,
    minRating,
    venueType,
    limit = 12,
    offset = 0,
    sort = "recommended",
  } = {}) {
    let q = sb
      .from("venues")
      .select(
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

  // ── vendor listings ───────────────────────────────────────────────────
  async function loadVendors({ city, category, minRating, verifiedOnly, limit = 12, offset = 0, sort = "recommended" } = {}) {
    // NOTE: Do NOT rely on PostgREST embedded joins here. Some environments
    // (or partially applied migrations) may not have FK relationships exposed,
    // which would cause queries like vendor_profiles!inner(...) to fail.
    // We fetch listings first, then optionally filter by verified vendors via
    // a second query to vendor_profiles.
    let q = sb
      .from("vendor_listings")
      .select(
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

    let rows = data || [];
    if (verifiedOnly) {
      const ids = rows.map((r) => r.vendor_profile_id).filter(Boolean);
      if (ids.length) {
        const { data: profs, error: e2 } = await sb
          .from("vendor_profiles")
          .select("id,verified")
          .in("id", ids);
        if (e2) throw e2;
        const verifiedSet = new Set((profs || []).filter((p) => p.verified).map((p) => p.id));
        rows = rows.filter((r) => r.vendor_profile_id && verifiedSet.has(r.vendor_profile_id));
      } else {
        rows = [];
      }
    }

    return rows;
  }

  // ── albums + photos ───────────────────────────────────────────────────
  async function loadAlbums({ featured, limit = 12, offset = 0 } = {}) {
    let q = sb.from("albums").select("*").order("created_at", { ascending: false });
    if (featured != null) q = q.eq("featured", featured);
    q = q.range(offset, offset + limit - 1);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }
  async function loadPhotos({ category, city, limit = 24, offset = 0 } = {}) {
    let q = sb.from("photos").select("*").order("created_at", { ascending: false });
    if (category) q = q.eq("category", category);
    if (city) q = q.eq("city", city);
    q = q.range(offset, offset + limit - 1);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }

  // ── explore categories ────────────────────────────────────────────────
  async function loadEventCategories() {
    const { data, error } = await sb
      .from("event_categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return data || [];
  }

  // ── search (basic ILIKE across venues + vendor_listings + albums) ─────
  async function search(qstr) {
    if (!qstr) return { venues: [], vendors: [], albums: [] };
    const like = `%${qstr}%`;
    const [venues, vendors, albums] = await Promise.all([
      sb.from("venues").select("id,name,city,cover_image_url").ilike("name", like).limit(5),
      sb.from("vendor_listings").select("id,title,category,city,cover_image_url").ilike("title", like).limit(5),
      sb.from("albums").select("id,title,city,cover_image_url").ilike("title", like).limit(5),
    ]);
    return {
      venues: venues.data || [],
      vendors: vendors.data || [],
      albums: albums.data || [],
    };
  }

  // ── auth ──────────────────────────────────────────────────────────────
  async function getUser() {
    const { data } = await sb.auth.getUser();
    return data.user || null;
  }
  async function signUp({ email, password, name }) {
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/static/index.html",
        data: { name },
      },
    });
    if (error) throw error;
    return data;
  }
  async function signIn({ email, password }) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }
  async function signOut() {
    await sb.auth.signOut();
  }
  async function signInWithGoogle() {
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/static/index.html" },
    });
    if (error) throw error;
  }
  function onAuth(cb) {
    cb(null); // initial
    sb.auth.getSession().then(({ data }) => cb(data.session?.user || null));
    return sb.auth.onAuthStateChange((_e, session) => cb(session?.user || null));
  }

  // ── wishlist ──────────────────────────────────────────────────────────
  async function listWishlist() {
    const u = await getUser();
    if (!u) return [];
    const { data, error } = await sb
      .from("wishlist_items")
      .select("target_type,target_id");
    if (error) throw error;
    return data || [];
  }
  async function toggleWishlist(target_type, target_id) {
    const u = await getUser();
    if (!u) throw new Error("not_authenticated");
    const { data: existing } = await sb
      .from("wishlist_items")
      .select("id")
      .eq("user_id", u.id)
      .eq("target_type", target_type)
      .eq("target_id", target_id)
      .maybeSingle();
    if (existing) {
      await sb.from("wishlist_items").delete().eq("id", existing.id);
      return false;
    }
    const { error } = await sb.from("wishlist_items").insert({
      user_id: u.id, target_type, target_id,
    });
    if (error) throw error;
    return true;
  }

  // ── reviews ───────────────────────────────────────────────────────────
  async function listReviews(target_type, target_id) {
    const { data, error } = await sb
      .from("reviews")
      .select("id,rating,comment,created_at,user_id")
      .eq("target_type", target_type)
      .eq("target_id", target_id)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return data || [];
  }
  async function submitReview({ target_type, target_id, rating, comment }) {
    const u = await getUser();
    if (!u) throw new Error("not_authenticated");
    const { error } = await sb.from("reviews").insert({
      user_id: u.id, target_type, target_id, rating, comment,
    });
    if (error) throw error;
  }

  // ── enquiries ─────────────────────────────────────────────────────────
  async function submitEnquiry(payload) {
    const u = await getUser();
    if (!u) throw new Error("not_authenticated");
    const { error } = await sb.from("enquiries").insert({ ...payload, user_id: u.id });
    if (error) throw error;
  }

  // ── cart ──────────────────────────────────────────────────────────────
  async function addToCart({ target_type, target_id, quantity = 1, meta = {} }) {
    const u = await getUser();
    if (!u) throw new Error("not_authenticated");
    const { data: existing } = await sb
      .from("cart_items").select("id,quantity")
      .eq("user_id", u.id).eq("target_type", target_type).eq("target_id", target_id)
      .maybeSingle();
    if (existing) {
      const { error } = await sb.from("cart_items")
        .update({ quantity: existing.quantity + quantity, meta }).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await sb.from("cart_items").insert({
        user_id: u.id, target_type, target_id, quantity, meta,
      });
      if (error) throw error;
    }
  }
  async function listCart() {
    const u = await getUser();
    if (!u) return [];
    const { data: items, error } = await sb
      .from("cart_items").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    if (!items?.length) return [];
    // Hydrate venue/vendor details
    const venueIds = items.filter(i => i.target_type === "venue").map(i => i.target_id);
    const vendorIds = items.filter(i => i.target_type === "vendor").map(i => i.target_id);
    const [venues, vendors] = await Promise.all([
      venueIds.length
        ? sb.from("venues").select("id,name,city,area,cover_image_url,veg_price,non_veg_price,rental_price").in("id", venueIds)
        : Promise.resolve({ data: [] }),
      vendorIds.length
        ? sb.from("vendor_listings").select("id,title,category,city,cover_image_url,price_from").in("id", vendorIds)
        : Promise.resolve({ data: [] }),
    ]);
    const vMap = new Map((venues.data || []).map(v => [v.id, v]));
    const vlMap = new Map((vendors.data || []).map(v => [v.id, v]));
    return items.map(it => {
      if (it.target_type === "venue") {
        const v = vMap.get(it.target_id);
        const unit_price = v ? (v.rental_price ?? v.veg_price ?? v.non_veg_price ?? 0) : 0;
        return { ...it, title: v?.name || "Venue", subtitle: [v?.area, v?.city].filter(Boolean).join(", "), image: v?.cover_image_url, unit_price };
      }
      const vl = vlMap.get(it.target_id);
      return { ...it, title: vl?.title || "Service", subtitle: [vl?.category, vl?.city].filter(Boolean).join(" · "), image: vl?.cover_image_url, unit_price: vl?.price_from ?? 0 };
    });
  }
  async function updateCartQty(id, quantity) {
    if (quantity < 1) return removeFromCart(id);
    const { error } = await sb.from("cart_items").update({ quantity }).eq("id", id);
    if (error) throw error;
  }
  async function removeFromCart(id) {
    const { error } = await sb.from("cart_items").delete().eq("id", id);
    if (error) throw error;
  }
  async function cartCount() {
    const u = await getUser();
    if (!u) return 0;
    const { count } = await sb.from("cart_items").select("*", { count: "exact", head: true });
    return count || 0;
  }

  // ── bookings ──────────────────────────────────────────────────────────
  const DEPOSIT_RATE = 0.2; // 20%

  async function createBooking({
    items, // [{ target_type, target_id, title, image, unit_price, quantity, meta }]
    event_date, guest_count, contact_phone, notes,
    payment_method, payment_type = "deposit", // deposit|full
  }) {
    const u = await getUser();
    if (!u) throw new Error("not_authenticated");
    if (!items?.length) throw new Error("Cart is empty");

    const subtotal = items.reduce((s, it) => s + (Number(it.unit_price) || 0) * (it.quantity || 1), 0);
    const total_amount = subtotal;
    const deposit_amount = Math.round(total_amount * DEPOSIT_RATE);

    const { data: rn } = await sb.rpc("next_receipt_number").single().then(r => r, () => ({ data: null }));
    const receipt_number = rn || `BK-${new Date().getFullYear()}-${Math.floor(Math.random()*99999).toString().padStart(5,"0")}`;

    const { data: booking, error } = await sb.from("bookings").insert({
      user_id: u.id,
      status: "pending",
      subtotal, total_amount, deposit_amount,
      currency: "BDT",
      event_date, guest_count, contact_phone, notes,
      payment_method, payment_type,
      receipt_number,
    }).select().single();
    if (error) throw error;

    const lineItems = items.map(it => ({
      booking_id: booking.id,
      target_type: it.target_type,
      target_id: it.target_id,
      title_snapshot: it.title,
      image_snapshot: it.image,
      unit_price: it.unit_price,
      quantity: it.quantity || 1,
      line_total: (Number(it.unit_price) || 0) * (it.quantity || 1),
      meta: it.meta || {},
    }));
    const { error: liErr } = await sb.from("booking_items").insert(lineItems);
    if (liErr) throw liErr;

    // Clear cart items that were checked out
    const ids = items.filter(it => it.cart_id).map(it => it.cart_id);
    if (ids.length) await sb.from("cart_items").delete().in("id", ids);

    return booking;
  }

  async function listMyBookings() {
    const u = await getUser();
    if (!u) return [];
    const { data, error } = await sb.from("bookings").select("*, booking_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }
  async function getBooking(id) {
    const { data, error } = await sb.from("bookings").select("*, booking_items(*)").eq("id", id).maybeSingle();
    if (error) throw error;
    return data;
  }

  // ── payment proofs ────────────────────────────────────────────────────
  async function uploadPaymentProof({ booking_id, file, reference, amount, note }) {
    const u = await getUser();
    if (!u) throw new Error("not_authenticated");
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${u.id}/${booking_id}-${Date.now()}.${ext}`;
    const { error: upErr } = await sb.storage.from("payment-proofs").upload(path, file, { upsert: false });
    if (upErr) throw upErr;
    const { data: signed } = await sb.storage.from("payment-proofs").createSignedUrl(path, 60 * 60 * 24 * 365);
    const image_url = signed?.signedUrl || path;
    const { error } = await sb.from("payment_proofs").insert({
      booking_id, user_id: u.id, image_url, reference, amount, note,
    });
    if (error) throw error;
  }
  async function listProofs(booking_id) {
    const { data, error } = await sb.from("payment_proofs").select("*").eq("booking_id", booking_id).order("created_at", { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // ── settings ──────────────────────────────────────────────────────────
  async function getSetting(key) {
    const { data } = await sb.from("site_settings").select("value").eq("key", key).maybeSingle();
    return data?.value || null;
  }

  // ── admin helpers ─────────────────────────────────────────────────────
  async function isAdmin() {
    const u = await getUser();
    if (!u) return false;
    const { data } = await sb.from("profiles").select("role").eq("id", u.id).maybeSingle();
    return data?.role === "admin";
  }
  async function adminListBookings({ status, limit = 100 } = {}) {
    let q = sb.from("bookings").select("*, booking_items(*), payment_proofs(*)").order("created_at", { ascending: false }).limit(limit);
    if (status) q = q.eq("status", status);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  }
  async function adminUpdateBooking(id, patch) {
    const { error } = await sb.from("bookings").update(patch).eq("id", id);
    if (error) throw error;
  }
  async function adminApproveProof(id, approved) {
    const { error } = await sb.from("payment_proofs").update({ approved }).eq("id", id);
    if (error) throw error;
  }

  // PDF receipt: generated client-side via window.pdfReceipt (loaded by my-bookings.html)
  function pdfReceiptUrl(booking) {
    return null; // placeholder hook, generated client-side on demand
  }


  // ── vendor + photo details ───────────────────────────────────────────
  async function loadVendorById(id) {
    if (!id) return null;
    const { data: v, error } = await sb
      .from("vendor_listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!v) return null;

    // Manual join to avoid relying on FK relationship exposure.
    if (v.vendor_profile_id) {
      const { data: p, error: e2 } = await sb
        .from("vendor_profiles")
        .select("business_name,phone,city,service_areas,categories,verified,price_from,price_to,cover_image_url")
        .eq("id", v.vendor_profile_id)
        .maybeSingle();
      if (e2) throw e2;
      v.vendor_profiles = p || null;
    } else {
      v.vendor_profiles = null;
    }
    return v;
  }

  async function loadSimilarVendors({ city, category, excludeId, limit = 6 } = {}) {
    let q = sb
      .from("vendor_listings")
      .select("id,title,category,city,price_from,price_to,rating_avg,rating_count,cover_image_url,badge,gallery_image_urls")
      .order("rating_avg", { ascending: false })
      .limit(limit + 1);
    if (city) q = q.eq("city", city);
    if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).filter((v) => v.id !== excludeId).slice(0, limit);
  }

  async function loadPhotoById(id) {
    if (!id) return null;
    const { data: p, error } = await sb
      .from("photos")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (!p) return null;

    // Manual join to avoid relying on FK relationship exposure.
    if (p.album_id) {
      const { data: a, error: e2 } = await sb
        .from("albums")
        .select("title,city,cover_image_url")
        .eq("id", p.album_id)
        .maybeSingle();
      if (e2) throw e2;
      p.albums = a || null;
    } else {
      p.albums = null;
    }
    return p;
  }

  async function loadRelatedPhotos({ category, album_id, excludeId, limit = 12 } = {}) {
    let q = sb
      .from("photos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit + 1);
    if (album_id) q = q.eq("album_id", album_id);
    else if (category) q = q.eq("category", category);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).filter((p) => p.id !== excludeId).slice(0, limit);
  }

  // ── venue details ─────────────────────────────────────────────────────
  async function loadVenueById(id) {
    if (!id) return null;
    const { data, error } = await sb
      .from("venues")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async function loadSimilarVenues({ city, excludeId, limit = 6 } = {}) {
    let q = sb
      .from("venues")
      .select(
        "id,name,city,area,tags,handpicked,veg_price,non_veg_price,rental_price,capacity_min,capacity_max,rooms,rating_avg,cover_image_url"
      )
      .order("rating_avg", { ascending: false })
      .limit(limit + 1);
    if (city) q = q.eq("city", city);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []).filter((v) => v.id !== excludeId).slice(0, limit).map(toVenueCard);
  }

  window.eventixData = {
    sb,
    loadVenues, loadVendors, loadAlbums, loadPhotos, loadEventCategories, search,
    loadVenueById, loadSimilarVenues,
    loadVendorById, loadSimilarVendors,
    loadPhotoById, loadRelatedPhotos,
    getUser, signUp, signIn, signOut, signInWithGoogle, onAuth,
    listWishlist, toggleWishlist,
    listReviews, submitReview,
    submitEnquiry,
    addToCart, listCart, updateCartQty, removeFromCart, cartCount,
    createBooking, listMyBookings, getBooking,
    uploadPaymentProof, listProofs,
    getSetting,
    isAdmin, adminListBookings, adminUpdateBooking, adminApproveProof,
    pdfReceiptUrl,
    DEPOSIT_RATE,
  };
})();
