import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadVendors } from "@/lib/data";
import { VendorCardView } from "@/components/cards";
import { CITIES, VENDOR_CATEGORIES } from "@/lib/filters";

export const Route = createFileRoute("/vendors")({
  component: VendorsPage,
  head: () => ({
    meta: [
      { title: "Vendors – Eventix" },
      { name: "description", content: "Photographers, makeup artists, decorators, caterers and more across Bangladesh." },
    ],
  }),
});

function VendorsPage() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("recommended");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    loadVendors({ city: city || undefined, category: category || undefined, sort, limit: 24 })
      .then((rs) => setItems(rs))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [city, category, sort]);

  return (
    <div className="page active">
      <div className="filter-bar">
        <div className="container filter-container">
          <div className={`filter-item ${category === "" ? "active" : ""}`} onClick={() => setCategory("")}>All</div>
          {VENDOR_CATEGORIES.map((c) => (
            <div key={c.value}
                 className={`filter-item ${category === c.value ? "active" : ""}`}
                 onClick={() => setCategory(c.value)}>
              {c.label}
            </div>
          ))}
        </div>
      </div>

      <section className="container section-padding">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 24 }}>
          <select value={city} onChange={(e) => setCity(e.target.value)} style={dd}>
            <option value="">All cities</option>
            {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} style={dd}>
            <option value="recommended">Recommended</option>
            <option value="rating">Top rated</option>
            <option value="price_low">Price: low to high</option>
            <option value="price_high">Price: high to low</option>
          </select>
          <div style={{ marginLeft: "auto", color: "#666", fontSize: 13 }}>{items.length} results</div>
        </div>

        {loading ? (
          <div className="vendor-grid">
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="vendor-card" style={{ height: 320, background: "#f3f3f3" }} />)}
          </div>
        ) : items.length ? (
          <div className="vendor-grid">
            {items.map((v) => <VendorCardView key={v.id} v={v} />)}
          </div>
        ) : (
          <p style={{ textAlign: "center", color: "#666", padding: "40px 0" }}>No vendors found. Try changing filters.</p>
        )}
      </section>
    </div>
  );
}

const dd: React.CSSProperties = { padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14, background: "#fff" };
