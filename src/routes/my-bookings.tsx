/**
 * /my-bookings — customer's booking history + payment proof submission.
 *
 * For each booking, customer can submit a payment proof (reference +
 * screenshot URL + amount). Proof status: pending → approved/rejected by
 * admin from /admin/bookings. Approval auto-advances booking status to
 * `confirmed` (partial) or `completed` (paid in full).
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyBookings, listMyPaymentProofs, submitPaymentProof, fmtBDT } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/my-bookings")({ component: MyBookingsPage });

// Mirrors the booking_status enum in Postgres.
const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending", color: "#b45309" },
  confirmed: { label: "Confirmed", color: "#15803d" },
  completed: { label: "Paid", color: "#15803d" },
  cancelled: { label: "Cancelled", color: "#b91c1c" },
  refunded: { label: "Refunded", color: "#6b7280" },
};

const PROOF_STATUS: Record<string, string> = {
  pending: "#b45309", approved: "#15803d", rejected: "#b91c1c",
};

function MyBookingsPage() {
  const { user, ready } = useAuth();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    const d = await listMyBookings();
    // Hydrate proofs per booking so we can show pending / approved status inline.
    const withProofs = await Promise.all(d.map(async (b: any) => ({
      ...b, payment_proofs: await listMyPaymentProofs(b.id),
    })));
    setList(withProofs); setLoading(false);
  }

  useEffect(() => {
    if (!ready) return;
    if (!user) { setLoading(false); return; }
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        {list.map((b) => (
          <BookingCard key={b.id} b={b} onChange={refresh} />
        ))}
      </div>
    </div></div>
  );
}

function BookingCard({ b, onChange }: { b: any; onChange: () => void }) {
  const s = STATUS[b.status] || { label: b.status, color: "#444" };
  const due = (b.total_amount || 0) - (b.amount_paid || 0);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 18 }}>
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

      {b.payment_proofs?.length > 0 && (
        <div style={{ marginTop: 12, padding: 10, background: "#f9fafb", borderRadius: 8, fontSize: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Payment submissions</div>
          {b.payment_proofs.map((p: any) => (
            <div key={p.id} style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
              <span>{p.reference || "(no ref)"} — {fmtBDT(p.amount || 0)}</span>
              <span style={{ color: PROOF_STATUS[p.status] || "#444", fontWeight: 600 }}>{p.status}</span>
            </div>
          ))}
        </div>
      )}

      {due > 0 && b.status !== "cancelled" && (
        <div style={{ marginTop: 12 }}>
          {!open ? (
            <button className="btn-primary" style={{ padding: "8px 16px" }} onClick={() => setOpen(true)}>
              <i className="fa-solid fa-money-bill" /> Submit payment
            </button>
          ) : (
            <PayForm bookingId={b.id} due={due} method={b.payment_method} onDone={() => { setOpen(false); onChange(); }} onCancel={() => setOpen(false)} />
          )}
        </div>
      )}
    </div>
  );
}

function PayForm({ bookingId, due, method, onDone, onCancel }: {
  bookingId: string; due: number; method: string; onDone: () => void; onCancel: () => void;
}) {
  const [amount, setAmount] = useState(String(due));
  const [reference, setReference] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!reference.trim()) { toast.error("Transaction reference is required"); return; }
    if (!Number(amount)) { toast.error("Enter the amount you paid"); return; }
    setBusy(true);
    try {
      await submitPaymentProof({
        booking_id: bookingId, amount: Number(amount), reference: reference.trim(),
        image_url: imageUrl.trim() || undefined, notes: notes.trim() || undefined,
      });
      toast.success("Payment submitted — awaiting admin verification");
      onDone();
    } catch (err: any) { toast.error(err.message || "Could not submit payment"); }
    finally { setBusy(false); }
  }
  const inp: React.CSSProperties = { width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 };
  return (
    <form onSubmit={submit} style={{ marginTop: 8, padding: 12, background: "#fafafa", border: "1px solid var(--border)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 12, color: "#666" }}>
        Send {fmtBDT(due)} via <strong>{(method || "manual").toUpperCase()}</strong>, then enter the transaction reference below.
      </div>
      <label style={{ fontSize: 12, fontWeight: 600 }}>Amount paid (BDT)
        <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} style={inp} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 600 }}>Transaction reference
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. TXN12345" style={inp} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 600 }}>Screenshot URL (optional)
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://…" style={inp} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 600 }}>Notes (optional)
        <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} style={inp} />
      </label>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={onCancel} style={{ padding: "8px 14px", border: "1px solid var(--border)", background: "#fff", borderRadius: 6 }}>Cancel</button>
        <button type="submit" disabled={busy} className="btn-primary" style={{ padding: "8px 14px" }}>{busy ? "Submitting…" : "Submit payment"}</button>
      </div>
    </form>
  );
}
