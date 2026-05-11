import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListBookings, adminUpdateBooking, adminMarkTransactionPaid, fmtBDT } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/bookings")({ component: BookingsPage });

// Admin bookings dashboard. Lists every booking with line items + transactions
// and exposes one-click status updates and "mark paid" for the latest tx.
function BookingsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  async function refresh() {
    setLoading(true);
    try { setRows(await adminListBookings({ status: filter || undefined })); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [filter]);

  async function setStatus(id: string, status: string) {
    try { await adminUpdateBooking(id, { status }); toast.success("Updated"); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  async function markTxPaid(txId: string) {
    try { await adminMarkTransactionPaid(txId); toast.success("Marked paid"); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Bookings</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid var(--border)" }}>
          <option value="">All statuses</option>
          {["pending", "confirmed", "completed", "cancelled", "refunded"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {loading ? <div>Loading…</div> : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {rows.map((b) => (
            <div key={b.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <div>
                  <strong>{b.receipt_number}</strong>
                  <span style={{ marginLeft: 10, padding: "2px 8px", background: "#f3f4f6", borderRadius: 6, fontSize: 12 }}>{b.status}</span>
                  <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>
                    {b.event_date || "—"} · {b.guest_count || "?"} guests · {b.contact_phone || "no phone"}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div><strong>{fmtBDT(b.total_amount)}</strong> total</div>
                  <div style={{ fontSize: 12, color: "#666" }}>Paid {fmtBDT(b.amount_paid)}</div>
                </div>
              </div>

              {b.booking_items?.length > 0 && (
                <ul style={{ margin: "10px 0", paddingLeft: 18, fontSize: 13 }}>
                  {b.booking_items.map((li: any) => (
                    <li key={li.id}>{li.title_snapshot} × {li.quantity} — {fmtBDT(li.line_total)}</li>
                  ))}
                </ul>
              )}

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                {["pending", "confirmed", "completed", "cancelled", "refunded"]
                  .filter((s) => s !== b.status)
                  .map((s) => (
                    <button key={s} onClick={() => setStatus(b.id, s)} style={btn}>→ {s}</button>
                  ))}
              </div>

              {b.transactions?.length > 0 && (
                <div style={{ marginTop: 10, padding: 10, background: "#f9fafb", borderRadius: 8 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 6 }}>Transactions</div>
                  {b.transactions.map((tx: any) => (
                    <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4 }}>
                      <span>{tx.gateway} · {tx.status} · {fmtBDT(tx.amount)}</span>
                      {tx.status === "initiated" && (
                        <button onClick={() => markTxPaid(tx.id)} className="btn-primary" style={{ fontSize: 11, padding: "2px 10px" }}>Mark paid</button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {!rows.length && <div style={{ color: "#888" }}>No bookings.</div>}
        </div>
      )}
    </div>
  );
}

const btn: React.CSSProperties = { padding: "4px 10px", border: "1px solid var(--border)", background: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 12 };
