import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { listCart, updateCartQty, removeFromCart, fmtBDT, type CartItem } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const { user, ready } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setItems(await listCart());
    setLoading(false);
  }
  useEffect(() => { if (ready) refresh(); }, [ready, user]);

  if (!ready || loading) return <div className="container section-padding">Loading…</div>;
  if (!user) return <div className="container section-padding"><h2>Please log in to view your cart</h2></div>;
  if (!items.length) return (
    <div className="container section-padding" style={{ textAlign: "center" }}>
      <h2>Your cart is empty</h2>
      <p style={{ marginTop: 8 }}><Link to="/venues" style={{ color: "var(--pink)" }}>Browse venues →</Link></p>
    </div>
  );

  const subtotal = items.reduce((s, it) => s + it.unit_price * it.quantity, 0);

  return (
    <div className="page active"><div className="container section-padding">
      <h1 className="section-title">Your Cart</h1>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 28, marginTop: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((it) => (
            <div key={it.id} style={{ display: "flex", gap: 14, background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 14 }}>
              {it.image && <img src={it.image} alt="" style={{ width: 110, height: 90, objectFit: "cover", borderRadius: 8 }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{it.title}</div>
                <div style={{ fontSize: 13, color: "#666" }}>{it.subtitle}</div>
                <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <button onClick={async () => { await updateCartQty(it.id, it.quantity - 1); refresh(); }} style={qBtn}>−</button>
                  <span>{it.quantity}</span>
                  <button onClick={async () => { await updateCartQty(it.id, it.quantity + 1); refresh(); }} style={qBtn}>+</button>
                  <button onClick={async () => { await removeFromCart(it.id); refresh(); }} style={{ marginLeft: "auto", color: "#b91c1c", border: 0, background: "transparent", cursor: "pointer" }}>Remove</button>
                </div>
              </div>
              <div style={{ textAlign: "right", fontWeight: 600 }}>{fmtBDT(it.unit_price * it.quantity)}</div>
            </div>
          ))}
        </div>
        <aside style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: 24, position: "sticky", top: 100, alignSelf: "start", height: "fit-content" }}>
          <h3 style={{ marginBottom: 14 }}>Summary</h3>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><span>Subtotal</span><strong>{fmtBDT(subtotal)}</strong></div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 16 }}>Taxes &amp; fees calculated at checkout.</div>
          <Link to="/checkout" className="btn-primary" style={{ display: "block", textAlign: "center", padding: 14, borderRadius: 10, textDecoration: "none" }}>Proceed to Checkout</Link>
        </aside>
      </div>
    </div></div>
  );
}

const qBtn: React.CSSProperties = { width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)", background: "#fff", cursor: "pointer" };
