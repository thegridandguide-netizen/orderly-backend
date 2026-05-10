/* Venue details page logic */
(function () {
  const params = new URLSearchParams(location.search);
  const venueId = params.get("id");

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const fmtBDT = (n) =>
    n == null ? null : "৳ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=900";
  const FALLBACK_AMENITIES = [
    { i: "fa-snowflake", t: "Air Conditioning" },
    { i: "fa-bolt", t: "Generator Backup" },
    { i: "fa-utensils", t: "In-house Catering" },
    { i: "fa-bell-concierge", t: "Bridal Room" },
    { i: "fa-square-parking", t: "Parking Available" },
    { i: "fa-wifi", t: "Free Wi-Fi" },
    { i: "fa-shield-halved", t: "24/7 Security" },
    { i: "fa-music", t: "DJ / Music Allowed" },
    { i: "fa-camera", t: "Photography Allowed" },
  ];
  const FALLBACK_POLICIES = [
    "Outside catering allowed",
    "Outside decoration allowed",
    "Music allowed till 11 PM",
    "Alcohol service permitted with license",
  ];
  const FALLBACK_FAQS = [
    { q: "What is the booking process?", a: "Submit an enquiry. The host will reach out within 24 hours to confirm availability and share a quote." },
    { q: "Is an advance payment required?", a: "Yes, typically 25–30% of the total amount is required to block the date." },
    { q: "What is the cancellation policy?", a: "Cancellations more than 60 days before the event are refundable (less a small admin fee). Closer to the date, refunds are partial." },
    { q: "Can we visit the venue before booking?", a: "Absolutely — site visits can be arranged on weekdays between 11 AM and 6 PM." },
  ];

  function showNotFound() {
    $("#vdLoading").style.display = "none";
    $("#vdNotFound").style.display = "block";
  }

  function buildGallery(images) {
    const root = $("#vdGallery");
    root.innerHTML = "";
    const main = document.createElement("div");
    main.className = "vg-item vg-main";
    main.innerHTML = `<img src="${images[0]}" alt="Venue main photo">`;
    main.onclick = () => openLightbox(0);
    root.appendChild(main);
    for (let i = 1; i < Math.min(5, images.length); i++) {
      const it = document.createElement("div");
      it.className = "vg-item";
      it.innerHTML = `<img src="${images[i]}" alt="Venue photo ${i + 1}">`;
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

  function buildQuickInfo(v) {
    const items = [];
    if (v.capacity_min || v.capacity_max) {
      items.push(`<span class="qi"><i class="fa-solid fa-users"></i> ${v.capacity_min || 0}–${v.capacity_max || 0} pax</span>`);
    }
    if (v.rooms) items.push(`<span class="qi"><i class="fa-solid fa-bed"></i> ${v.rooms} Rooms</span>`);
    if (v.venue_type) items.push(`<span class="qi"><i class="fa-solid fa-building"></i> ${v.venue_type}</span>`);
    (v.tags || []).slice(0, 3).forEach((t) => items.push(`<span class="qi"><i class="fa-solid fa-tag"></i> ${t}</span>`));
    items.push(`<span class="qi"><i class="fa-solid fa-square-parking"></i> Parking Available</span>`);
    $("#vdQuickInfo").innerHTML = items.join("");
  }

  function buildPrice(v) {
    let price;
    if (v.veg_price != null && v.non_veg_price != null) {
      price = `${fmtBDT(v.veg_price)} <small>/ Veg</small> &nbsp; · &nbsp; ${fmtBDT(v.non_veg_price)} <small>/ Non-veg</small>`;
    } else if (v.veg_price != null) {
      price = `${fmtBDT(v.veg_price)} <small>/ person</small>`;
    } else if (v.non_veg_price != null) {
      price = `${fmtBDT(v.non_veg_price)} <small>/ person</small>`;
    } else if (v.rental_price != null) {
      price = `${fmtBDT(v.rental_price)} <small>/ event</small>`;
    } else {
      price = "On request";
    }
    $("#vdPrice").innerHTML = price;
  }

  function buildAmenities() {
    $("#vdAmenities").innerHTML = FALLBACK_AMENITIES
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
    try { reviews = await window.eventixData.listReviews("venue", v.id); } catch (_) {}
    const total = reviews.length || v.rating_count || 0;
    const avg = total ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length || v.rating_avg || 0) : (v.rating_avg || 0);
    $("#vdRevBig").textContent = (Number(avg) || 0).toFixed(1);

    const dist = [5, 4, 3, 2, 1].map((s) => {
      const c = reviews.filter((r) => Math.round(r.rating) === s).length;
      const pct = total ? Math.round((c / total) * 100) : 0;
      return `<div class="vd-rev-bar"><span style="width:14px;">${s}★</span><div class="bar"><span style="width:${pct}%"></span></div><span>${c}</span></div>`;
    }).join("");
    $("#vdRevBars").innerHTML = dist;

    if (!reviews.length) {
      $("#vdReviewList").innerHTML = `<p style="color:#888;font-size:13px;">No reviews yet — be the first to share your experience.</p>`;
      return;
    }
    $("#vdReviewList").innerHTML = reviews.slice(0, 8).map((r) => `
      <div class="vd-review">
        <div class="vd-review-head">
          <span class="vd-review-name">Guest</span>
          <span class="vd-review-date">${new Date(r.created_at).toLocaleDateString()}</span>
        </div>
        <div class="vd-review-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
        <p>${r.comment || ""}</p>
      </div>
    `).join("");
  }

  async function buildSimilar(v) {
    try {
      const rows = await window.eventixData.loadSimilarVenues({ city: v.city, excludeId: v.id, limit: 6 });
      const grid = $("#vdSimilar");
      grid.innerHTML = "";
      rows.forEach((r) => {
        const card = document.createElement("div");
        card.className = "venue-card";
        card.style.cursor = "pointer";
        card.onclick = () => location.href = `venue.html?id=${encodeURIComponent(r.id)}`;
        card.innerHTML = `
          <div class="card-img"><img src="${r.img || FALLBACK_IMG}" alt="${r.name}"></div>
          <div class="card-body">
            <div class="card-title-row"><h3>${r.name}</h3><span class="rating"><i class="fa-solid fa-star"></i> ${r.rating}</span></div>
            <p class="location"><i class="fa-solid fa-location-dot"></i> ${r.location}</p>
            <div class="capacity"><span><i class="fa-solid fa-users"></i> ${r.capacityPax || "—"}</span></div>
          </div>`;
        grid.appendChild(card);
      });
    } catch (e) { console.error(e); }
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
    const sections = ["info","photos","about","reviews","faqs"].map((id) => $(`#sec-${id}`));
    if (!("IntersectionObserver" in window)) return;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          const id = en.target.id.replace("sec-","");
          tabs.forEach((t) => t.classList.toggle("active", t.dataset.tab === id));
        }
      });
    }, { rootMargin: "-120px 0px -60% 0px" });
    sections.forEach((s) => s && obs.observe(s));
  }

  function bindShare(v) {
    $("#vdShare").onclick = async () => {
      const url = location.href;
      if (navigator.share) {
        try { await navigator.share({ title: v.name, url }); } catch (_) {}
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
        liked = items.some((x) => x.target_type === "venue" && x.target_id === v.id);
        i.className = liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
        btn.classList.toggle("active", liked);
      } catch (_) {}
    }
    refresh();

    btn.onclick = async () => {
      try {
        const newState = await window.eventixData.toggleWishlist("venue", v.id);
        liked = newState;
        i.className = liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
        btn.classList.toggle("active", liked);
      } catch (e) {
        if (String(e.message).includes("not_authenticated")) {
          window.openM(document.getElementById("loginModal"));
        } else { alert(e.message || "Could not update wishlist"); }
      }
    };
  }

  function bindCtas(v) {
    $("#vdMsgBtn").onclick = () => $("#vdForm").scrollIntoView({ behavior: "smooth" });
    $("#vdContactBtn").onclick = async () => {
      const u = await window.eventixData.getUser();
      if (!u) { window.openM(document.getElementById("loginModal")); return; }
      alert("Contact: +880 1700-000000\nEmail: host@eventix.com");
    };
    $("#vdWriteReview").onclick = async () => {
      const u = await window.eventixData.getUser();
      if (!u) { window.openM(document.getElementById("loginModal")); return; }
      const ratingStr = prompt("Your rating (1–5):");
      const rating = parseInt(ratingStr, 10);
      if (!rating || rating < 1 || rating > 5) return alert("Please enter a number 1–5.");
      const comment = prompt("Your review:");
      if (!comment) return;
      try {
        await window.eventixData.submitReview({ target_type: "venue", target_id: v.id, rating, comment });
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
          await window.eventixData.addToCart({ target_type: "venue", target_id: v.id, quantity: 1 });
          window.refreshCartBadge?.();
          if (confirm("Added to cart. Go to cart now?")) location.href = "cart.html";
        } catch (e) { alert(e.message || "Failed to add"); }
      };
    }
    form.onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const event_date = fd.get("event_date");
      const guest_count = parseInt(fd.get("guest_count"), 10);
      const function_type = fd.get("function_type");
      const name = (fd.get("name") || "").toString().trim();
      const phone = (fd.get("phone") || "").toString().trim();
      const email = (fd.get("email") || "").toString().trim();
      if (!event_date || !guest_count || !function_type || !name || !phone || !email) {
        alert("Please fill in all fields."); return;
      }
      const u = await window.eventixData.getUser();
      if (!u) { window.openM(document.getElementById("loginModal")); return; }
      const submit = form.querySelector(".vd-submit");
      submit.disabled = true; const old = submit.textContent; submit.textContent = "Submitting…";
      try {
        await window.eventixData.submitEnquiry({
          target_type: "venue",
          target_id: v.id,
          event_date,
          guest_count,
          phone,
          message: `Function: ${function_type}\nName: ${name}\nEmail: ${email}`,
        });
        alert("Enquiry sent! The host will get back to you.");
        form.reset();
      } catch (err) {
        alert(err.message || "Could not send enquiry");
      } finally { submit.disabled = false; submit.textContent = old; }
    };
  }

  async function init() {
    if (!venueId) return showNotFound();
    let v;
    try { v = await window.eventixData.loadVenueById(venueId); }
    catch (e) { console.error(e); return showNotFound(); }
    if (!v) return showNotFound();

    document.title = `${v.name} – Eventix`;
    $("#vdLoading").style.display = "none";
    $("#vdContent").style.display = "block";

    $("#vdCrumb").textContent = v.name;
    $("#vdName").textContent = v.name;
    $("#vdLoc").textContent = [v.area, v.city].filter(Boolean).join(", ");
    $("#vdRating").textContent = (Number(v.rating_avg) || 0).toFixed(1);
    $("#vdRevCount").textContent = v.rating_count || 0;
    $("#vdShortDesc").textContent = v.description || `Welcome to ${v.name}, one of ${v.city}'s premier wedding venues. With elegant interiors, professional service and flexible packages, it's a perfect setting for your big day.`;
    $("#vdLongDesc").textContent = v.description || `${v.name} offers beautifully designed spaces tailored for weddings, receptions and grand celebrations. The venue blends modern amenities with timeless aesthetics — from spacious banquet halls to lush outdoor areas — ensuring every event feels effortless and memorable.`;

    const chips = [];
    if (v.handpicked) chips.push("Handpicked");
    (v.tags || []).forEach((t) => chips.push(t));
    $("#vdChips").innerHTML = chips.map((c) => `<span class="vd-chip">${c}</span>`).join("");

    const images = [v.cover_image_url, ...(v.gallery_image_urls || [])].filter(Boolean);
    while (images.length < 5) images.push(FALLBACK_IMG);
    lbImages = images;
    buildGallery(images);
    $("#vdPhotos").innerHTML = images.slice(0, 9).map((src, i) => `<img src="${src}" alt="Photo ${i + 1}" data-i="${i}">`).join("");
    $$("#vdPhotos img").forEach((img) => img.onclick = () => openLightbox(parseInt(img.dataset.i, 10)));

    buildQuickInfo(v);
    buildPrice(v);
    buildAmenities();
    buildPolicies();
    buildFaqs();
    buildReviews(v);
    buildSimilar(v);
    bindTabs();
    bindShare(v);
    bindFav(v);
    bindCtas(v);
    bindForm(v);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
