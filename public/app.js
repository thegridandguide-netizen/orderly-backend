/* Eventix – shared UI script (split-file version) */
(function () {
  const pageToFile = {
    home: "index.html",
    venues: "venues.html",
    vendors: "vendors.html",
    photos: "photos.html",
    explore: "explore.html",
  };

  function getCurrentPage() {
    const attr = document.body && document.body.dataset ? document.body.dataset.page : "";
    if (attr) return attr;

    const p = (location.pathname || "").toLowerCase();
    if (p.endsWith("venues.html")) return "venues";
    if (p.endsWith("vendors.html")) return "vendors";
    if (p.endsWith("photos.html")) return "photos";
    if (p.endsWith("explore.html")) return "explore";
    return "home";
  }

  // Keep existing inline onclick="showPage('...')" working, but navigate between real pages.
  window.showPage = function (name) {
    const file = pageToFile[name] || pageToFile.home;
    const here = (location.pathname || "").split("/").pop() || "index.html";
    if (here !== file) {
      location.href = file;
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  function setActiveNav(page) {
    document.querySelectorAll(".nav-link").forEach((a) => {
      a.classList.toggle("active", a.dataset.page === page);
    });
    document.querySelectorAll(".bn-item").forEach((b) => {
      b.classList.toggle("active", b.dataset.page === page);
    });

    const drawerItems = document.querySelectorAll(".drawer-nav-item");
    const pages = ["home", "venues", "vendors", "photos", "explore"];
    drawerItems.forEach((d, i) => d.classList.toggle("active", pages[i] === page));
  }

  /* ── Navbar scroll behaviour ── */
  let lastScroll = 0;
  function bindNavbarScroll() {
    window.addEventListener("scroll", () => {
      const n = document.getElementById("main-nav");
      if (!n) return;

      const s = window.pageYOffset;
      n.classList.toggle("scrolled", s > 50);

      if (s > 200 && s > lastScroll + 4) n.classList.add("hide");
      else if (s < lastScroll - 4 || s < 100) n.classList.remove("hide");

      lastScroll = s;
    });
  }

  /* ── Modals ── */
  function bindModals() {
    const loginModal = document.getElementById("loginModal");
    const signupModal = document.getElementById("signupModal");

    function openM(m) {
      if (!m) return;
      m.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function closeM(m) {
      if (!m) return;
      m.classList.remove("open");
      document.body.style.overflow = "";
    }

    // expose for inline handlers (drawer quick login / FAB)
    window.openM = openM;
    window.closeM = closeM;

    const navLoginBtn = document.getElementById("navLoginBtn");
    const closeModal = document.getElementById("closeModal");
    const closeSignup = document.getElementById("closeSignup");
    const toSignupLink = document.getElementById("toSignupLink");
    const toLogin = document.getElementById("toLogin");
    const exploreSignupBtn = document.getElementById("exploreSignupBtn");

    if (navLoginBtn) navLoginBtn.onclick = () => openM(loginModal);
    if (closeModal) closeModal.onclick = () => closeM(loginModal);
    if (closeSignup) closeSignup.onclick = () => closeM(signupModal);

    if (toSignupLink) {
      toSignupLink.onclick = (e) => {
        e.preventDefault();
        closeM(loginModal);
        openM(signupModal);
      };
    }
    if (toLogin) {
      toLogin.onclick = (e) => {
        e.preventDefault();
        closeM(signupModal);
        openM(loginModal);
      };
    }
    if (exploreSignupBtn) exploreSignupBtn.onclick = () => openM(signupModal);

    window.addEventListener("click", (e) => {
      if (e.target === loginModal) closeM(loginModal);
      if (e.target === signupModal) closeM(signupModal);
    });

    /* Wire login form */
    const loginForm = loginModal && loginModal.querySelector("form");
    if (loginForm) {
      loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const inputs = loginForm.querySelectorAll("input");
        const email = inputs[0].value.trim();
        const password = inputs[1].value;
        if (!email || !password) return alert("Enter email and password");
        const submit = loginForm.querySelector("button[type=submit]");
        submit.disabled = true; submit.textContent = "Signing in…";
        try {
          await window.eventixData.signIn({ email, password });
          closeM(loginModal);
          location.reload();
        } catch (err) { alert(err.message || "Login failed"); }
        finally { submit.disabled = false; submit.textContent = "Log In"; }
      };
    }

    /* Wire signup form */
    const signupForm = signupModal && signupModal.querySelector("form");
    if (signupForm) {
      signupForm.onsubmit = async (e) => {
        e.preventDefault();
        const inputs = signupForm.querySelectorAll("input");
        const first = inputs[0].value.trim();
        const last = inputs[1].value.trim();
        const email = inputs[2].value.trim();
        const password = inputs[3].value;
        if (!email || !password) return alert("Email and password required");
        const submit = signupForm.querySelector("button[type=submit]");
        submit.disabled = true; submit.textContent = "Creating…";
        try {
          await window.eventixData.signUp({ email, password, name: `${first} ${last}`.trim() });
          alert("Check your email to confirm your account, then log in.");
          closeM(signupModal);
          openM(loginModal);
        } catch (err) { alert(err.message || "Signup failed"); }
        finally { submit.disabled = false; submit.textContent = "Create Account"; }
      };
    }

    /* Wire Google buttons (any .social-btn containing "Google") */
    document.querySelectorAll(".social-btn").forEach((b) => {
      if (/google/i.test(b.textContent || "")) {
        b.onclick = async (e) => {
          e.preventDefault();
          try { await window.eventixData.signInWithGoogle(); }
          catch (err) { alert(err.message || "Google sign-in failed"); }
        };
      }
    });
  }

  /* ── Auth state → navbar ── */
  let currentUser = null;
  let wishlistSet = new Set(); // "type:id"
  function bindAuthState() {
    const navBtn = document.getElementById("navLoginBtn");
    if (!window.eventixData) return;
    window.eventixData.onAuth(async (user) => {
      currentUser = user;
      if (navBtn) {
        if (user) {
          navBtn.textContent = "Log Out";
          navBtn.onclick = async () => {
            await window.eventixData.signOut();
            location.reload();
          };
        } else {
          navBtn.textContent = "Log In";
          navBtn.onclick = () => window.openM(document.getElementById("loginModal"));
        }
      }
      if (user) {
        try {
          const items = await window.eventixData.listWishlist();
          wishlistSet = new Set(items.map((i) => `${i.target_type}:${i.target_id}`));
          applyWishlistState();
        } catch (_) {}
      } else {
        wishlistSet = new Set();
        applyWishlistState();
      }
    });
  }

  function applyWishlistState(root = document) {
    root.querySelectorAll("[data-wishlist-id]").forEach((btn) => {
      const key = `${btn.dataset.wishlistType}:${btn.dataset.wishlistId}`;
      const ic = btn.querySelector("i");
      if (!ic) return;
      const liked = wishlistSet.has(key);
      ic.classList.toggle("fa-solid", liked);
      ic.classList.toggle("fa-regular", !liked);
      btn.style.color = liked ? "var(--pink)" : "#bbb";
    });
  }

  /* ── Hamburger + Drawer ── */
  function bindDrawer() {
    const hamburger = document.getElementById("hamburgerBtn");
    const drawer = document.getElementById("mobileDrawer");
    const backdrop = document.getElementById("drawerBackdrop");
    if (!hamburger || !drawer || !backdrop) return;

    function openDrawer() {
      drawer.classList.add("open");
      hamburger.classList.add("open");
      document.body.style.overflow = "hidden";
    }
    function closeDrawer() {
      drawer.classList.remove("open");
      hamburger.classList.remove("open");
      document.body.style.overflow = "";
    }

    // expose for inline onclick in drawer items
    window.closeDrawer = closeDrawer;

    hamburger.onclick = () => (drawer.classList.contains("open") ? closeDrawer() : openDrawer());
    backdrop.onclick = closeDrawer;
  }

  /* ── Search overlay ── */
  function bindSearchOverlay() {
    const searchOverlay = document.getElementById("searchOverlay");
    const searchToggle = document.getElementById("searchToggle");
    const closeSearch = document.getElementById("closeSearch");
    const overlaySearchInput = document.getElementById("overlaySearchInput");
    if (!searchOverlay || !searchToggle || !closeSearch || !overlaySearchInput) return;

    searchToggle.onclick = () => {
      searchOverlay.classList.add("open");
      setTimeout(() => overlaySearchInput.focus(), 200);
    };

    closeSearch.onclick = () => searchOverlay.classList.remove("open");

    searchOverlay.addEventListener("click", (e) => {
      if (e.target === searchOverlay) searchOverlay.classList.remove("open");
    });

    window.searchNav = function (q) {
      overlaySearchInput.value = q;
      // optional: carry search term across pages
      try { sessionStorage.setItem("eventix_search", q); } catch (_) {}
      searchOverlay.classList.remove("open");
      window.showPage("vendors");
    };
  }

  /* ── Main search button (Home only) ── */
  function bindMainSearch() {
    const btn = document.querySelector(".main-search button");
    const input = document.querySelector(".main-search input");
    if (!btn || !input) return;

    btn.onclick = function () {
      const q = (input.value || "").trim();
      if (!q) {
        input.focus();
        return;
      }
      try { sessionStorage.setItem("eventix_search", q); } catch (_) {}
      window.showPage("vendors");
    };
  }

  /* ── Filter pills ── */
  function bindPills() {
    document.querySelectorAll(".filter-item").forEach((item) => {
      item.onclick = () => {
        const wrap = item.closest(".filter-container");
        if (!wrap) return;
        wrap.querySelectorAll(".filter-item").forEach((i) => i.classList.remove("active"));
        item.classList.add("active");
      };
    });

    document.querySelectorAll(".photo-pill,.exp-tab").forEach((p) => {
      p.onclick = () => {
        const parent = p.parentElement;
        if (!parent) return;
        parent.querySelectorAll(".photo-pill,.exp-tab").forEach((x) => x.classList.remove("active"));
        p.classList.add("active");
      };
    });
  }

  /* ── Wishlist ── */
  function bindWishlistButtons(root = document) {
    root.querySelectorAll(".wishlist-btn,.wishlist-venue").forEach((btn) => {
      if (btn.dataset.bound === "1") return;
      btn.dataset.bound = "1";

      btn.onclick = async (e) => {
        e.stopPropagation();
        if (!currentUser) {
          window.openM(document.getElementById("loginModal"));
          return;
        }
        const type = btn.dataset.wishlistType;
        const id = btn.dataset.wishlistId;
        const ic = btn.querySelector("i");
        if (!ic) return;
        if (!type || !id) {
          // Static (non-DB) card — local toggle only
          ic.classList.toggle("fa-regular");
          ic.classList.toggle("fa-solid");
          btn.style.color = ic.classList.contains("fa-solid") ? "var(--pink)" : "#bbb";
          return;
        }
        try {
          const liked = await window.eventixData.toggleWishlist(type, id);
          const key = `${type}:${id}`;
          if (liked) wishlistSet.add(key); else wishlistSet.delete(key);
          ic.classList.toggle("fa-solid", liked);
          ic.classList.toggle("fa-regular", !liked);
          btn.style.color = liked ? "var(--pink)" : "#bbb";
          if (liked) {
            ic.style.animation = "sparkle .4s ease";
            ic.addEventListener("animationend", () => (ic.style.animation = ""), { once: true });
          }
        } catch (err) { console.error(err); }
      };
    });
    applyWishlistState(root);
  }

  // Expose for other pages (e.g., vendor details similar section)
  window.bindWishlistButtons = bindWishlistButtons;

  /* ── Enquiry helper (exposed for inline buttons) ── */
  window.eventixEnquire = async function (target_type, target_id) {
    if (!currentUser) { window.openM(document.getElementById("loginModal")); return; }
    const message = prompt("Tell the host about your event (date, guests, budget):");
    if (!message) return;
    try {
      await window.eventixData.submitEnquiry({ target_type, target_id, message });
      alert("Enquiry sent! The host will get back to you.");
    } catch (err) { alert(err.message || "Could not send enquiry"); }
  };

  /* ── Load more venues (Venues only) ── */
  const extraVenues = [
    {name:"Royal Palace Banquet",rating:"4.9",location:"Gulshan, Dhaka",tags:["Banquet Hall","Indoor"],img:"https://images.unsplash.com/photo-1529692236671-f1dcda5e8a02?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Starting",value:"৳ 3,00,000"}],capacityPax:"500–2500 pax",rooms:"200 Rooms",handpicked:true},
    {name:"Coastal Retreat Resort",rating:"4.7",location:"Cox's Bazar",tags:["Resort","Outdoor"],img:"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Starting",value:"৳ 5,00,000"}],capacityPax:"50–400 pax",rooms:"80 Rooms",handpicked:false},
    {name:"The Grand Pavilion",rating:"4.4",location:"Dhanmondi, Dhaka",tags:["Convention","Indoor"],img:"https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Veg",value:"৳ 550",unit:"person"},{label:"Non-veg",value:"৳ 750",unit:"person"}],capacityPax:"200–1000 pax",rooms:"",handpicked:false},
    {name:"Skyline Rooftop Lounge",rating:"4.6",location:"Banani, Dhaka",tags:["Rooftop","Cocktail"],img:"https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Starting",value:"৳ 2,20,000"}],capacityPax:"150–700 pax",rooms:"30 Rooms",handpicked:true},
    {name:"Emerald Garden Lawns",rating:"4.5",location:"Uttara, Dhaka",tags:["Garden","Outdoor"],img:"https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Veg",value:"৳ 650",unit:"person"},{label:"Non-veg",value:"৳ 850",unit:"person"}],capacityPax:"300–2000 pax",rooms:"",handpicked:false},
    {name:"Heritage City Convention",rating:"4.8",location:"Motijheel, Dhaka",tags:["Convention","AC Hall"],img:"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Starting",value:"৳ 4,50,000"}],capacityPax:"400–1800 pax",rooms:"60 Rooms",handpicked:false},
    {name:"Riverside Event Deck",rating:"4.3",location:"Keraniganj, Dhaka",tags:["Riverside","Outdoor"],img:"https://images.unsplash.com/photo-1504805572947-34fad45aed93?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Starting",value:"৳ 1,60,000"}],capacityPax:"120–500 pax",rooms:"",handpicked:false},
    {name:"Crystal Ballroom Hotel",rating:"4.7",location:"Gulshan, Dhaka",tags:["5 Star Hotel","Ballroom"],img:"https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Veg",value:"৳ 950",unit:"person"},{label:"Non-veg",value:"৳ 1,250",unit:"person"}],capacityPax:"200–900 pax",rooms:"140 Rooms",handpicked:true},
    {name:"Sunset Beachside Hall",rating:"4.6",location:"Cox's Bazar",tags:["Beachside","Resort"],img:"https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Starting",value:"৳ 3,80,000"}],capacityPax:"80–450 pax",rooms:"70 Rooms",handpicked:false},
    {name:"Orchid Party House",rating:"4.2",location:"Mirpur, Dhaka",tags:["Party Hall","Indoor"],img:"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Veg",value:"৳ 520",unit:"person"},{label:"Non-veg",value:"৳ 720",unit:"person"}],capacityPax:"100–350 pax",rooms:"",handpicked:false},
    {name:"Lakeside Banquet & Garden",rating:"4.5",location:"Baridhara, Dhaka",tags:["Banquet","Garden"],img:"https://images.unsplash.com/photo-1515169067865-5387ec356754?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Starting",value:"৳ 2,80,000"}],capacityPax:"250–1200 pax",rooms:"40 Rooms",handpicked:false},
    {name:"Golden Crown Pavilion",rating:"4.9",location:"Gulshan, Dhaka",tags:["Luxury","Banquet"],img:"https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&q=80&w=900",pricing:[{label:"Starting",value:"৳ 6,50,000"}],capacityPax:"600–3000 pax",rooms:"220 Rooms",handpicked:true}
  ];
  let extraVenueIndex = 0;
  const VENUES_BATCH_SIZE = 3;

  function buildVenueCard(v) {
    const card = document.createElement("div");
    card.className = "venue-card";
    if (v.id) {
      card.dataset.venueId = v.id;
      card.style.cursor = "pointer";
      card.addEventListener("click", (e) => {
        if (e.target.closest(".wishlist-venue,.wishlist-btn")) return;
        location.href = `venue.html?id=${encodeURIComponent(v.id)}`;
      });
    }

    const pricingHTML = (v.pricing || [])
      .map((p) => {
        const unit = p.unit ? ` <small>/${p.unit}</small>` : "";
        return `<div class="price-item"><span class="label">${p.label}</span><span class="value">${p.value}${unit}</span></div>`;
      })
      .join("");

    const tagHTML = (v.tags || []).map((t) => `<span>${t}</span>`).join("");

    const capHTML = [
      v.capacityPax ? `<span><i class="fa-solid fa-users"></i> ${v.capacityPax}</span>` : "",
      v.rooms ? `<span><i class="fa-solid fa-bed"></i> ${v.rooms}</span>` : "",
    ]
      .filter(Boolean)
      .join("");

    card.innerHTML = `
      <div class="card-img">
        <img src="${v.img}" alt="${v.name}">
        ${v.handpicked ? `<span class="handpicked-tag"><i class="fa-solid fa-crown"></i> Handpicked</span>` : ""}
        <button class="wishlist-venue" ${v.id ? `data-wishlist-type="venue" data-wishlist-id="${v.id}"` : ""}><i class="fa-regular fa-heart"></i></button>
      </div>
      <div class="card-body">
        <div class="card-title-row">
          <h3>${v.name}</h3>
          <span class="rating"><i class="fa-solid fa-star"></i> ${v.rating}</span>
        </div>
        <p class="location"><i class="fa-solid fa-location-dot"></i> ${v.location}</p>
        <div class="tags">${tagHTML}</div>
        <div class="pricing">${pricingHTML}</div>
        <div class="capacity">${capHTML}</div>
      </div>
    `;
    return card;
  }

  // Cloud-backed "Load more" (falls back to local data if Cloud is offline).
  let venuesOffset = 0;
  const VENUES_PAGE = 6;
  let venuesExhausted = false;

  window.loadMoreVenues = async function () {
    const grid =
      document.querySelector("#page-venues .venue-grid") ||
      document.querySelector(".venue-grid");
    const btn = document.getElementById("loadMoreVenuesBtn");
    if (!grid || !btn) return;

    if (venuesExhausted) return;

    btn.disabled = true;
    const originalLabel = btn.textContent;
    btn.textContent = "Loading…";

    try {
      if (window.eventixData && window.eventixData.loadVenues) {
        const rows = await window.eventixData.loadVenues({
          limit: VENUES_PAGE,
          offset: venuesOffset,
        });
        rows.forEach((v) => grid.appendChild(buildVenueCard(v)));
        venuesOffset += rows.length;
        if (rows.length < VENUES_PAGE) {
          venuesExhausted = true;
          btn.textContent = "No More Venues";
          return;
        }
      } else {
        // Fallback: local sample data
        for (let i = 0; i < VENUES_BATCH_SIZE && extraVenueIndex < extraVenues.length; i++, extraVenueIndex++) {
          grid.appendChild(buildVenueCard(extraVenues[extraVenueIndex]));
        }
        if (extraVenueIndex >= extraVenues.length) {
          venuesExhausted = true;
          btn.textContent = "No More Venues";
          return;
        }
      }
      btn.textContent = originalLabel;
      btn.disabled = false;
    } catch (err) {
      console.error("loadMoreVenues failed", err);
      btn.textContent = "Try again";
      btn.disabled = false;
    }

    bindWishlistButtons(grid);
  };


  /* ── Vendors (cloud-backed listing) ── */
  let vendorsOffset = 0;
  const VENDORS_PAGE = 12;
  let vendorsExhausted = false;

  function fmtBDT(n) {
    if (n == null) return null;
    return "৳ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n));
  }

  function vendorIcon(category) {
    const c = String(category || "").toLowerCase();
    if (c.includes("photo")) return "📸";
    if (c.includes("make")) return "💄";
    if (c.includes("decor")) return "🌸";
    if (c.includes("cater")) return "🍽️";
    if (c.includes("dj") || c.includes("music")) return "🎶";
    if (c.includes("plan")) return "📋";
    return "✨";
  }

  function buildVendorCard(v) {
    const card = document.createElement("div");
    card.className = "vendor-card";
    card.style.cursor = "pointer";

    if (v && v.id) {
      card.addEventListener("click", (e) => {
        if (e.target.closest(".wishlist-btn")) return;
        location.href = `vendor.html?id=${encodeURIComponent(v.id)}`;
      });
    }

    const price =
      v.price_from != null
        ? `From ${fmtBDT(v.price_from)}`
        : (v.price_to != null ? `Up to ${fmtBDT(v.price_to)}` : "On request");

    const rating = (Number(v.rating_avg) || 0).toFixed(1);
    const count = v.rating_count || 0;

    const img = v.cover_image_url || "https://images.unsplash.com/photo-1520975958225-11d8c7f49b1d?auto=format&fit=crop&q=80&w=900";

    card.innerHTML = `
      <div class="card-img-container">
        <img src="${img}" alt="${v.title || "Vendor"}">
        <button class="wishlist-btn" data-wishlist-type="vendor" data-wishlist-id="${v.id || ""}"><i class="fa-regular fa-heart"></i></button>
      </div>
      <div class="vendor-info">
        <span class="category-tag">${vendorIcon(v.category)} ${v.category || "Vendor"}</span>
        <h3>${v.title || "Vendor"}</h3>
        <p class="location"><i class="fa-solid fa-location-dot"></i> ${v.city || ""}</p>
        ${v.badge ? `<span class="vendor-badge">${v.badge}</span>` : ""}
        <div class="vendor-stats">
          <span class="vendor-rating"><i class="fa-solid fa-star"></i> ${rating} (${count})</span>
          <span class="price-tag">${price}</span>
        </div>
      </div>
    `;
    return card;
  }

  window.loadMoreVendors = async function () {
    const grid = document.querySelector(".vendor-grid-main");
    const btn = document.getElementById("loadMoreVendorsBtn");
    if (!grid || !btn) return;
    if (vendorsExhausted) return;

    btn.disabled = true;
    const old = btn.textContent;
    btn.textContent = "Loading…";

    try {
      const rows = await window.eventixData.loadVendors({ limit: VENDORS_PAGE, offset: vendorsOffset, sort: "rating" });
      if (rows && rows.length) {
        rows.forEach((v) => grid.appendChild(buildVendorCard(v)));
        vendorsOffset += rows.length;
        bindWishlistButtons(grid);
      }
      if (!rows || rows.length < VENDORS_PAGE) {
        vendorsExhausted = true;
        btn.textContent = "No More Vendors";
        return;
      }
      btn.textContent = old;
      btn.disabled = false;
    } catch (err) {
      console.error("loadMoreVendors failed", err);
      btn.textContent = "Try again";
      btn.disabled = false;
    }
  };

  /* ── Photos (cloud-backed listing) ── */
  let photosOffset = 0;
  const PHOTOS_PAGE = 18;
  let photosExhausted = false;
  let photosCategory = null;

  const PHOTO_FAV_KEY = "eventix_photo_favs";
  function getPhotoFavs() {
    try {
      const arr = JSON.parse(localStorage.getItem(PHOTO_FAV_KEY) || "[]");
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) {
      return new Set();
    }
  }
  function setPhotoFavs(set) {
    try { localStorage.setItem(PHOTO_FAV_KEY, JSON.stringify(Array.from(set))); } catch (_) {}
  }
  function applyPhotoFavState(root = document) {
    const set = getPhotoFavs();
    root.querySelectorAll("[data-photo-fav]").forEach((ic) => {
      const id = ic.dataset.photoFav;
      const liked = set.has(id);
      ic.classList.toggle("fa-solid", liked);
      ic.classList.toggle("fa-regular", !liked);
    });
  }
  function bindPhotoFavButtons(root = document) {
    root.querySelectorAll("[data-photo-fav]").forEach((ic) => {
      if (ic.dataset.bound === "1") return;
      ic.dataset.bound = "1";
      ic.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = ic.dataset.photoFav;
        const set = getPhotoFavs();
        if (set.has(id)) set.delete(id);
        else set.add(id);
        setPhotoFavs(set);
        applyPhotoFavState(root);
      });
    });
    applyPhotoFavState(root);
  }

  function buildPhotoItem(p) {
    const wrap = document.createElement("div");
    wrap.className = "masonry-item";
    wrap.style.cursor = "pointer";
    wrap.addEventListener("click", () => {
      location.href = `photo.html?id=${encodeURIComponent(p.id)}`;
    });

    const title = p.title || p.category || "Inspiration";
    const loc = p.city ? `📍 ${p.city}` : "";
    wrap.innerHTML = `
      <img src="${p.image_url || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=900"}" alt="${title}">
      <div class="masonry-overlay">
        <span class="mi-name">${title}</span>
        <span class="mi-loc">${loc}</span>
        <i class="mi-like fa-regular fa-heart" data-photo-fav="${p.id}"></i>
      </div>
    `;
    return wrap;
  }

  async function loadPhotosPage({ replace = false } = {}) {
    const grid = document.querySelector(".masonry");
    const btn = document.getElementById("loadMorePhotosBtn");
    if (!grid) return;

    if (replace) {
      photosOffset = 0;
      photosExhausted = false;
      grid.innerHTML = "";
    }

    if (btn) { btn.disabled = true; btn.textContent = "Loading…"; }

    try {
      const rows = await window.eventixData.loadPhotos({ category: photosCategory || undefined, limit: PHOTOS_PAGE, offset: photosOffset });
      if (rows && rows.length) {
        rows.forEach((p) => grid.appendChild(buildPhotoItem(p)));
        photosOffset += rows.length;
        bindPhotoFavButtons(grid);
      }
      if (!rows || rows.length < PHOTOS_PAGE) {
        photosExhausted = true;
        if (btn) { btn.textContent = "No More Photos"; btn.disabled = true; }
        return;
      }
      if (btn) { btn.textContent = "Load More Photos"; btn.disabled = false; }
    } catch (err) {
      console.error("loadPhotos failed", err);
      if (btn) { btn.textContent = "Try again"; btn.disabled = false; }
    }
  }

  window.loadMorePhotos = async function () {
    if (photosExhausted) return;
    return loadPhotosPage({ replace: false });
  };

  /* ── Scroll Reveal ── */
  function triggerReveal() {
    const els = document.querySelectorAll("[data-reveal]");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("revealed"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach((el) => {
      if (!el.classList.contains("revealed")) observer.observe(el);
    });
  }

  /* ── Animated counters (Home only) ── */
  function animateCounters() {
    document.querySelectorAll(".stat-item .num").forEach((el) => {
      const text = el.textContent || "";
      const num = parseFloat(text.replace(/[^0-9.]/g, ""));
      if (isNaN(num)) return;

      const suffix = text.replace(/[0-9.]/g, "");
      let current = 0;
      const duration = 1200;
      const steps = 60;
      const step = duration / steps;

      const timer = setInterval(() => {
        current += num / steps;
        if (current >= num) {
          current = num;
          clearInterval(timer);
        }
        el.textContent = (num % 1 === 0 ? Math.floor(current).toLocaleString() : current.toFixed(1)) + suffix;
      }, step);
    });
  }

  function bindCounterTrigger() {
    const statsBar = document.querySelector(".stats-bar");
    if (!statsBar || !("IntersectionObserver" in window)) return;

    const so = new IntersectionObserver(
      (entries) => {
        if (entries[0] && entries[0].isIntersecting) {
          animateCounters();
          so.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    so.observe(statsBar);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const page = getCurrentPage();
    setActiveNav(page);

    bindNavbarScroll();
    bindModals();
    bindDrawer();
    bindSearchOverlay();
    bindMainSearch();
    bindPills();
    bindWishlistButtons();
    bindAuthState();
    triggerReveal();
    bindCounterTrigger();

    // On the Venues page: replace static demo cards with real DB venues
    // so each card is clickable through to the details page.
    if (page === "venues" && window.eventixData && window.eventixData.loadVenues) {
      const grid = document.querySelector(".venue-grid");
      if (grid) {
        window.eventixData
          .loadVenues({ limit: VENUES_PAGE, offset: 0 })
          .then((rows) => {
            if (!rows || rows.length === 0) return;
            grid.innerHTML = "";
            rows.forEach((v) => grid.appendChild(buildVenueCard(v)));
            venuesOffset = rows.length;
            bindWishlistButtons(grid);
          })
          .catch((err) => console.error("initial loadVenues failed", err));
      }
    }

    // On the Vendors page: replace static demo cards with real DB vendors
    if (page === "vendors" && window.eventixData && window.eventixData.loadVendors) {
      const grid = document.querySelector(".vendor-grid-main");
      if (grid) {
        window.eventixData
          .loadVendors({ limit: VENDORS_PAGE, offset: 0, sort: "rating" })
          .then((rows) => {
            if (!rows || rows.length === 0) return;
            grid.innerHTML = "";
            rows.forEach((v) => grid.appendChild(buildVendorCard(v)));
            vendorsOffset = rows.length;
            bindWishlistButtons(grid);

            const rc = document.querySelector(".results-count");
            if (rc) rc.textContent = `Showing ${vendorsOffset} vendors`;
          })
          .catch((err) => console.error("initial loadVendors failed", err));
      }
    }

    // On the Photos page: replace static demo masonry with real DB photos + category filtering
    if (page === "photos" && window.eventixData && window.eventixData.loadPhotos) {
      loadPhotosPage({ replace: true });

      // Hook category pills
      document.querySelectorAll(".photo-pill").forEach((pill) => {
        pill.addEventListener("click", () => {
          const label = (pill.textContent || "").trim();
          photosCategory = (label.toLowerCase() === "all") ? null : label;
          loadPhotosPage({ replace: true });
        });
      });
    }
  });
})();

