/* Inject Cart + My Bookings links into existing navbar on every static page.
   Loaded after static-data.js + supabase. */
(function () {
  const SB = () => window.eventixData;

  function addLinks() {
    const navRight = document.querySelector(".nav-right");
    if (!navRight || document.getElementById("navCartBtn")) return;

    // Cart icon
    const cart = document.createElement("a");
    cart.id = "navCartBtn";
    cart.href = "cart.html";
    cart.className = "nav-cart";
    cart.title = "Cart";
    cart.innerHTML = `<i class="fa-solid fa-cart-shopping"></i><span class="nav-cart-badge" id="navCartBadge" style="display:none">0</span>`;
    navRight.insertBefore(cart, navRight.firstChild.nextSibling);

    // My bookings (text link, hidden if signed-out)
    const my = document.createElement("a");
    my.id = "navMyBookings";
    my.href = "my-bookings.html";
    my.className = "nav-link";
    my.style.cssText = "padding:0 10px;cursor:pointer;display:none;font-weight:500;";
    my.innerHTML = `<i class="fa-solid fa-calendar-check"></i> My Bookings`;
    navRight.insertBefore(my, cart);

    // Admin link (only for admins)
    const admin = document.createElement("a");
    admin.id = "navAdmin";
    admin.href = "/admin";
    admin.className = "nav-link";
    admin.style.cssText = "padding:0 10px;cursor:pointer;display:none;font-weight:500;color:#b91c1c;";
    admin.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Admin`;
    navRight.insertBefore(admin, my);

    refreshState();
  }

  async function refreshBadge() {
    try {
      const c = await SB().cartCount();
      const b = document.getElementById("navCartBadge");
      if (!b) return;
      if (c > 0) { b.textContent = c; b.style.display = "inline-flex"; }
      else b.style.display = "none";
    } catch {}
  }

  async function refreshState() {
    const u = await SB().getUser().catch(() => null);
    const my = document.getElementById("navMyBookings");
    const admin = document.getElementById("navAdmin");
    if (my) my.style.display = u ? "inline-flex" : "none";
    if (u && admin) {
      const isAdmin = await SB().isAdmin().catch(() => false);
      admin.style.display = isAdmin ? "inline-flex" : "none";
    }
    refreshBadge();
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!SB()) return;
    addLinks();
    SB().onAuth(() => refreshState());
  });

  window.refreshCartBadge = refreshBadge;
})();