/* Photo details page logic */
(function () {
  const params = new URLSearchParams(location.search);
  const photoId = params.get("id");

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const FALLBACK_IMG = "https://images.unsplash.com/photo-1519741497674-611481863552?w=900";

  // Lightbox (shared CSS ids from venue lightbox)
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

  function showNotFound() {
    $("#phLoading").style.display = "none";
    $("#phNotFound").style.display = "block";
  }

  // LocalStorage favorites for photos
  const FAV_KEY = "eventix_photo_favs";
  function getFavSet() {
    try {
      const arr = JSON.parse(localStorage.getItem(FAV_KEY) || "[]");
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) {
      return new Set();
    }
  }
  function setFavSet(set) {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(Array.from(set))); } catch (_) {}
  }

  function refreshFavIcon() {
    const set = getFavSet();
    const liked = set.has(photoId);
    const ic = $("#phFav i");
    ic.className = liked ? "fa-solid fa-heart" : "fa-regular fa-heart";
    $("#phFav").classList.toggle("active", liked);
  }

  function bindFav() {
    refreshFavIcon();
    $("#phFav").onclick = () => {
      const set = getFavSet();
      if (set.has(photoId)) set.delete(photoId);
      else set.add(photoId);
      setFavSet(set);
      refreshFavIcon();
    };
  }

  function bindShare(title) {
    $("#phShare").onclick = async () => {
      const url = location.href;
      if (navigator.share) {
        try { await navigator.share({ title, url }); } catch (_) {}
      } else {
        try { await navigator.clipboard.writeText(url); alert("Link copied!"); } catch (_) {}
      }
    };

    $("#phCopy").onclick = async () => {
      try { await navigator.clipboard.writeText(location.href); alert("Link copied!"); } catch (_) {}
    };

    $("#phOpen").onclick = () => openLightbox(0);
  }

  function bindTabs() {
    const tabs = $$("#phTabs .vd-tab");
    tabs.forEach((t) => {
      t.onclick = () => {
        const sec = $(`#sec-${t.dataset.tab}`);
        if (sec) sec.scrollIntoView({ behavior: "smooth", block: "start" });
      };
    });
    const sections = ["details", "related", "album"].map((id) => $(`#sec-${id}`));
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

  function buildGallery(images) {
    const root = $("#phGallery");
    root.innerHTML = "";

    const main = document.createElement("div");
    main.className = "vg-item vg-main";
    main.innerHTML = `<img src="${images[0]}" alt="Photo">`;
    main.onclick = () => openLightbox(0);
    root.appendChild(main);

    for (let i = 1; i < Math.min(5, images.length); i++) {
      const it = document.createElement("div");
      it.className = "vg-item";
      it.innerHTML = `<img src="${images[i]}" alt="Photo ${i + 1}">`;
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

  function renderPhotoGrid(el, rows) {
    el.innerHTML = "";
    rows.forEach((p) => {
      const img = document.createElement("img");
      img.src = p.image_url || FALLBACK_IMG;
      img.alt = p.title || "Photo";
      img.style.cursor = "pointer";
      img.onclick = () => {
        location.href = `photo.html?id=${encodeURIComponent(p.id)}`;
      };
      el.appendChild(img);
    });
  }

  async function init() {
    if (!photoId) return showNotFound();

    let p;
    try {
      p = await window.eventixData.loadPhotoById(photoId);
    } catch (e) {
      console.error(e);
      return showNotFound();
    }
    if (!p) return showNotFound();

    const title = p.title || p.category || "Photo";
    document.title = `${title} – Eventix`;

    // Load related (by album if possible, else category)
    let related = [];
    try {
      related = await window.eventixData.loadRelatedPhotos({
        category: p.category,
        album_id: p.album_id,
        excludeId: p.id,
        limit: 12,
      });
    } catch (e) { console.warn(e); }

    // Album photos (if album exists)
    let albumPhotos = [];
    if (p.album_id) {
      try {
        albumPhotos = await window.eventixData.loadRelatedPhotos({
          album_id: p.album_id,
          excludeId: p.id,
          limit: 12,
        });
      } catch (e) { console.warn(e); }
    }

    $("#phLoading").style.display = "none";
    $("#phContent").style.display = "block";

    $("#phCrumb").textContent = title;
    $("#phTitle").textContent = title;
    $("#phLoc").textContent = p.city || "";

    $("#phCategory").textContent = p.category || "—";
    $("#phCity").textContent = p.city || "—";
    $("#phDate").textContent = p.created_at ? new Date(p.created_at).toLocaleDateString() : "—";

    // Album info (joined by loadPhotoById)
    const albumTitle = p.albums?.title || "—";
    $("#phAlbum").textContent = albumTitle;
    $("#phAlbumInfo").textContent = p.albums?.title
      ? `This photo belongs to the album “${p.albums.title}”. Explore more photos from the same album below.`
      : "This photo is not part of an album.";

    $("#phCaption").textContent = p.title
      ? p.title
      : (p.category ? `Inspiration photo for ${p.category.toLowerCase()} ideas.` : "Event inspiration photo.");

    // Chips
    const chips = [];
    if (p.category) chips.push(p.category);
    (p.tags || []).slice(0, 10).forEach((t) => chips.push(t));
    $("#phTags").innerHTML = chips.map((c) => `<span class="vd-chip">${c}</span>`).join("");

    // Quick info strip
    const qi = [];
    if (p.category) qi.push(`<span class="qi"><i class="fa-solid fa-tag"></i> ${p.category}</span>`);
    if (p.city) qi.push(`<span class="qi"><i class="fa-solid fa-location-dot"></i> ${p.city}</span>`);
    if (p.album_id) qi.push(`<span class="qi"><i class="fa-regular fa-folder-open"></i> Album</span>`);
    qi.push(`<span class="qi"><i class="fa-regular fa-heart"></i> Save on device</span>`);
    $("#phQuickInfo").innerHTML = qi.join("");

    // Build gallery collage using main + related thumbs
    const galleryImgs = [p.image_url || FALLBACK_IMG, ...related.map((x) => x.image_url).filter(Boolean)];
    while (galleryImgs.length < 5) galleryImgs.push(p.image_url || FALLBACK_IMG);
    lbImages = galleryImgs.slice(0, 12);
    buildGallery(lbImages);

    // Render related grid (excluding current)
    renderPhotoGrid($("#phRelated"), related);

    // Render album grid
    renderPhotoGrid($("#phAlbumGrid"), albumPhotos);

    bindFav();
    bindShare(title);
    bindTabs();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
