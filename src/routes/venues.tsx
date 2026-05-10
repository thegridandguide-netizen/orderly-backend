import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadVenues, type VenueCard } from "@/lib/data";
import { VenueCardView } from "@/components/cards";

export const Route = createFileRoute("/venues")({
  component: VenuesPage,
  head: () => ({
    meta: [
      { title: "Venues – Eventix" },
      { name: "description", content: "Discover banquet halls, marriage gardens, resorts, and more across Bangladesh." },
    ],
  }),
});

const CITIES = ["", "Dhaka", "Chittagong", "Sylhet", "Khulna", "Rajshahi", "Cox's Bazar", "Rangpur", "Barishal"];
const TYPES = [
  { v: "", l: "All" },
  { v: "banquet_hall", l: "Banquet Halls" },
  { v: "marriage_garden", l: "Marriage Garden" },
  { v: "resort", l: "Resorts" },
  { v: "party_hall", l: "Party Halls" },
  { v: "destination", l: "Destination" },
  { v: "hotel", l: "4★+ Hotels" },
];

function VenuesPage() {
  const [city, setCity] = useState("");
  const [type, setType] = useState("");
  const [sort, setSort] = useState("recommended");
  const [items, setItems] = useState<VenueCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setLoading(true); setPage(0); setDone(false);
    loadVenues({ city: city || undefined, venueType: type || undefined, sort, limit: 12, offset: 0 })
      .then((rs) => { setItems(rs); setDone(rs.length < 12); })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [city, type, sort]);

  async function loadMore() {
    const next = page + 1;
    const rs = await loadVenues({ city: city || undefined, venueType: type || undefined, sort, limit: 12, offset: next * 12 });
    setItems((prev) => [...prev, ...rs]); setPage(next);
    if (rs.length < 12) setDone(true);
  }

  return (
    <div className="page active">
      <div className="filter-bar">
        <div className="container filter-container">
          {TYPES.map((t) => (
            <div key={t.v} className={`filter-item ${type === t.v ? "active" : ""}`} onClick={() => setType(t.v)}>
              {t.l}
            </div>
          ))}
        </div>
      </div>

      <div className="container city-selection">
        <div className="city-circle-wrapper">
          {CITIES.map((c) => (
            <div key={c || "all"} className="city-item" onClick={() => setCity(c)}>
              <div className="circle-placeholder" style={{ borderColor: city === c ? "var(--pink)" : "transparent" }}>{(c || "All").slice(0, 3)}</div>
              <span>{c || "All"}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="container">
        <div className="vendor-results-header">
          <div className="results-count">{items.length} venues {city && `in ${city}`}</div>
          <select className="sort-select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recommended">Recommended</option>
            <option value="rating">Top rated</option>
            <option value="price_low">Price: low to high</option>
            <option value="price_high">Price: high to low</option>
            <option value="capacity">Largest capacity</option>
          </select>
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