import { Link, Outlet, useLocation, useNavigate, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/data";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/admin")({ component: AdminLayout });

const NAV = [
  { to: "/admin", label: "Dashboard", icon: "fa-gauge", exact: true },
  { to: "/admin/venues", label: "Venues", icon: "fa-building" },
  { to: "/admin/listings", label: "Vendor Listings", icon: "fa-store" },
  { to: "/admin/vendors", label: "Vendor Profiles", icon: "fa-user-tie" },
  { to: "/admin/albums", label: "Albums", icon: "fa-images" },
  { to: "/admin/photos", label: "Photos", icon: "fa-image" },
  { to: "/admin/categories", label: "Categories", icon: "fa-tags" },
  { to: "/admin/pricing", label: "Pricing Rules", icon: "fa-percent" },
  { to: "/admin/bookings", label: "Bookings", icon: "fa-calendar-check" },
  { to: "/admin/transactions", label: "Transactions", icon: "fa-receipt" },
  { to: "/admin/users", label: "Users & Roles", icon: "fa-users" },
];

function AdminLayout() {
  const { user, ready } = useAuth();
  const nav = useNavigate();
  const { pathname } = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!user) { setAllowed(false); return; }
    isAdmin().then(setAllowed);
  }, [ready, user]);

  if (!ready || allowed === null) return <div className="container section-padding">Loading…</div>;
  if (!user || !allowed) return (
    <div className="container section-padding" style={{ textAlign: "center" }}>
      <h2>Admin access required</h2>
      <p style={{ marginTop: 8, color: "#666" }}>Sign in with an admin account.</p>
      <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => nav({ to: "/" })}>Go home</button>
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "calc(100vh - 70px)", background: "#f9fafb" }}>
      <aside style={{ width: 240, background: "#fff", borderRight: "1px solid var(--border)", padding: "20px 0" }}>
        <div style={{ padding: "0 20px 16px", fontWeight: 700, fontSize: 14, color: "#b91c1c" }}>ADMIN PANEL</div>
        {NAV.map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
              color: active ? "var(--pink)" : "#444", textDecoration: "none",
              background: active ? "#fef2f2" : "transparent", fontSize: 14, fontWeight: active ? 600 : 400,
              borderLeft: active ? "3px solid var(--pink)" : "3px solid transparent",
            }}>
              <i className={`fa-solid ${n.icon}`} style={{ width: 16 }} /> {n.label}
            </Link>
          );
        })}
      </aside>
      <main style={{ flex: 1, padding: 30, overflow: "auto" }}>
        <Outlet />
      </main>
    </div>
  );
}
