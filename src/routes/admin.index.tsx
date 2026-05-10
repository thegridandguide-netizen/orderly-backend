import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminStats, adminList, fmtBDT } from "@/lib/data";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const [s, setS] = useState<any>(null);
  const [recent, setRecent] = useState<any[]>([]);
  useEffect(() => {
    adminStats().then(setS);
    adminList("bookings", { limit: 8 }).then(setRecent);
  }, []);
  if (!s) return <div>Loading…</div>;
  const cards = [
    { label: "Venues", value: s.venues, icon: "fa-building", color: "#3b82f6" },
    { label: "Vendor Listings", value: s.vendor_listings, icon: "fa-store", color: "#8b5cf6" },
    { label: "Bookings", value: s.bookings, icon: "fa-calendar-check", color: "#10b981" },
    { label: "Customers", value: s.profiles, icon: "fa-users", color: "#f59e0b" },
    { label: "Revenue", value: fmtBDT(s.revenue), icon: "fa-sack-dollar", color: "#ec4899" },
  ];
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 30 }}>
        {cards.map((c) => (
          <div key={c.label} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
            <i className={`fa-solid ${c.icon}`} style={{ color: c.color, fontSize: 22 }} />
            <div style={{ fontSize: 12, color: "#888", marginTop: 8 }}>{c.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{c.value}</div>
          </div>
        ))}
      </div>
      <h2 style={{ fontSize: 18 }}>Recent Bookings</h2>
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr><th style={th}>Receipt</th><th style={th}>Status</th><th style={th}>Total</th><th style={th}>Date</th></tr>
          </thead>
          <tbody>
            {recent.map((b) => (
              <tr key={b.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={td}>{b.receipt_number}</td>
                <td style={td}>{b.status}</td>
                <td style={td}>{fmtBDT(b.total_amount)}</td>
                <td style={td}>{new Date(b.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: 12 };
const td: React.CSSProperties = { padding: "10px 12px" };
