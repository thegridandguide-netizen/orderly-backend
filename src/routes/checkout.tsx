/**
 * /checkout — converts the user's cart into a booking.
 */
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { listCart, createBooking, computePricing, fmtBDT, type CartItem, type PricingBreakdownLine } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/checkout")({ component: CheckoutPage });

type ExtendedCartItem = CartItem & {
  veg_price?: number | null;
  non_veg_price?: number | null;
};

function CheckoutPage() {
  const { user, ready } = useAuth();
  const nav = useNavigate();

  const [items, setItems] = useState<ExtendedCartItem[]>([]);
  const [event_date, setDate] = useState("");
  const [veg_count, setVegCount] = useState(0);
  const [non_veg_count, setNonVegCount] = useState(0);
  const [contact_phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [payment_method, setMethod] = useState("bkash");
  const [payment_type, setType] = useState<"deposit" | "full">("deposit");
  const [busy, setBusy] = useState(false);
  const [pricing, setPricing] = useState<any>(null);

  // Load cart
  useEffect(() => {
    if (ready && user) {
      listCart().then((data) => setItems(data as ExtendedCartItem[])).catch(console.error);
    }
  }, [user, ready]);

  // === DYNAMIC FOOD PRICING FROM VENUE ===
  const foodRates = useMemo(() => {
    const venue = items.find(it => it.target_type === "venue");
    return {
      veg_rate: Number(venue?.veg_price) || 1200,
      non_veg_rate: Number(venue?.non_veg_price) || 1800,
    };
  }, [items]);

  const VEG_RATE = foodRates.veg_rate;
  const NON_VEG_RATE = foodRates.non_veg_rate;

  // Calculations
  const venueSubtotal = items.reduce((acc, it) => acc + (it.unit_price || 0) * (it.quantity || 1), 0);
  const vegTotal = veg_count * VEG_RATE;
  const nonVegTotal = non_veg_count * NON_VEG_RATE;
  const subtotal = venueSubtotal + vegTotal + nonVegTotal;

  useEffect(() => {
    if (subtotal > 0) {
      computePricing(subtotal).then(setPricing).catch(console.error);
    } else {
      setPricing(null);
    }
  }, [subtotal]);

  const total = pricing?.total || subtotal;
  const isDeposit = payment_type === "deposit";
  const dueNow = isDeposit ? Math.round(total * 0.2) : total;
  const remainingBalance = isDeposit ? total - dueNow : 0;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!event_date) return toast.error("Please select an event date");
    if (!contact_phone) return toast.error("Please enter contact phone");

    setBusy(true);
    try {
      const finalizedItems = items.map((it) => ({ ...it, cart_id: it.id }));

      // Cleaned object payload passing only exactly what type definition accepts
      const b = await createBooking({
        items: finalizedItems,
        event_date,
        guest_count: veg_count + non_veg_count,
        contact_phone,
        notes: notes || undefined,
        payment_method,
        payment_type: "deposit"
      });

      toast.success(`Booking request ${b.receipt_number} initialized!`);
      nav({ to: "/my-bookings" });
    } catch (err: any) {
      toast.error(err.message || "Failed to create booking");
    } finally {
      setBusy(false);
    }
  }

  if (!ready) return <div className="p-20 text-center">Loading...</div>;
  if (!user) return <div className="p-20 text-center">Please login to continue</div>;

  return (
    <div className="container" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <header style={{ marginBottom: 30 }}>
        <Link to="/" style={{ color: "var(--pink)" }}>&larr; Back to services</Link>
        <h1 style={{ marginTop: 10 }}>Checkout - Advance Booking</h1>
      </header>

      <form onSubmit={submit} style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 40, alignItems: "start" }}>
        <section style={{ display: "grid", gap: 24 }}>
          {/* Event Details */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Event Details</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Event Date</label>
                <input type="date" required className="form-control" value={event_date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Veg Guests</label>
                  <input type="number" min="0" className="form-control" value={veg_count} onChange={(e) => setVegCount(Math.max(0, parseInt(e.target.value) || 0))} />
                </div>
                <div>
                  <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Non-Veg Guests</label>
                  <input type="number" min="0" className="form-control" value={non_veg_count} onChange={(e) => setNonVegCount(Math.max(0, parseInt(e.target.value) || 0))} />
                </div>
              </div>
            </div>

            {items.some(it => it.target_type === "venue") && (
              <p style={{ marginTop: 12, fontSize: 13, color: "#666" }}>
                Food pricing based on venue: <strong>৳{VEG_RATE} Veg</strong> / <strong>৳{NON_VEG_RATE} Non-Veg</strong> per person
              </p>
            )}
          </div>

          {/* Contact & Notes */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Contact & Notes</h3>
            <div style={{ display: "grid", gap: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Phone Number</label>
                <input type="tel" required placeholder="01XXXXXXXXX" className="form-control" value={contact_phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Additional Notes</label>
                <textarea className="form-control" rows={3} placeholder="Any special requirements..." value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
              </div>
            </div>
          </div>

          {/* Payment */}
          <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: 24 }}>
            <h3 style={{ marginBottom: 20 }}>Payment Plan</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Method</label>
                <select className="form-control" value={payment_method} onChange={(e) => setMethod(e.target.value)}>
                  <option value="bkash">bKash</option>
                  <option value="nagad">Nagad</option>
                  <option value="rocket">Rocket</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label style={{ display: "block", marginBottom: 8, fontSize: 14, fontWeight: 600 }}>Booking Deposit</label>
                <select className="form-control" value={payment_type} onChange={(e) => setType(e.target.value as "deposit" | "full")}>
                  <option value="deposit">20% Advance Deposit</option>
                  <option value="full">Full Payment</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Order Summary */}
        <aside style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: 24, position: "sticky", top: 100 }}>
          <h3 style={{ marginBottom: 14 }}>Booking Summary</h3>

          <div style={{ display: "grid", gap: 12, marginBottom: 16 }}>
            {items.map((it) => (
              <div key={it.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{it.title} × {it.quantity}</span>
                <span>{fmtBDT(it.unit_price * it.quantity)}</span>
              </div>
            ))}

            {veg_count > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>Veg Catering (৳{VEG_RATE}/person) × {veg_count}</span>
                <span>{fmtBDT(vegTotal)}</span>
              </div>
            )}
            {non_veg_count > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>Non-Veg Catering (৳{NON_VEG_RATE}/person) × {non_veg_count}</span>
                <span>{fmtBDT(nonVegTotal)}</span>
              </div>
            )}
          </div>

          <hr style={{ margin: "14px 0", borderTop: "1px solid var(--border)" }} />

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span>Total Amount</span>
            <strong>{fmtBDT(total)}</strong>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16, fontSize: 18, fontWeight: "bold", color: "var(--pink)" }}>
            <span>Advance Deposit Due Now</span>
            <span>{fmtBDT(dueNow)}</span>
          </div>

          {isDeposit && remainingBalance > 0 && (
            <div style={{ color: "#b91c1c", marginBottom: 16 }}>
              Remaining Due: {fmtBDT(remainingBalance)} (Pay later)
            </div>
          )}

          <button 
            type="submit" 
            disabled={busy || !event_date || !contact_phone} 
            className="btn-primary" 
            style={{ width: "100%", padding: 14, borderRadius: 10 }}
          >
            {busy ? "Processing..." : `Pay Advance Deposit ${fmtBDT(dueNow)} Now`}
          </button>
        </aside>
      </form>
    </div>
  );
}