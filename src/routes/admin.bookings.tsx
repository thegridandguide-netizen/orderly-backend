/**
 * /admin/bookings — admin review of bookings + payment proofs.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminListBookings, adminUpdateBooking, adminApprovePaymentProof, adminRejectPaymentProof, fmtBDT } from "@/lib/data";
import { toast } from "sonner";
import { Receipt } from "@/routes/Receipt";

export const Route = createFileRoute("/admin/bookings")({ component: BookingsPage });

function BookingsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setRows(await adminListBookings({ status: filter || undefined }));
    } catch (e: any) {
      toast.error(e.message || "Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [filter]);

  async function setStatus(id: string, status: string) {
    try {
      await adminUpdateBooking(id, { status });
      toast.success("Booking status updated");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function approveProof(id: string) {
    try {
      await adminApprovePaymentProof(id);
      toast.success("Payment approved");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function rejectProof(id: string) {
    try {
      await adminRejectPaymentProof(id);
      toast.success("Payment rejected");
      refresh();
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <div style={{ paddingBottom: 60 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2>Manage Bookings (Advance Deposit System)</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} style={{ padding: 8, borderRadius: 6, border: "1px solid var(--border)" }}>
          <option value="">All statuses</option>
          {["pending", "confirmed", "completed", "cancelled"].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {loading ? <div>Loading bookings...</div> : (
        <div style={{ display: "grid", gap: 16 }}>
          {rows.map((b) => {
            const total = Number(b.total_amount || 0);
            const paid = Number(b.amount_paid || 0);
            const remaining = total - paid;
            const advanceThreshold = Math.round(total * 0.20);
            const isAdvancePaid = paid >= advanceThreshold;

            return (
              <div key={b.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.receipt_number} — {b.profiles?.name || "Customer"}</div>
                    <div style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
                      {b.event_date ? new Date(b.event_date).toLocaleDateString() : "N/A"} · {b.guest_count || 0} guests
                    </div>
                    {/* Visual Payment Workflow Flags */}
                    <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: b.status === "confirmed" ? "#dcfce7" : "#fffbeb", color: b.status === "confirmed" ? "#166534" : "#b45309" }}>
                        Status: {b.status.toUpperCase()}
                      </span>
                      <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: isAdvancePaid ? "#e0f2fe" : "#fee2e2", color: isAdvancePaid ? "#0369a1" : "#991b1b" }}>
                        {isAdvancePaid ? "✅ 20% Advance Verified" : "❌ Awaiting 20% Advance"}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 16, fontWeight: 800 }}>Total: {fmtBDT(total)}</div>
                    <div style={{ fontSize: 12, color: "#059669" }}>Collected Ledger: {fmtBDT(paid)}</div>
                    {remaining > 0 ? (
                      <div style={{ fontSize: 12, color: "#b91c1c", fontWeight: 700 }}>Remaining Due (80%): {fmtBDT(remaining)}</div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#166534", fontWeight: 700 }}>🎉 Paid In Full</div>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 15 }}>
                  {["confirmed", "completed", "cancelled"].map((s) => (
                    <button key={s} onClick={() => setStatus(b.id, s)} style={btn}>{s}</button>
                  ))}
                  <div style={{ marginLeft: "auto" }}>
                    <Receipt b={b} />
                  </div>
                </div>

                {b.payment_proofs?.filter((p: any) => p.status === "pending").length > 0 && (
                  <div style={{ marginTop: 15, padding: 12, background: "#fffbeb", borderRadius: 8, border: "1px solid #fef3c7" }}>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8 }}>Pending Payment Proofs:</div>
                    {b.payment_proofs.filter((p: any) => p.status === "pending").map((p: any) => (
                      <div key={p.id} style={{ borderBottom: "1px dashed #e2e8f0", paddingBottom: 8, marginBottom: 8, lastChild: { borderBottom: "none", paddingBottom: 0, marginBottom: 0 } }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, fontWeight: 600 }}>{fmtBDT(p.amount)} via {p.gateway || p.payment_method || "Gateway"} (Ref: {p.reference})</span>
                          <div>
                            <button onClick={() => approveProof(p.id)} className="btn-primary" style={{ padding: "4px 12px", fontSize: 12, marginRight: 6 }}>Approve</button>
                            <button onClick={() => rejectProof(p.id)} style={{ padding: "4px 12px", fontSize: 12, background: "#fff", border: "1px solid #ddd", borderRadius: 6 }}>Reject</button>
                          </div>
                        </div>
                        {p.notes && (
                          <div style={{ marginTop: 6, fontSize: 12, color: "#451a03", background: "#fef3c7", padding: "6px 10px", borderRadius: 4, fontStyle: "italic" }}>
                            <strong>User Note:</strong> {p.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const btn: React.CSSProperties = { padding: "5px 12px", border: "1px solid #ddd", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer" };