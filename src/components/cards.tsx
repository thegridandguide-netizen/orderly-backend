import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { listWishlist, toggleWishlist, type VenueCard } from "@/lib/data";
import { toast } from "sonner";

let cachedKeys: Set<string> | null = null;
const subscribers = new Set<(s: Set<string>) => void>();

export function useWishlist() {
  const { user } = useAuth();
  const [keys, setKeys] = useState<Set<string>>(cachedKeys || new Set());
  useEffect(() => {
    const sub = (s: Set<string>) => setKeys(new Set(s));
    subscribers.add(sub);
    if (user) {
      listWishlist().then((items) => {
        cachedKeys = new Set(items.map((i: any) => `${i.target_type}:${i.target_id}`));
        subscribers.forEach((s) => s(cachedKeys!));
      }).catch(() => {});
    } else {
      cachedKeys = new Set();
      subscribers.forEach((s) => s(cachedKeys!));
    }
    return () => { subscribers.delete(sub); };
  }, [user]);

  async function toggle(type: string, id: string) {
    if (!user) { toast.error("Please log in to save to wishlist"); return; }
    try {
      const liked = await toggleWishlist(type, id);
      const key = `${type}:${id}`;
      cachedKeys = new Set(cachedKeys || []);
      if (liked) cachedKeys.add(key); else cachedKeys.delete(key);
      subscribers.forEach((s) => s(cachedKeys!));
    } catch (e: any) { toast.error(e.message || "Could not update wishlist"); }
  }

  return { keys, toggle };
}

function WishlistBtn({ type, id, className = "wishlist-venue" }: { type: string; id: string; className?: string }) {
  const { keys, toggle } = useWishlist();
  const liked = keys.has(`${type}:${id}`);
  return (
    <button
      className={className}
      style={{ color: liked ? "var(--pink)" : "#bbb" }}
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(type, id); }}
      aria-label="Toggle wishlist"
    >
      <i className={`${liked ? "fa-solid" : "fa-regular"} fa-heart`} />
    </button>
  );
}

export function VenueCardView({ v }: { v: VenueCard }) {
  return (
    <Link to="/venue/$id" params={{ id: v.id }} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="venue-card">
        <div className="card-img">
          {v.img && <img src={v.img} alt={v.name} loading="lazy" />}
          {v.handpicked && <span className="handpicked-tag"><i className="fa-solid fa-crown" /> Handpicked</span>}
          <WishlistBtn type="venue" id={v.id} />
        </div>
        <div className="card-body">
          <div className="card-title-row">
            <h3>{v.name}</h3>
            <span className="rating"><i className="fa-solid fa-star" /> {v.rating}</span>
          </div>
          <p className="location"><i className="fa-solid fa-location-dot" /> {v.location}</p>
          {v.tags.length > 0 && (
            <div className="tags">{v.tags.map((t) => <span key={t}>{t}</span>)}</div>
          )}
          {v.pricing.length > 0 && (
            <div className="pricing">
              {v.pricing.map((p) => (
                <div className="price-item" key={p.label}>
                  <span className="label">{p.label}</span>
                  <span className="value">{p.value}{p.unit && <small> /{p.unit}</small>}</span>
                </div>
              ))}
            </div>
          )}
          {(v.capacityPax || v.rooms) && (
            <div className="capacity">
              {v.capacityPax && <span><i className="fa-solid fa-users" /> {v.capacityPax}</span>}
              {v.rooms && <span><i className="fa-solid fa-bed" /> {v.rooms}</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function VendorCardView({ v }: { v: any }) {
  return (
    <Link to="/vendor/$id" params={{ id: v.id }} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="vendor-card">
        <div className="card-img-container">
          {v.cover_image_url && <img src={v.cover_image_url} alt={v.title} loading="lazy" />}
          <WishlistBtn type="vendor" id={v.id} className="wishlist-btn" />
        </div>
        <div className="vendor-info">
          <span className="category-tag">{v.category}</span>
          <h3>{v.title}</h3>
          {v.badge && <span className="vendor-badge">{v.badge}</span>}
          <div className="vendor-stats">
            <div className="vendor-rating"><i className="fa-solid fa-star" /> {(v.rating_avg ?? 0).toFixed(1)} <span style={{ color:"#999", fontWeight:400 }}>({v.rating_count ?? 0})</span></div>
            <div className="price-tag">
              {v.price_from != null ? `৳ ${Number(v.price_from).toLocaleString("en-IN")}+` : "—"}
            </div>
          </div>
          <p className="location" style={{ marginTop: 8 }}><i className="fa-solid fa-location-dot" /> {v.city}</p>
        </div>
      </div>
    </Link>
  );
}