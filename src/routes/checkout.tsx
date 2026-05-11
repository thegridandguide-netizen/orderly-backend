import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listCart, createBooking, computePricing, fmtBDT, type CartItem, type PricingBreakdownLine } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

function CheckoutPage() {
  const { user, ready } = useAuth();
  const nav = useNavigate();
  const [items, setItems] = useState<CartItem[]>([]);
  const [event_date, setDate] = useState("");
  const [guest_count, setGuests] = useState("");
  const [contact_phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [payment_method, setMethod] = useState("bkash");
  const [payment_type, setType] = useState<"deposit" | "full">("deposit");
  const [busy, setBusy] = useState(false);
  const [pricing, setPricing] = useState<{ breakdown: PricingBreakdownLine[]; total: number } | null>(null);
  useEffect(() => { if (ready) listCart().then(setItems); }, [ready, user]);
  const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);
  // Recompute taxes/discounts/fees whenever the cart subtotal changes.
  useEffect(() => { if (subtotal) computePricing(subtotal).then(setPricing); }, [subtotal]);
  if (!ready) return <div className="container section-padding">Loading…</div>;
  if (!user) return <div className="container section-padding"><h2>Please log in</h2></div>;
  if (!items.length) return <div className="container section-padding"><h2>Cart is empty</h2><Link to="/venues">Browse →</Link></div>;
  const total = pricing?.total ?? subtotal;
  const due = payment_type === "full" ? total : Math.round(total * 0.2);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const b = await createBooking({ items: items.map((it) => ({ ...it, cart_id: it.id })) as any, event_date: event_date || undefined, guest_count: guest_count ? Number(guest_count) : undefined, contact_phone, notes, payment_method, payment_type });
      toast.success(`Booking ${b.receipt_number} created!`); nav({ to: "/my-bookings" });
    } catch (err: any) { toast.error(err.message || "Could not create booking"); } finally { setBusy(false); }
  }
  return (
    <div className="page active"><div className="container section-padding">
      <h1 className="section-title">Checkout</h1>
      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 28, marginTop: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div><label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Event date</label><input type="date" value={event_date} onChange={(e) => setDate(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }} /></div>
          <div><label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Guest count</label><input type="number" value={guest_count} onChange={(e) => setGuests(e.target.value)} placeholder="e.g. 200" style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }} /></div>
          <div><label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Contact phone</label><input value={contact_phone} onChange={(e) => setPhone(e.target.value)} placeholder="+880…" style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }} /></div>
          <div><label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Notes</label><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }} /></div>
          <div><label style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>Payment method</label><select value={payment_method} onChange={(e) => setMethod(e.target.value)} style={{ width: "100%", padding: 10, border: "1px solid #ddd", borderRadius: 8 }}><option value="bkash">bKash</option><option value="nagad">Nagad</option><option value="rocket">Rocket</option><option value="bank">Bank transfer</option><option value="card">Card</option></select></div>
          <div><label style={{ marginRight: 16 }}><input type="radio" checked={payment_type === "deposit"} onChange={() => setType("deposit")} /> Deposit (20%)</label><label><input type="radio" checked={payment_type === "full"} onChange={() => setType("full")} /> Full amount</label></div>
        </div>
        <aside style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: 24, position: "sticky", top: 100, alignSelf: "start" }}>
          <h3 style={{ marginBottom: 14 }}>Order summary</h3>
          {items.map((it) => (<div key={it.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 13 }}><span>{it.title} × {it.quantity}</span><span>{fmtBDT(it.unit_price * it.quantity)}</span></div>))}
          <hr style={{ margin: "14px 0", border: "none", borderTop: "1px solid var(--border)" }} />
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span>Subtotal</span><strong>{fmtBDT(subtotal)}</strong></div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}><span>Due now</span><strong style={{ color: "var(--pink)" }}>{fmtBDT(due)}</strong></div>
          <button type="submit" className="btn-primary" disabled={busy} style={{ width: "100%", padding: 14, borderRadius: 10 }}>{busy ? "Processing…" : "Confirm Booking"}</button>
        </aside>
      </form>
    </div></div>
  );
}