(function () {
  const $ = (s, r=document) => r.querySelector(s);
  const fmt = (n) => "৳ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
  const params = new URLSearchParams(location.search);

  const STATUS_LABEL = { pending:"Pending", deposit_paid:"Confirmed", paid:"Paid", cancelled:"Cancelled", refunded:"Refunded" };
  const STATUS_CLASS = { pending:"bk-st-pending", deposit_paid:"bk-st-confirmed", paid:"bk-st-paid", cancelled:"bk-st-cancelled", refunded:"bk-st-cancelled" };

  let settings = null;

  function instructionsFor(method) {
    if (!settings) return "";
    if (method === "bkash") return `<b>bKash:</b> ${settings.bkash?.number} (${settings.bkash?.type||'Personal'})`;
    if (method === "nagad") return `<b>Nagad:</b> ${settings.nagad?.number} (${settings.nagad?.type||'Personal'})`;
    if (method === "bank")  return `<b>Bank:</b> ${settings.bank?.bank} – A/C ${settings.bank?.account_number} (${settings.bank?.account_name})`;
    if (method === "cash")  return `<b>Cash:</b> Pay at our office or to your coordinator.`;
    return "";
  }

  function downloadReceipt(b) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const items = b.booking_items || [];
    doc.setFontSize(20); doc.text("Eventix", 14, 18);
    doc.setFontSize(10); doc.setTextColor(120); doc.text("Booking Receipt", 14, 24);
    doc.setTextColor(0); doc.setFontSize(11);
    doc.text(`Receipt #: ${b.receipt_number || b.id.slice(0,8)}`, 140, 18);
    doc.text(`Date: ${new Date(b.created_at).toLocaleDateString()}`, 140, 24);
    doc.line(14, 30, 196, 30);
    doc.setFontSize(11);
    doc.text(`Status: ${STATUS_LABEL[b.status]}`, 14, 40);
    doc.text(`Payment: ${(b.payment_method||'').toUpperCase()} (${b.payment_type})`, 14, 46);
    if (b.event_date) doc.text(`Event date: ${b.event_date}`, 14, 52);
    if (b.guest_count) doc.text(`Guests: ${b.guest_count}`, 14, 58);
    if (b.contact_phone) doc.text(`Phone: ${b.contact_phone}`, 100, 58);
    let y = 72;
    doc.setFont(undefined, 'bold'); doc.text("Item", 14, y); doc.text("Qty", 130, y); doc.text("Price", 150, y); doc.text("Total", 175, y);
    doc.setFont(undefined, 'normal'); y += 4; doc.line(14, y, 196, y); y += 6;
    items.forEach(it => {
      doc.text(String(it.title_snapshot).slice(0,55), 14, y);
      doc.text(String(it.quantity), 130, y);
      doc.text(fmt(it.unit_price), 150, y);
      doc.text(fmt(it.line_total), 175, y);
      y += 7;
    });
    y += 4; doc.line(14, y, 196, y); y += 8;
    doc.text(`Subtotal:`, 140, y); doc.text(fmt(b.subtotal), 175, y); y += 7;
    doc.text(`Total:`, 140, y); doc.setFont(undefined,'bold'); doc.text(fmt(b.total_amount), 175, y); doc.setFont(undefined,'normal'); y += 7;
    doc.text(`Paid:`, 140, y); doc.text(fmt(b.amount_paid), 175, y);
    doc.setFontSize(9); doc.setTextColor(120);
    doc.text("Thank you for booking with Eventix.", 14, 280);
    doc.save(`receipt-${b.receipt_number || b.id.slice(0,8)}.pdf`);
  }

  function bookingCard(b) {
    const items = (b.booking_items||[]).map(it =>
      `<div class="bk-row"><span>${it.title_snapshot} <span style="color:#999;">×${it.quantity}</span></span><span>${fmt(it.line_total)}</span></div>`
    ).join("");
    const due = (b.total_amount || 0) - (b.amount_paid || 0);
    return `
    <div class="bk-card bk-booking" data-id="${b.id}">
      <div class="bk-bk-head">
        <div>
          <div class="bk-bk-rn">#${b.receipt_number || b.id.slice(0,8)}</div>
          <div class="bk-bk-meta">Placed ${new Date(b.created_at).toLocaleDateString()} · ${(b.payment_method||'—').toUpperCase()}</div>
        </div>
        <span class="bk-status ${STATUS_CLASS[b.status]||''}">${STATUS_LABEL[b.status]||b.status}</span>
      </div>
      <div class="bk-bk-body">
        ${items}
        <hr>
        <div class="bk-row"><span>Total</span><span>${fmt(b.total_amount)}</span></div>
        <div class="bk-row"><span>Paid</span><span>${fmt(b.amount_paid)}</span></div>
        ${due > 0 ? `<div class="bk-row" style="color:#b91c1c;font-weight:600;"><span>Balance due</span><span>${fmt(due)}</span></div>` : ''}
        ${b.event_date ? `<div class="bk-row"><span>Event date</span><span>${b.event_date}</span></div>` : ''}
        ${!b.paid ? `<div class="bk-pay-instr">${instructionsFor(b.payment_method)}</div>` : ''}
      </div>
      <div class="bk-bk-actions">
        <button class="bk-btn" data-act="pdf"><i class="fa-solid fa-download"></i> Download Receipt</button>
        ${!b.paid ? `<button class="bk-btn bk-btn-primary" data-act="upload"><i class="fa-solid fa-upload"></i> Upload Payment Proof</button>` : ''}
      </div>
      <input type="file" accept="image/*" style="display:none;" data-input="proof">
    </div>`;
  }

  async function render() {
    const u = await window.eventixData.getUser();
    if (!u) { location.href = "index.html"; return; }
    if (params.get("new") === "1") $("#mbNew").style.display = "block";
    [settings] = await Promise.all([window.eventixData.getSetting("payment_instructions")]);
    const list = await window.eventixData.listMyBookings();
    $("#mbLoading").style.display = "none";
    if (!list.length) { $("#mbEmpty").style.display = "block"; return; }
    $("#mbList").innerHTML = list.map(bookingCard).join("");
    list.forEach(b => {
      const root = $(`.bk-booking[data-id="${b.id}"]`);
      root.querySelector('[data-act=pdf]')?.addEventListener("click", () => downloadReceipt(b));
      const fileInput = root.querySelector('[data-input=proof]');
      root.querySelector('[data-act=upload]')?.addEventListener("click", () => fileInput.click());
      fileInput?.addEventListener("change", async (e) => {
        const f = e.target.files?.[0]; if (!f) return;
        const ref = prompt("Transaction reference (trxID / slip number):") || null;
        try {
          await window.eventixData.uploadPaymentProof({ booking_id: b.id, file: f, reference: ref, amount: b.total_amount });
          alert("Proof uploaded. Admin will verify shortly.");
          render();
        } catch (err) { alert(err.message || "Upload failed"); }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.eventixData) return;
    window.eventixData.onAuth(() => render());
  });
})();