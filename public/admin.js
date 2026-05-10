(function () {
  const sb = () => window.eventixData.sb;
  const $ = (s, r=document) => r.querySelector(s);
  const fmt = (n) => "৳ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n || 0);
  const STATUSES = ["pending","deposit_paid","paid","cancelled","refunded"];
  const LABEL = { pending:"Pending", deposit_paid:"Confirmed", paid:"Paid", cancelled:"Cancelled", refunded:"Refunded" };

  async function init() {
    const u = await window.eventixData.getUser();
    if (!u) { $("#adGuard").style.display = "block"; return; }
    const ok = await window.eventixData.isAdmin();
    if (!ok) { $("#adGuard").style.display = "block"; return; }
    $("#adApp").style.display = "block";
    document.querySelectorAll(".ad-tab").forEach(t => t.onclick = () => {
      document.querySelectorAll(".ad-tab").forEach(x => x.classList.remove("active"));
      t.classList.add("active"); load(t.dataset.tab);
    });
    load("bookings");
  }

  async function load(tab) {
    const body = $("#adBody"); body.innerHTML = "Loading…";
    try {
      if (tab === "bookings") return renderBookings(body);
      if (tab === "enquiries") return renderTable(body, "enquiries", ["created_at","target_type","target_id","status","phone","event_date","guest_count","message"], { editStatus: ["new","contacted","closed"] });
      if (tab === "venues") return renderCrud(body, "venues", ["name","city","area","veg_price","non_veg_price","rental_price","capacity_min","capacity_max","handpicked"]);
      if (tab === "vendors") return renderCrud(body, "vendor_profiles", ["business_name","city","verified","price_from","price_to"]);
      if (tab === "albums") return renderCrud(body, "albums", ["title","city","featured","photo_count","cover_image_url"]);
      if (tab === "users") return renderUsers(body);
      if (tab === "settings") return renderSettings(body);
    } catch (e) { body.innerHTML = `<div style="color:#b91c1c">${e.message}</div>`; }
  }

  async function renderBookings(body) {
    const rows = await window.eventixData.adminListBookings({});
    body.innerHTML = `<table class="ad-table"><thead><tr><th>#</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Paid</th><th>Method</th><th>Status</th><th>Actions</th></tr></thead><tbody>${
      rows.map(b => `
        <tr data-id="${b.id}">
          <td>${b.receipt_number || b.id.slice(0,6)}</td>
          <td>${new Date(b.created_at).toLocaleDateString()}</td>
          <td>${b.contact_phone||'—'}<br><small>${b.event_date||''}</small></td>
          <td>${(b.booking_items||[]).map(i=>`${i.title_snapshot} ×${i.quantity}`).join('<br>')}</td>
          <td>${fmt(b.total_amount)}</td>
          <td>${fmt(b.amount_paid)} ${b.paid?'<span class="bk-status bk-st-paid">PAID</span>':''}</td>
          <td>${(b.payment_method||'—').toUpperCase()}</td>
          <td><select data-act="status">${STATUSES.map(s=>`<option value="${s}" ${b.status===s?'selected':''}>${LABEL[s]}</option>`).join('')}</select></td>
          <td>
            <button class="bk-btn" data-act="togglePaid">${b.paid?'Unmark Paid':'Mark Paid'}</button>
            ${(b.payment_proofs||[]).length?`<button class="bk-btn" data-act="proofs">Proofs (${b.payment_proofs.length})</button>`:''}
          </td>
        </tr>`).join("")
    }</tbody></table>`;
    body.querySelectorAll("tr[data-id]").forEach(tr => {
      const id = tr.dataset.id; const b = rows.find(r => r.id === id);
      tr.querySelector('[data-act=status]').onchange = async (e) => {
        await window.eventixData.adminUpdateBooking(id, { status: e.target.value }); renderBookings(body);
      };
      tr.querySelector('[data-act=togglePaid]').onclick = async () => {
        const paid = !b.paid;
        await window.eventixData.adminUpdateBooking(id, { paid, amount_paid: paid ? b.total_amount : 0, status: paid ? 'paid' : b.status, paid_at: paid ? new Date().toISOString() : null });
        renderBookings(body);
      };
      tr.querySelector('[data-act=proofs]')?.addEventListener("click", () => {
        const html = (b.payment_proofs||[]).map(p=>`<div style="margin:8px 0;padding:8px;border:1px solid #eee;border-radius:8px;">
          <a href="${p.image_url}" target="_blank">View screenshot</a> · ref: ${p.reference||'—'} · ${fmt(p.amount)} · ${p.approved===true?'Approved':p.approved===false?'Rejected':'Pending'}
          <div style="margin-top:6px;"><button class="bk-btn" data-pid="${p.id}" data-ok="1">Approve</button> <button class="bk-btn" data-pid="${p.id}" data-ok="0">Reject</button></div>
        </div>`).join("");
        const w = window.open("", "_blank", "width=520,height=600"); w.document.write(`<html><body style="font-family:sans-serif;padding:20px;">${html}</body></html>`);
      });
    });
  }

  async function renderTable(body, table, cols, opts={}) {
    const { data } = await sb().from(table).select("*").order("created_at",{ascending:false}).limit(200);
    body.innerHTML = `<table class="ad-table"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}<th></th></tr></thead><tbody>${
      (data||[]).map(r => `<tr data-id="${r.id}">${cols.map(c=>`<td>${r[c]==null?'—':String(r[c]).slice(0,80)}</td>`).join('')}<td>${
        opts.editStatus ? `<select data-act="status">${opts.editStatus.map(s=>`<option ${r.status===s?'selected':''}>${s}</option>`).join('')}</select>` : ''
      }</td></tr>`).join("")
    }</tbody></table>`;
    if (opts.editStatus) body.querySelectorAll("tr[data-id]").forEach(tr=>{
      tr.querySelector('[data-act=status]').onchange = async e => {
        await sb().from(table).update({ status: e.target.value }).eq("id", tr.dataset.id);
      };
    });
  }

  async function renderCrud(body, table, cols) {
    const { data } = await sb().from(table).select("*").limit(500);
    body.innerHTML = `<div style="margin-bottom:10px;"><button class="bk-btn bk-btn-primary" id="adAdd"><i class="fa-solid fa-plus"></i> Add</button></div>
    <table class="ad-table"><thead><tr>${cols.map(c=>`<th>${c}</th>`).join('')}<th></th></tr></thead><tbody>${
      (data||[]).map(r=>`<tr data-id="${r.id}">${cols.map(c=>`<td>${r[c]==null?'—':String(r[c]).slice(0,60)}</td>`).join('')}<td><button class="bk-btn" data-act="edit">Edit</button> <button class="bk-btn" data-act="del">Delete</button></td></tr>`).join("")
    }</tbody></table>`;
    body.querySelector("#adAdd").onclick = () => editForm(table, cols, null, () => renderCrud(body, table, cols));
    body.querySelectorAll("tr[data-id]").forEach(tr => {
      const id = tr.dataset.id; const r = data.find(x=>x.id===id);
      tr.querySelector('[data-act=edit]').onclick = () => editForm(table, cols, r, () => renderCrud(body, table, cols));
      tr.querySelector('[data-act=del]').onclick = async () => { if(!confirm('Delete?')) return; await sb().from(table).delete().eq("id", id); renderCrud(body, table, cols); };
    });
  }

  function editForm(table, cols, row, done) {
    const w = window.open("", "_blank", "width=520,height=700");
    const fields = cols.map(c => `<label style="display:block;margin:8px 0;">${c}<br><input name="${c}" value="${row?.[c]??''}" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;"></label>`).join("");
    w.document.write(`<html><body style="font-family:sans-serif;padding:20px;"><h3>${row?'Edit':'Add'} ${table}</h3><form id="f">${fields}<button>Save</button></form></body></html>`);
    w.document.getElementById("f").onsubmit = async (e) => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const patch = {}; cols.forEach(c => { let v = fd.get(c); if (v === '') v = null; patch[c] = v === 'true' ? true : v === 'false' ? false : v; });
      try {
        if (row) await sb().from(table).update(patch).eq("id", row.id);
        else await sb().from(table).insert(patch);
        w.close(); done();
      } catch (err) { alert(err.message); }
    };
  }

  async function renderUsers(body) {
    const { data } = await sb().from("profiles").select("*").limit(500);
    body.innerHTML = `<table class="ad-table"><thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Created</th></tr></thead><tbody>${
      (data||[]).map(u=>`<tr data-id="${u.id}"><td>${u.email||'—'}</td><td>${u.name||'—'}</td><td><select data-act="role"><option ${u.role==='user'?'selected':''}>user</option><option ${u.role==='admin'?'selected':''}>admin</option><option ${u.role==='moderator'?'selected':''}>moderator</option></select></td><td>${new Date(u.created_at).toLocaleDateString()}</td></tr>`).join("")
    }</tbody></table>`;
    body.querySelectorAll("tr[data-id]").forEach(tr => {
      tr.querySelector('[data-act=role]').onchange = async e => { await sb().from("profiles").update({ role: e.target.value }).eq("id", tr.dataset.id); };
    });
  }

  async function renderSettings(body) {
    const v = await window.eventixData.getSetting("payment_instructions") || {};
    body.innerHTML = `<h3>Payment Instructions</h3>
      <label>bKash number<input id="sBkash" value="${v.bkash?.number||''}"></label>
      <label>Nagad number<input id="sNagad" value="${v.nagad?.number||''}"></label>
      <label>Bank account name<input id="sBankName" value="${v.bank?.account_name||''}"></label>
      <label>Bank account number<input id="sBankNum" value="${v.bank?.account_number||''}"></label>
      <label>Bank<input id="sBank" value="${v.bank?.bank||''}"></label>
      <label>Branch<input id="sBranch" value="${v.bank?.branch||''}"></label>
      <label>Note<textarea id="sNote">${v.note||''}</textarea></label>
      <button class="bk-btn bk-btn-primary" id="sSave">Save</button>`;
    body.querySelectorAll("label").forEach(l => l.style.cssText="display:block;margin:10px 0;");
    body.querySelectorAll("input,textarea").forEach(i => i.style.cssText="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;margin-top:4px;");
    body.querySelector("#sSave").onclick = async () => {
      const value = {
        bkash: { number: $("#sBkash").value, type: 'Personal' },
        nagad: { number: $("#sNagad").value, type: 'Personal' },
        bank:  { account_name: $("#sBankName").value, account_number: $("#sBankNum").value, bank: $("#sBank").value, branch: $("#sBranch").value },
        note: $("#sNote").value,
      };
      await sb().from("site_settings").upsert({ key: "payment_instructions", value, updated_at: new Date().toISOString() });
      alert("Saved");
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!window.eventixData) return;
    window.eventixData.onAuth(() => init());
  });
})();