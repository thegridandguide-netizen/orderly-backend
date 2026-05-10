(function () {
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => "৳ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);

  async function render() {
    const u = await window.eventixData.getUser();
    if (!u) {
      $("#cartLoading").style.display = "none";
      $("#cartEmpty").style.display = "block";
      $("#cartEmpty").innerHTML = `<i class="fa-solid fa-lock" style="font-size:48px;color:#ccc;margin-bottom:14px;"></i><h3>Please log in</h3><p style="color:#666;margin:6px 0 18px;">Sign in to view your cart.</p><a href="index.html" class="bk-btn bk-btn-primary">Go to Home</a>`;
      return;
    }
    const items = await window.eventixData.listCart();
    $("#cartLoading").style.display = "none";
    if (!items.length) { $("#cartEmpty").style.display = "block"; return; }
    $("#cartContent").style.display = "block";

    const root = $("#cartItems");
    root.innerHTML = items.map(it => `
      <div class="bk-card bk-item" data-id="${it.id}">
        <img src="${it.image || ''}" alt="${it.title}" onerror="this.style.display='none'">
        <div class="bk-item-body">
          <div class="bk-item-type">${it.target_type === 'venue' ? 'Venue' : 'Service'}</div>
          <h4>${it.title}</h4>
          <div class="bk-item-sub">${it.subtitle || ''}</div>
          <div class="bk-item-price">${fmt(it.unit_price)} <span style="color:#888;font-weight:400;font-size:13px;">/ unit</span></div>
        </div>
        <div class="bk-item-actions">
          <div class="bk-qty">
            <button data-act="dec">−</button>
            <span>${it.quantity}</span>
            <button data-act="inc">+</button>
          </div>
          <div class="bk-line-total">${fmt(it.unit_price * it.quantity)}</div>
          <button class="bk-remove" data-act="rm" title="Remove"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `).join("");

    const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
    $("#sumSubtotal").textContent = fmt(subtotal);
    $("#sumTotal").textContent = fmt(subtotal);
    $("#sumCount").textContent = items.length;

    root.querySelectorAll(".bk-item").forEach((el) => {
      const id = el.dataset.id;
      const it = items.find(i => i.id === id);
      el.querySelector('[data-act=inc]').onclick = async () => { await window.eventixData.updateCartQty(id, it.quantity + 1); render(); window.refreshCartBadge?.(); };
      el.querySelector('[data-act=dec]').onclick = async () => { await window.eventixData.updateCartQty(id, it.quantity - 1); render(); window.refreshCartBadge?.(); };
      el.querySelector('[data-act=rm]').onclick = async () => { await window.eventixData.removeFromCart(id); render(); window.refreshCartBadge?.(); };
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.eventixData) return;
    window.eventixData.onAuth(() => render());
  });
})();