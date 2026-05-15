import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadVenues, type VenueCard } from "@/lib/data";
import { VenueCardView } from "@/components/cards";
import { CITIES, VENUE_TYPES } from "@/lib/filters";

export const Route = createFileRoute("/venues")({
  component: VenuesPage,
  head: () => ({
    meta: [
      { title: "Venues – Eventix" },
      { name: "description", content: "Discover banquet halls, marriage gardens, resorts, and more across Bangladesh." },
    ],
  }),
});

// Filter chips reuse the SAME constants the admin form stores into the DB
// (see src/lib/filters.ts). This keeps stored values aligned with what users
// can filter by — change the source of truth in one place.
const TYPES_WITH_ALL = [{ value: "", label: "All" }, ...VENUE_TYPES];
const CITIES_WITH_ALL = ["", ...CITIES];

function VenuesPage() {
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("recommended");
  const [items, setItems] = useState<VenueCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setLoading(true); setPage(0); setDone(false);
    loadVenues({ city: city || undefined, area: area || undefined, venueType: type || undefined, sort, limit: 12, offset: 0 })
      .then((rs) => { setItems(rs); setDone(rs.length < 12); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [city, area, type, sort]);

  async function loadMore() {
    const next = page + 1;
    const rs = await loadVenues({ city: city || undefined, area: area || undefined, venueType: type || undefined, sort, limit: 12, offset: next * 12 });
    setItems((prev) => [...prev, ...rs]); setPage(next);
    if (rs.length < 12) setDone(true);
  }

  return (
    <div className="page active">
      <div className="filter-bar">
        <div className="container filter-container">
          {TYPES_WITH_ALL.map((t) => (
            <div key={t.value || "all"} className={`filter-item ${type === t.value ? "active" : ""}`} onClick={() => setType(t.value)}>
              {t.label}
            </div>
          ))}
        </div>
      </div>

      <div className="container city-selection">
        <div className="city-circle-wrapper">
          {CITIES_WITH_ALL.map((c) => (
            <div key={c || "all"} className="city-item" onClick={() => setCity(c)}>
              <div className="circle-placeholder" style={{ borderColor: city === c ? "var(--pink)" : "transparent" }}>{(c || "All").slice(0, 3)}</div>
              <span>{c || "All"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        <div className="vendor-results-header" style={{ flexWrap: "wrap", gap: 10 }}>
          <div className="results-count">{items.length} venues {city && `in ${city}`}{area && ` · ${area}`}</div>
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Area (e.g. Gulshan, Banani)"
              className="sort-select"
              style={{ minWidth: 200 }}
            />
            <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="recommended">Recommended</option>
              <option value="rating">Top rated</option>
              <option value="price_low">Price: low to high</option>
              <option value="price_high">Price: high to low</option>
              <option value="capacity">Largest capacity</option>
            </select>
          </div>
        </div>

        <div className="venue-grid">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="venue-card" style={{ height: 380, background: "#f3f3f3" }} />)
            : items.length === 0
              ? <p style={{ color: "#888", padding: 40 }}>No venues found. Try changing filters.</p>
              : items.map((v) => <VenueCardView key={v.id} v={v} />)}
        </div>

        {!loading && !done && items.length > 0 && (
          <div className="load-more-wrap">
            <button className="load-more-btn" onClick={loadMore}>Load More</button>
          </div>
        )}
      </div>
    </div>
  );
}
