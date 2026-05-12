import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadEventCategories } from "@/lib/data";

export const Route = createFileRoute("/explore")({
  component: ExplorePage,
  head: () => ({
    meta: [
      { title: "Explore – Eventix" },
      { name: "description", content: "Explore venues, vendors, photo inspiration and event categories." },
    ],
  }),
});

function ExplorePage() {
  const [cats, setCats] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const nav = useNavigate();

  useEffect(() => { loadEventCategories().then(setCats).catch(() => setCats([])); }, []);

  function search() {
    if (q) sessionStorage.setItem("eventix_search", q);
    nav({ to: "/venues" });
  }

  const hubs = [
    { to: "/venues", icon: "fa-building", title: "Venues", desc: "Banquet halls, resorts, marriage gardens" },
    { to: "/vendors", icon: "fa-store", title: "Vendors", desc: "Photographers, makeup, caterers, decorators" },
    { to: "/photos", icon: "fa-images", title: "Photo Inspiration", desc: "Browse real event photo galleries" },
  ];

  return (
    <div className="page active">
      <section className="container section-padding">
        <h1 className="section-title">Explore Eventix</h1>
        <p className="section-sub">Find every piece of your event in one place</p>

        <div style={{ display: "flex", gap: 8, maxWidth: 600, margin: "20px auto 32px", background: "#fff", padding: 8, borderRadius: 12, boxShadow: "0 4px 14px rgba(0,0,0,0.06)" }}>
          <input
            type="text"
            placeholder="Search venues, vendors, ideas…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            style={{ flex: 1, border: "none", padding: "10px 14px", fontSize: 14, outline: "none" }}
          />
          <button className="btn-primary" onClick={search}>Search</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18, marginBottom: 50 }}>
          {hubs.map((h) => (
            <Link key={h.to} to={h.to} style={{ textDecoration: "none", color: "inherit" }}>
              <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 14, padding: 24, transition: "transform .15s, box-shadow .15s" }}
                   onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, { transform: "translateY(-2px)", boxShadow: "0 8px 20px rgba(0,0,0,0.08)" })}
                   onMouseLeave={(e) => Object.assign((e.currentTarget as HTMLElement).style, { transform: "none", boxShadow: "none" })}>
                <div style={{ width: 48, height: 48, background: "var(--pink, #ec4899)", color: "#fff", borderRadius: 12, display: "grid", placeItems: "center", marginBottom: 14 }}>
                  <i className={`fa-solid ${h.icon}`} style={{ fontSize: 22 }} />
                </div>
                <h3 style={{ margin: "0 0 6px", fontSize: 18 }}>{h.title}</h3>
                <p style={{ margin: 0, color: "#666", fontSize: 14 }}>{h.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        <h2 className="section-title" style={{ fontSize: 22 }}>Event Categories</h2>
        <p className="section-sub">Pick the type of event you're planning</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginTop: 18 }}>
          {cats.length === 0
            ? <p style={{ color: "#888" }}>No categories yet.</p>
            : cats.map((c) => (
                <Link key={c.id} to="/venues" style={{ textDecoration: "none", color: "inherit" }}>
                  <div style={{ background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 12, padding: 18, textAlign: "center" }}>
                    <i className={`fa-solid ${c.icon || "fa-calendar"}`} style={{ fontSize: 24, color: "var(--pink, #ec4899)", marginBottom: 8 }} />
                    <div style={{ fontWeight: 600 }}>{c.title}</div>
                  </div>
                </Link>
              ))}
        </div>
      </section>
    </div>
  );
}
