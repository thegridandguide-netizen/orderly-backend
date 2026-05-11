import { useEffect, useState } from "react";
import { Link, useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { signOut, cartCount } from "@/lib/data";
import { AuthModal } from "./AuthModal";

const NAV = [
  { to: "/", label: "Home", icon: "fa-house", key: "home" },
  { to: "/venues", label: "Venues", icon: "fa-building", key: "venues" },
  { to: "/vendors", label: "Vendors", icon: "fa-store", key: "vendors" },
  { to: "/photos", label: "Photos", icon: "fa-images", key: "photos" },
  { to: "/explore", label: "Explore", icon: "fa-compass", key: "explore" },
] as const;

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  return pathname === to || pathname.startsWith(to + "/");
}

export function Layout({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [authOpen, setAuthOpen] = useState<false | "login" | "signup">(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (user) cartCount().then(setCount).catch(() => {}); else setCount(0);
  }, [user, pathname]);

  useEffect(() => { setDrawerOpen(false); }, [pathname]);

  return (
    <>
      <header className="navbar" id="main-nav">
        <div className="container nav-container">
          <div className="nav-left">
            <Link to="/" className="logo" style={{ textDecoration: "none" }}>𝐄𝐯𝐞𝐧𝐭𝐢𝐱</Link>
            <ul className="nav-menu" style={{ display: "flex" }}>
              {NAV.slice(1).map((n) => (
                <li key={n.key}>
                  <Link to={n.to} className={`nav-link ${isActive(pathname, n.to) ? "active" : ""}`}>
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="nav-right">
            <Link to="/cart" style={{ position: "relative", color: "#444", fontSize: 18 }}>
              <i className="fa-solid fa-cart-shopping" />
              {count > 0 && (
                <span style={{ position:"absolute", top:-8, right:-10, background:"var(--pink)", color:"#fff", borderRadius:10, fontSize:10, padding:"1px 6px", fontWeight:700 }}>{count}</span>
              )}
            </Link>
            {user ? (
              <>
                <Link to="/my-bookings" className="nav-link" style={{ padding: "0 10px", fontWeight: 500 }}>
                  <i className="fa-solid fa-calendar-check" /> Bookings
                </Link>
                <Link to="/profile" className="nav-link" title="My Profile" style={{ padding: "0 10px", fontWeight: 500 }}>
                  <i className="fa-solid fa-user-circle" /> Profile
                </Link>
                <button className="btn-primary" onClick={() => signOut().then(() => location.reload())} style={{ background:"#444" }}>
                  Log Out
                </button>
              </>
            ) : (
              <button className="btn-primary" onClick={() => setAuthOpen("login")}>Log In</button>
            )}
            <button className={`hamburger ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen((v) => !v)} aria-label="Menu">
              <span /><span /><span />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <div className={`mobile-drawer ${drawerOpen ? "open" : ""}`}>
        <div className="mobile-drawer-panel">
          <div className="drawer-header">
            <div className="drawer-logo">𝐄𝐯𝐞𝐧𝐭𝐢𝐱</div>
            <div className="drawer-tagline">Crafting Incredible Events</div>
          </div>
          <nav className="drawer-nav">
            {NAV.map((n) => (
              <Link key={n.key} to={n.to} className={`drawer-nav-item ${isActive(pathname, n.to) ? "active" : ""}`}>
                <i className={`fa-solid ${n.icon}`} /> {n.label}
              </Link>
            ))}
            <Link to="/cart" className="drawer-nav-item">
              <i className="fa-solid fa-cart-shopping" /> Cart {count > 0 ? `(${count})` : ""}
            </Link>
            {user && (
              <>
                <Link to="/my-bookings" className="drawer-nav-item">
                  <i className="fa-solid fa-calendar-check" /> My Bookings
                </Link>
                <Link to="/profile" className="drawer-nav-item">
                  <i className="fa-solid fa-user-circle" /> My Profile
                </Link>
              </>
            )}
          </nav>
          <div className="drawer-actions">
            {user ? (
              <button className="btn-primary" onClick={() => signOut().then(() => location.reload())} style={{ width: "100%", borderRadius: 10, padding: 13 }}>Log Out</button>
            ) : (
              <button className="btn-primary" onClick={() => { setDrawerOpen(false); setAuthOpen("login"); }} style={{ width: "100%", borderRadius: 10, padding: 13 }}>Log In</button>
            )}
          </div>
        </div>
        <div className="mobile-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      </div>

      {children}

      {/* Bottom nav (mobile) */}
      <nav className="bottom-nav">
        {NAV.map((n) => (
          <Link key={n.key} to={n.to} className={`bn-item ${isActive(pathname, n.to) ? "active" : ""}`}>
            <i className={`fa-solid ${n.icon}`} /><span>{n.label}</span>
          </Link>
        ))}
      </nav>

      <AuthModal
        open={!!authOpen}
        mode={authOpen || "login"}
        onClose={() => setAuthOpen(false)}
        onSwitch={(m) => setAuthOpen(m)}
      />
    </>
  );
}