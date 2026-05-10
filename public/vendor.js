/* Vendor details page logic (WedMeGood-style, matching venue.html UI) */
(function () {
  const params = new URLSearchParams(location.search);
  const vendorId = params.get("id");

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const fmtBDT = (n) =>
    n == null ? null : "৳ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n));

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1520975958225-11d8c7f49b1d?w=900";
  const FALLBACK_SERVICES = [
    { i: "fa-camera", t: "Professional Portfolio" },
    { i: "fa-calendar-check", t: "Date Hold Available" },
    { i: "fa-user-group", t: "Team Support" },
    { i: "fa-location-dot", t: "On-location Service" },
    { i: "fa-bolt", t: "Fast Turnaround" },
    { i: "fa-star", t: "Top-rated" },
  ];
  const FALLBACK_POLICIES = [
    "Advance payment required to confirm",
    "Final quote depends on event details",
    "Travel/outstation charges may apply",
    "Edits delivered within agreed timeline",
  ];
  const FALLBACK_FAQS = [
    { q: "How do I book this vendor?", a: "Send an enquiry with your date, location and requirements. The vendor will reply with availability and a quote." },
    { q: "Do you take advance payment?", a: "Yes, most vendors require an advance to block your date. Exact percentage varies by package." },
    { q: "Do you travel outside the city?", a: "Many vendors offer outstation services. Travel and accommodation may be charged separately." },
    { q: "Can I customize the package?", a: "Absolutely. Share your needs and budget; the vendor can propose a tailored quote." },
  ];

  function showNotFound() {
    $("#vdLoading").style.display = "none";
    $("#vdNotFound").style.display = "block";
  }

  function normalizeProfile(v) {
    // Supabase join sometimes returns object or array depending on relation.
    const p = v.vendor_profiles;
    if (!p) return null;
    if (Array.isArray(p)) return p[0] || null;
    return p;
  }

  function buildGallery(images) {
    const root = $("#vdGallery");
    root.innerHTML = "";
    const main = document.createElement("div");
    main.className = "vg-item vg-main";
    main.innerHTML = `<img src="${images[0]}" alt="Vendor main photo">`;
    main.onclick = () => openLightbox(0);
    root.appendChild(main);

    for (let i = 1; i < Math.min(5, images.length); i++) {
      const it = document.createElement("div");
      it.className = "vg-item";
      it.innerHTML = `<img src="${images[i]}" alt="Vendor photo ${i + 1}">`;
      it.onclick = () => openLightbox(i);
      root.appendChild(it);
    }

    if (images.length > 1) {
      const btn = document.createElement("button");
      btn.className = "vg-view-all";
      btn.innerHTML = `<i class="fa-regular fa-images"></i> View all ${images.length} photos`;
      btn.onclick = () => openLightbox(0);
      root.appendChild(btn);
    }
  }

  // Lightbox
  let lbImages = [], lbIdx = 0;
  function openLightbox(i) {
    if (!lbImages.length) return;
    lbIdx = i;
    $("#vlImg").src = lbImages[lbIdx];
    $("#vdLightbox").classList.add("open");
  }
  function closeLightbox() { $("#vdLightbox").classList.remove("open"); }
  function nav(d) {
    lbIdx = (lbIdx + d + lbImages.length) % lbImages.length;
    $("#vlImg").src = lbImages[lbIdx];
  }
  $("#vlClose").onclick = closeLightbox;
  $("#vlPrev").onclick = () => nav(-1);
  $("#vlNext").onclick = () => nav(1);
  $("#vdLightbox").addEventListener("click", (e) => { if (e.target.id === "vdLightbox") closeLightbox(); });
  document.addEventListener("keydown", (e) => {
    if (!$("#vdLightbox").classList.contains("open")) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "ArrowLeft") nav(-1);
    if (e.key === "ArrowRight") nav(1);
  });

  function buildQuickInfo(v, profile) {
    const items = [];
    if (v.category) items.push(`<span class="qi"><i class="fa-solid fa-tag"></i> ${v.category}</span>`);
    if (profile?.verified) items.push(`<span class="qi"><i class="fa-solid fa-circle-check"></i> Verified</span>`);
    if (profile?.service_areas?.length) {
      items.push(`<span class="qi"><i class="fa-solid fa-location-dot"></i> ${profile.service_areas.slice(0, 3).join(", ")}${profile.service_areas.length > 3 ? "…" : ""}</span>`);
    }
    if (v.badge) items.push(`<span class="qi"><i class="fa-solid fa-award"></i> ${v.badge}</span>`);
    items.push(`<span class="qi"><i class="fa-solid fa-calendar-days"></i> Date hold available</span>`);
    $("#vdQuickInfo").innerHTML = items.join("");
  }

  function buildPrice(v, profile) {
    const from = v.price_from ?? profile?.price_from;
    const to = v.price_to ?? profile?.price_to;

    let price = "On request";
    if (from != null && to != null) price = `${fmtBDT(from)} – ${fmtBDT(to)}`;
    else if (from != null) price = `From ${fmtBDT(from)}`;
    else if (to != null) price = `Up to ${fmtBDT(to)}`;

    $("#vdPrice").innerHTML = price;
  }

  function buildServices(v, profile) {
    const items = [];
    const cats = [];
    if (v.category) cats.push(v.category);
    if (Array.isArray(profile?.categories)) cats.push(...profile.categories);

    // unique categories
    const uniqCats = Array.from(new Set(cats.filter(Boolean))).slice(0, 6);
    uniqCats.forEach((c) => items.push({ i: "fa-tag", t: c }));

    const areas = Array.isArray(profile?.service_areas) ? profile.service_areas.slice(0, 3) : [];
    areas.forEach((a) => items.push({ i: "fa-location-dot", t: a }));

    const list = items.length ? items : FALLBACK_SERVICES;
    $("#vdAmenities").innerHTML = list
      .slice(0, 9)
      .map((a) => `<div class="vd-am"><i class="fa-solid ${a.i}"></i> ${a.t}</div>`)
      .join("");
  }

  function buildPolicies() {
    $("#vdPolicies").innerHTML = FALLBACK_POLICIES
      .map((p) => `<li><i class="fa-solid fa-circle-check"></i> ${p}</li>`)
      .join("");
  }

  function buildFaqs() {
    $("#vdFaqs").innerHTML = FALLBACK_FAQS
      .map((f) => `<details class="vd-faq"><summary>${f.q}</summary><div class="vd-faq-body">${f.a}</div></details>`)
      .join("");
  }

  async function buildReviews(v) {
    let reviews = [];
    try { reviews = await window.eventixData.listReviews("vendor", v.id); } catch (_) {}

    const total = reviews.length || v.rating_count || 0;
    const avg = total ? (reviews.reduce((s, r) => s + r.rating, 0) / (reviews.length || 1) || v.rating_avg || 0) : (v.rating_avg || 0);

    $("#vdRevBig").textContent = (Number(avg) || 0).toFixed(1);

    const dist = [5, 4, 3, 2, 1]
      .map((s) => {
        const c = reviews.filter((r) => Math.round(r.rating) === s).length;
        const pct = total ? Math.round((c / total) * 100) : 0;
        return `<div class="vd-rev-bar"><span style="width:14px;">${s}★</span><div class="bar"><span style="width:${pct}%"></span></div><span>${c}</span></div>`;
      })
      .join("");
    $("#vdRevBars").innerHTML = dist;

    if (!reviews.length) {
      $("#vdReviewList").innerHTML = `<p style="color:#888;font-size:13px;">No reviews yet — be the first to share your experience.</p>`;
      return;
    }

    $("#vdReviewList").innerHTML = reviews
      .slice(0, 8)
      .map(
        (r) => `
      <div class="vd-review">
        <div class="vd-review-head">
          <span class="vd-review-name">Client</span>
          <span class="vd-review-date">${new Date(r.created_at).toLocaleDateString()}</span>
        </div>
        <div class="vd-review-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
        <p>${r.comment || ""}</p>
      </div>
    `
      )
      .join("");
  }

  async function buildSimilar(v) {
    try {
      const rows = await window.eventixData.loadSimilarVendors({ city: v.city, category: v.category, excludeId: v.id, limit: 6 });
      const grid = $("#vdSimilar");
      grid.innerHTML = "";
      rows.forEach((r) => {
        const card = document.createElement("div");
        card.className = "vendor-card";
        card.style.cursor = "pointer";
        card.onclick = () => (location.href = `vendor.html?id=${encodeURIComponent(r.id)}`);
        const price = r.price_from != null ? `From ${fmtBDT(r.price_from)}` : "On request";
        const rating = (Number(r.rating_avg) || 0).toFixed(1);
        const count = r.rating_count || 0;
        card.innerHTML = `
          <div class="card-img-container">
            <img src="${r.cover_image_url || FALLBACK_IMG}" alt="${r.title}">
            <button class="wishlist-btn" data-wishlist-type="vendor" data-wishlist-id="${r.id}"><i class="fa-regular fa-heart"></i></button>
          </div>
          <div class="vendor-info">
            <span class="category-tag">${r.category || "Vendor"}</span>
            <h3>${r.title}</h3>
            <p class="location"><i class="fa-solid fa-location-dot"></i> ${r.city || ""}</p>
            ${r.badge ? `<span class="vendor-badge">${r.badge}</span>` : ""}
            <div class="vendor-stats">
              <span class="vendor-rating"><i class="fa-solid fa-star"></i> ${rating} (${count})</span>
              <span class="price-tag">${price}</span>
            </div>
          </div>
        `;
        grid.appendChild(card);
      });
      window.bindWishlistButtons?.(grid);
    } catch (e) {
      console.error(e);
    }
  }

  // Tabs
  function bindTabs() {
    const tabs = $$(".vd-tab");
    tabs.forEach((t) => {
      t.onclick = () => {
        const sec = $(`#sec-${t.dataset.tab}`);
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
    const sections = ["info", "photos", "about", "reviews", "faqs"].map((id) => $(`#sec-${id}`));
    if (!("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) {
            const id = en.target.id.replace("sec-", "");
            tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === id));
          }
        });
      },
      { rootMargin: "-120px 0px -60% 0px" }
    );
    sections.forEach((s) => s && obs.observe(s));
  }

  function bindShare(v) {
    $("#vdShare").onclick = async () => {
      const url = location.href;
      const title = v.title || "Vendor";
      if (navigator.share) {
        try { await navigator.share({ title, url }); } catch (_) {}
      } else {
        try { await navigator.clipboard.writeText(url); alert("Link copied!"); } catch (_) {}
      }
    };
  }

  function bindFav(v) {
    const btn = $("#vdFav");
    const i = btn.querySelector("i");
    let liked = false;

    async function refresh() {
      try {
        const u = await window.eventixData.getUser();
        if (!u) return;
        const items = await window.eventixData.listWishlist();
        liked = items.some((x) => x.target_type === "vendor" && x.target_id === v.id);
        i.className = liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
        btn.classList.toggle("active", liked);
      } catch (_) {}
    }
    refresh();

    btn.onclick = async () => {
      try {
        const newState = await window.eventixData.toggleWishlist("vendor", v.id);
        liked = newState;
        i.className = liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
        btn.classList.toggle("active", liked);
      } catch (e) {
        if (String(e.message).includes("not_authenticated")) {
          window.openM?.(document.getElementById("loginModal"));
        } else {
          alert(e.message || "Could not update wishlist");
        }
      }
    };
  }

  function bindCtas(v, profile) {
    $("#vdMsgBtn").onclick = () => $("#vdForm").scrollIntoView({ behavior: "smooth" });
    $("#vdContactBtn").onclick = async () => {
      const u = await window.eventixData.getUser();
      if (!u) { window.openM?.(document.getElementById("loginModal")); return; }
      const phone = profile?.phone ? profile.phone : "+880 1700-000001";
      const email = "vendors@eventix.com";
      alert(`Contact: ${phone}\nEmail: ${email}`);
    };

    $("#vdWriteReview").onclick = async () => {
      const u = await window.eventixData.getUser();
      if (!u) { window.openM?.(document.getElementById("loginModal")); return; }
      const ratingStr = prompt("Your rating (1–5):");
      const rating = parseInt(ratingStr, 10);
      if (!rating || rating < 1 || rating > 5) return alert("Please enter a number 1–5.");
      const comment = prompt("Your review:");
      if (!comment) return;
      try {
        await window.eventixData.submitReview({ target_type: "vendor", target_id: v.id, rating, comment });
        alert("Thanks! Review submitted.");
        buildReviews(v);
      } catch (e) { alert(e.message || "Failed to submit review"); }
    };
  }

  function bindForm(v) {
    const form = $("#vdForm");

    // Inject Add-to-Cart button above the enquiry form
    if (!document.getElementById("vdAddCartRow")) {
      const row = document.createElement("div");
      row.id = "vdAddCartRow";
      row.className = "vd-actions-row";
      row.innerHTML = `<button type="button" class="vd-add-cart" id="vdAddCart"><i class="fa-solid fa-cart-plus"></i> Add to Cart</button>`;
      form.parentNode.insertBefore(row, form);
      document.getElementById("vdAddCart").onclick = async () => {
        const u = await window.eventixData.getUser();
        if (!u) { window.openM?.(document.getElementById("loginModal")); return; }
        try {
          await window.eventixData.addToCart({ target_type: "vendor", target_id: v.id, quantity: 1 });
          window.refreshCartBadge?.();
          if (confirm("Added to cart. Go to cart now?")) location.href = "cart.html";
        } catch (e) { alert(e.message || "Failed to add"); }
      };
    }

    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const event_date = (fd.get("event_date") || "").toString();
      const budget_min = fd.get("budget_min") ? Number(fd.get("budget_min")) : null;
      const budget_max = fd.get("budget_max") ? Number(fd.get("budget_max")) : null;
      const service = (fd.get("service") || "").toString().trim();
      const name = (fd.get("name") || "").toString().trim();
      const phone = (fd.get("phone") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      const message = (fd.get("message") || "").toString().trim();

      if (!event_date || !name || !phone || !email || !message) {
        alert("Please fill in required fields.");
        return;
      }

      const u = await window.eventixData.getUser();
      if (!u) { window.openM?.(document.getElementById("loginModal")); return; }

      const submit = form.querySelector(".vd-submit");
      submit.disabled = true;
      const old = submit.textContent;
      submit.textContent = "Submitting…";

      try {
        const lines = [
          `Service: ${service || v.category || ""}`,
          `Name: ${name}`,
          `Email: ${email}`,
          budget_min != null || budget_max != null ? `Budget: ${budget_min != null ? fmtBDT(budget_min) : ""}${budget_min != null && budget_max != null ? " – " : ""}${budget_max != null ? fmtBDT(budget_max) : ""}` : "",
          `Message: ${message}`,
        ].filter(Boolean);

        await window.eventixData.submitEnquiry({
          target_type: "vendor",
          target_id: v.id,
          event_date,
          phone,
          message: lines.join("\n"),
        });

        alert("Enquiry sent! The vendor will get back to you.");
        form.reset();
      } catch (err) {
        alert(err.message || "Could not send enquiry");
      } finally {
        submit.disabled = false;
        submit.textContent = old;
      }
    };
  }

  async function init() {
    if (!vendorId) return showNotFound();

    let v;
    try {
      v = await window.eventixData.loadVendorById(vendorId);
    } catch (e) {
      console.error(e);
      return showNotFound();
    }
    if (!v) return showNotFound();

    const profile = normalizeProfile(v);

    document.title = `${v.title} – Eventix`;

    $("#vdLoading").style.display = "none";
    $("#vdContent").style.display = "block";

    $("#vdCrumb").textContent = v.title;
    $("#vdName").textContent = v.title;
    $("#vdLoc").textContent = [v.city].filter(Boolean).join(", ") || (profile?.city || "");
    $("#vdRating").textContent = (Number(v.rating_avg) || 0).toFixed(1);
    $("#vdRevCount").textContent = v.rating_count || 0;

    $("#vdShortDesc").textContent = v.description || `Meet ${v.title} — a trusted ${v.category || "vendor"} serving ${v.city || "your city"}. Browse the portfolio and send an enquiry to get a personalized quote.`;
    $("#vdLongDesc").textContent = v.description || `${v.title} provides professional ${v.category || "services"} for weddings and events. Share your event date, location, and requirements to receive a tailored quote and package options.`;

    const chips = [];
    if (profile?.verified) chips.push("Verified");
    if (v.badge) chips.push(v.badge);
    if (v.category) chips.push(v.category);
    (profile?.categories || []).slice(0, 6).forEach((c) => chips.push(c));
    $("#vdChips").innerHTML = Array.from(new Set(chips)).map((c) => `<span class="vd-chip">${c}</span>`).join("");

    const images = [v.cover_image_url, ...(v.gallery_image_urls || [])].filter(Boolean);
    if (!images.length) images.push(profile?.cover_image_url || FALLBACK_IMG);
    while (images.length < 5) images.push(images[0] || FALLBACK_IMG);

    lbImages = images;
    buildGallery(images);

    $("#vdPhotos").innerHTML = images.slice(0, 9).map((src, i) => `<img src="${src}" alt="Photo ${i + 1}" data-i="${i}">`).join("");
    $$("#vdPhotos img").forEach((img) => (img.onclick = () => openLightbox(parseInt(img.dataset.i, 10))));

    buildQuickInfo(v, profile);
    buildPrice(v, profile);
    buildServices(v, profile);
    buildPolicies();
    buildFaqs();
    buildReviews(v);
    buildSimilar(v);

    bindTabs();
    bindShare(v);
    bindFav(v);
    bindCtas(v, profile);
    bindForm(v);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
