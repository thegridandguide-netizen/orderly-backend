import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadVenueById, loadSimilarVenues, addToCart, fmtBDT, submitEnquiry, type VenueCard } from "@/lib/data";
import { VenueCardView } from "@/components/cards";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/venue/$id")({ component: VenueDetail });

function VenueDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [v, setV] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState<VenueCard[]>([]);

  useEffect(() => {
    setLoading(true);
    loadVenueById(id).then((vv) => {
      setV(vv);
      if (vv) loadSimilarVenues({ city: vv.city ?? undefined, excludeId: vv.id, limit: 4 }).then(setSimilar);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container section-padding">Loading…</div>;
  if (!v) return <div className="container section-padding"><h2>Venue not found</h2><Link to="/venues">← Back</Link></div>;

  const gallery: string[] = (v.gallery_image_urls || []).filter(Boolean);
  const cover = v.cover_image_url || gallery[0];

  async function book() {
    if (!user) return toast.error("Please log in");
    try { await addToCart({ target_type: "venue", target_id: v.id }); toast.success("Added to cart"); }
    catch (e: any) { toast.error(e.message); }
  }
  async function enquire() {
    if (!user) return toast.error("Please log in");
    const m = prompt("Tell the host about your event:");
    if (!m) return;
    try { await submitEnquiry({ target_type: "venue", target_id: v.id, message: m }); toast.success("Enquiry sent!"); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="page active">
      <div className="container section-padding">
        <Link to="/venues" style={{ color: "var(--pink)", fontWeight: 600 }}>← Back to venues</Link>
        <h1 style={{ fontSize: 32, marginTop: 12 }}>{v.name}</h1>
        <p className="location" style={{ marginBottom: 20 }}><i className="fa-solid fa-location-dot" /> {[v.area, v.city].filter(Boolean).join(", ")}</p>
        {cover && <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16 }}><img src={cover} alt={v.name} style={{ width: "100%", maxHeight: 480, objectFit: "cover" }} /></div>}
        {gallery.length > 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 30 }}>
            {gallery.slice(0, 8).map((g, i) => <img key={i} src={g} alt="" style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 8 }} />)}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 28 }}>
          <div>
            <h2 className="section-title">About</h2>
            <p style={{ color: "#555", lineHeight: 1.7 }}>{v.description || "A premier event venue ready to host your celebration."}</p>
            {v.tags?.length > 0 && (<><h2 className="section-title" style={{ marginTop: 28 }}>Features</h2><div className="tags">{v.tags.map((t: string) => <span key={t}>{t}</span>)}</div></>)}
          </div>
          <aside style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: 24, position: "sticky", top: 100, alignSelf: "start" }}>
            {v.veg_price != null && <div style={{ marginBottom: 8 }}><strong>Veg:</strong> {fmtBDT(v.veg_price)}/person</div>}
            {v.non_veg_price != null && <div style={{ marginBottom: 8 }}><strong>Non-veg:</strong> {fmtBDT(v.non_veg_price)}/person</div>}
            {v.rental_price != null && <div style={{ marginBottom: 8 }}><strong>Rental:</strong> {fmtBDT(v.rental_price)}</div>}
            <button className="btn-primary" onClick={book} style={{ width: "100%", padding: 14, borderRadius: 10, marginTop: 12, marginBottom: 10 }}>Add to Cart</button>
            <button onClick={enquire} style={{ width: "100%", padding: 14, borderRadius: 10, border: "2px solid var(--pink)", color: "var(--pink)", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Send Enquiry</button>
          </aside>
        </div>
        {similar.length > 0 && (
          <section style={{ marginTop: 60 }}>
            <h2 className="section-title">Similar venues</h2>
            <div className="venue-grid">{similar.map((s) => <VenueCardView key={s.id} v={s} />)}</div>
          </section>
        )}
      </div>
    </div>
  );
}