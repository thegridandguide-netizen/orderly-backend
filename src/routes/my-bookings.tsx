/**
 * /my-bookings — customer's booking history + payment proof submission.
 */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listMyBookings, listMyPaymentProofs, submitPaymentProof, fmtBDT } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Receipt } from "@/routes/Receipt";

export const Route = createFileRoute("/my-bookings")({ component: MyBookingsPage });

const STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pending Approval", color: "#b45309" },
  confirmed: { label: "Confirmed", color: "#15803d" },
  completed: { label: "Completed", color: "#15803d" },
  cancelled: { label: "Cancelled", color: "#b91c1c" },
};

function MyBookingsPage() {
  const { user, ready } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [proofs, setProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<string | null>(null);

  async function refresh() {
    if (!user) return;
    try {
      const [b, p] = await Promise.all([listMyBookings(), listMyPaymentProofs(user.id)]);
      setBookings(b);
      setProofs(p);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (ready && user) refresh();
    else if (ready && !user) setLoading(false);
  }, [user, ready]);

  if (loading) return <div className="p-20 text-center">Loading your bookings...</div>;
  if (!user) return <div className="p-20 text-center">Please login to view your bookings.</div>;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <h1 style={{ marginBottom: 30 }}>My Bookings</h1>

      {!bookings.length ? (
        <div style={{ padding: 60, textAlign: "center", background: "#f9f9f9", borderRadius: 12 }}>
          <p style={{ color: "#666", marginBottom: 20 }}>You haven't made any bookings yet.</p>
          <Link to="/" className="btn-primary" style={{ display: "inline-block" }}>Explore Venues</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 24 }}>
          {bookings.map((b) => {
            const st = STATUS[b.status] || { label: b.status, color: "#666" };
            const total = Number(b.total_amount || 0);
            const paid = Number(b.amount_paid || 0);
            const remainingDue = total - paid;
            
            // Dynamic check if 20% advance milestone has been cleared or verified
            const advanceRequired = Math.round(total * 0.20);
            const clearAdvancePhase = paid >= advanceRequired;
            const absoluteTarget = !clearAdvancePhase ? advanceRequired - paid : remainingDue;

            return (
              <div key={b.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
                <div style={{ padding: 20, display: "flex", justifyContent: "space-between", alignItems: "start", borderBottom: "1px solid #f9f9f9" }}>
                  <div>
                    <div style={{ fontSize: 12, color: "#888", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>
                      Receipt #{b.receipt_number}
                    </div>
                    <h3 style={{ marginBottom: 4 }}>{b.booking_items?.[0]?.title_snapshot || "Event Booking"}</h3>
                    <div style={{ fontSize: 14, color: "#444" }}>
                      <strong>Date:</strong> {b.event_date ? new Date(b.event_date).toLocaleDateString() : "N/A"}
                    </div>
                    <div style={{ fontSize: 14, color: "#444", marginTop: 2 }}>
                      <strong>Guests:</strong> {b.guest_count || 0}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: st.color, fontWeight: 700, fontSize: 14, textTransform: "uppercase", marginBottom: 8 }}>{st.label}</div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>{fmtBDT(total)}</div>
                    {paid > 0 && <div style={{ fontSize: 12, color: "#059669" }}>Total Paid So Far: {fmtBDT(paid)}</div>}
                    {remainingDue > 0 && (
                      <div style={{ fontSize: 12, color: "var(--pink)", fontWeight: 600 }}>
                        {!clearAdvancePhase ? `20% Deposit Due: ${fmtBDT(absoluteTarget)}` : `Remaining Due (80%): ${fmtBDT(absoluteTarget)}`}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ padding: "15px 20px", background: "#fafafa", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10 }}>
                    {remainingDue > 0 && b.status !== "cancelled" && (
                      <button onClick={() => setPayingId(b.id)} className="btn-primary" style={{ padding: "8px 16px", fontSize: 13 }}>
                        {!clearAdvancePhase ? `Pay 20% Advance (${fmtBDT(absoluteTarget)})` : `Pay Remaining Balance (${fmtBDT(absoluteTarget)})`}
                      </button>
                    )}
                    <Receipt b={b} />
                  </div>
                </div>

                {payingId === b.id && (
                  <div style={{ padding: 20, borderTop: "1px solid var(--border)" }}>
                    <PaymentProofForm 
                      bookingId={b.id} 
                      due={absoluteTarget} 
                      onSuccess={() => { setPayingId(null); refresh(); }} 
                      onCancel={() => setPayingId(null)} 
                    />
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

function PaymentProofForm({ bookingId, due, onSuccess, onCancel }: any) {
  const [reference, setReference] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!reference) return toast.error("Please provide transaction reference");
    setBusy(true);
    try {
      await submitPaymentProof({
        booking_id: bookingId,
        amount: due, 
        reference,
        image_url: imageUrl,
        notes: notes || undefined
      });
      toast.success("Payment proof submitted successfully!");
      onSuccess();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const inp = { width: "100%", padding: "8px", borderRadius: 6, border: "1px solid #ddd", marginTop: 4, fontSize: 13 };

  return (
    <div style={{ background: "#f9f9f9", padding: 16, border: "1px solid var(--border)", borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 13, color: "#333" }}>Required Amount to Pay: <strong style={{ color: "var(--pink)" }}>{fmtBDT(due)}</strong></div>
      
      <label style={{ fontSize: 12, fontWeight: 600 }}>Transaction Reference
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g bKash TrxID" style={inp} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 600 }}>Screenshot URL (optional)
        <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://" style={inp} />
      </label>
      <label style={{ fontSize: 12, fontWeight: 600 }}>Payment Note
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add specific details or instructions regarding this transaction..." rows={2} style={{ ...inp, fontFamily: "inherit", resize: "vertical" }} />
      </label>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button type="button" onClick={submit} disabled={busy} className="btn-primary" style={{ padding: "8px 14px", fontSize: 12 }}>Submit Proof</button>
        <button type="button" onClick={onCancel} style={{ padding: "8px 14px", border: "1px solid #ddd", background: "#fff", borderRadius: 6, fontSize: 12 }}>Cancel</button>
      </div>
    </div>
  );
}