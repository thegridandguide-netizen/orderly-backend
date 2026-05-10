(function () {
  const $ = (s) => document.querySelector(s);
  const fmt = (n) => "৳ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
  let cartItems = [], settings = null;

  function renderInstructions(method) {
    const box = $("#payInstructions");
    const body = $("#payInstrBody");
    if (!method || !settings) { box.style.display = "none"; return; }
    box.style.display = "block";
    let html = "";
    if (method === "bkash") {
      html = `<div class="bk-instr"><div class="bk-instr-num">${settings.bkash?.number || '01XXXXXXXXX'}</div><div class="bk-instr-sub">bKash ${settings.bkash?.type || 'Personal'}</div></div>
        <ol class="bk-steps"><li>Open bKash app → Send Money</li><li>Enter the number above and the amount shown in the summary</li><li>Use your booking reference as a note</li><li>After payment, upload the screenshot from <b>My Bookings</b></li></ol>`;
    } else if (method === "nagad") {
      html = `<div class="bk-instr"><div class="bk-instr-num">${settings.nagad?.number || '01XXXXXXXXX'}</div><div class="bk-instr-sub">Nagad ${settings.nagad?.type || 'Personal'}</div></div>
        <ol class="bk-steps"><li>Open Nagad → Send Money</li><li>Enter the number above and the amount shown</li><li>Note the trxID and upload the screenshot from <b>My Bookings</b></li></ol>`;
    } else if (method === "bank") {
      const b = settings.bank || {};
      html = `<div class="bk-instr-bank">
        <div><b>Account name:</b> ${b.account_name || '—'}</div>
        <div><b>Account #:</b> ${b.account_number || '—'}</div>
        <div><b>Bank:</b> ${b.bank || '—'} ${b.branch ? '· ' + b.branch : ''}</div>
      </div><ol class="bk-steps"><li>Transfer the amount via NEFT / RTGS / cheque deposit</li><li>Use your booking reference as the description</li><li>Upload the deposit slip from <b>My Bookings</b></li></ol>`;
    } else if (method === "cash") {
      html = `<p>Pay in cash at our office or to the assigned coordinator. We'll mark your booking as paid once received.</p>`;
    }
    if (settings.note) html += `<p class="bk-hint" style="margin-top:14px;"><i class="fa-solid fa-circle-info"></i> ${settings.note}</p>`;
    body.innerHTML = html;
  }

  function recompute() {
    const subtotal = cartItems.reduce((s, it) => s + it.unit_price * it.quantity, 0);
    const deposit = Math.round(subtotal * window.eventixData.DEPOSIT_RATE);
    $("#coSubtotal").textContent = fmt(subtotal);
    $("#coTotal").textContent = fmt(subtotal);
    $("#optDepositAmt").textContent = fmt(deposit);
    $("#optFullAmt").textContent = fmt(subtotal);
    const type = document.querySelector('[name=payment_type]:checked')?.value || 'deposit';
    $("#coPayNow").textContent = fmt(type === 'full' ? subtotal : deposit);
  }

  async function init() {
    const u = await window.eventixData.getUser();
    if (!u) { location.href = "index.html"; return; }
    [cartItems, settings] = await Promise.all([
      window.eventixData.listCart(),
      window.eventixData.getSetting("payment_instructions"),
    ]);
    cartItems = cartItems.map(c => ({ ...c, cart_id: c.id }));
    $("#coLoading").style.display = "none";
    if (!cartItems.length) { $("#coEmpty").style.display = "block"; return; }
    $("#coForm").style.display = "grid";

    $("#coItems").innerHTML = cartItems.map(it => `
      <div class="bk-row"><span>${it.title} <span style="color:#999;">×${it.quantity}</span></span><span>${fmt(it.unit_price * it.quantity)}</span></div>
    `).join("");
    recompute();

    document.querySelectorAll('[name=payment_method]').forEach(r =>
      r.addEventListener("change", e => renderInstructions(e.target.value)));
    document.querySelectorAll('[name=payment_type]').forEach(r =>
      r.addEventListener("change", recompute));

    $("#coForm").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const btn = e.target.querySelector('button[type=submit]');
      btn.disabled = true; btn.textContent = "Placing booking…";
      try {
        const booking = await window.eventixData.createBooking({
          items: cartItems,
          event_date: fd.get("event_date"),
          guest_count: parseInt(fd.get("guest_count"), 10),
          contact_phone: fd.get("contact_phone"),
          notes: fd.get("notes") || null,
          payment_method: fd.get("payment_method"),
          payment_type: fd.get("payment_type"),
        });
        location.href = `my-bookings.html?id=${booking.id}&new=1`;
      } catch (err) {
        alert(err.message || "Failed to place booking");
        btn.disabled = false; btn.textContent = "Place Booking";
      }
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.eventixData) return;
    window.eventixData.onAuth(() => init());
  });
})();