import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyBookings, fmtBDT } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/my-bookings")({ component: MyBookingsPage });

// Mirrors the booking_status enum in Postgres.
const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#b45309" },
  confirmed: { label: "Confirmed", color: "#15803d" },
  completed: { label: "Paid", color: "#15803d" },
  cancelled: { label: "Cancelled", color: "#b91c1c" },
  refunded: { label: "Refunded", color: "#6b7280" },
};

function MyBookingsPage() {
  const { user, ready } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ready) return;
    if (!user) { setLoading(false); return; }
    listMyBookings().then((d) => { setList(d); setLoading(false); });
  }, [ready, user]);

  if (!ready || loading) return <div className="container section-padding">Loading…</div>;
  if (!user) return <div className="container section-padding"><h2>Please log in</h2></div>;
  if (!list.length) return (
    <div className="container section-padding" style={{ textAlign: "center" }}>
      <h2>No bookings yet</h2>
      <p style={{ marginTop: 8 }}><Link to="/venues" style={{ color: "var(--pink)" }}>Browse venues →</Link></p>
    </div>
  );

  return (
    <div className="page active"><div className="container section-padding">
      <h1 className="section-title">My Bookings</h1>
      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 20 }}>
        {list.map((b) => {
          const s = STATUS[b.status] || { label: b.status, color: "#444" };
          const due = (b.total_amount || 0) - (b.amount_paid || 0);
          return (
            <div key={b.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div>
                  <div style={{ fontWeight: 700 }}>#{b.receipt_number}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{new Date(b.created_at).toLocaleDateString()} · {(b.payment_method || "—").toUpperCase()}</div>
                </div>
                <span style={{ background: s.color + "20", color: s.color, padding: "4px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>{s.label}</span>
              </div>
              {(b.booking_items || []).map((it: any) => (
                <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14, padding: "4px 0" }}>
                  <span>{it.title_snapshot} <span style={{ color: "#999" }}>×{it.quantity}</span></span>
                  <span>{fmtBDT(it.line_total)}</span>
                </div>
              ))}
              <hr style={{ margin: "10px 0", border: 0, borderTop: "1px solid var(--border)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 600 }}><span>Total</span><span>{fmtBDT(b.total_amount)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span>Paid</span><span>{fmtBDT(b.amount_paid)}</span></div>
              {due > 0 && <div style={{ display: "flex", justifyContent: "space-between", color: "#b91c1c", fontWeight: 600 }}><span>Due</span><span>{fmtBDT(due)}</span></div>}
              {b.event_date && <div style={{ fontSize: 13, marginTop: 6 }}>Event date: <strong>{b.event_date}</strong></div>}
            </div>
          );
        })}
      </div>
    </div></div>
  );
}
