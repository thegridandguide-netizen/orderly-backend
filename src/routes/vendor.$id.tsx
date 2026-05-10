import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadVendorById, loadSimilarVendors, addToCart, submitEnquiry, fmtBDT } from "@/lib/data";
import { VendorCardView } from "@/components/cards";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export const Route = createFileRoute("/vendor/$id")({ component: VendorDetail });

function VendorDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const [v, setV] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [similar, setSimilar] = useState<any[]>([]);
  useEffect(() => {
    setLoading(true);
    loadVendorById(id).then((vv: any) => { setV(vv); if (vv) loadSimilarVendors({ city: vv.city ?? undefined, category: vv.category ?? undefined, excludeId: vv.id, limit: 4 }).then(setSimilar); }).finally(() => setLoading(false));
  }, [id]);
  if (loading) return <div className="container section-padding">Loading…</div>;
  if (!v) return <div className="container section-padding"><h2>Vendor not found</h2><Link to="/vendors">← Back</Link></div>;
  const gallery: string[] = (v.gallery_image_urls || []).filter(Boolean);
  const cover = v.cover_image_url || gallery[0];
  async function book() { if (!user) return toast.error("Please log in"); try { await addToCart({ target_type: "vendor", target_id: v.id }); toast.success("Added to cart"); } catch (e: any) { toast.error(e.message); } }
  async function enquire() { if (!user) return toast.error("Please log in"); const m = prompt("Tell the vendor about your event:"); if (!m) return; try { await submitEnquiry({ target_type: "vendor", target_id: v.id, message: m }); toast.success("Enquiry sent!"); } catch (e: any) { toast.error(e.message); } }
  return (
    <div className="page active">
      <div className="container section-padding">
        <Link to="/vendors" style={{ color: "var(--pink)", fontWeight: 600 }}>← Back to vendors</Link>
        <span className="category-tag" style={{ display: "block", marginTop: 12 }}>{v.category}</span>
        <h1 style={{ fontSize: 32 }}>{v.title}</h1>
        <p className="location" style={{ marginBottom: 20 }}><i className="fa-solid fa-location-dot" /> {v.city}</p>
        {cover && <div style={{ borderRadius: 14, overflow: "hidden", marginBottom: 16 }}><img src={cover} alt={v.title} style={{ width: "100%", maxHeight: 480, objectFit: "cover" }} /></div>}
        {gallery.length > 1 && <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 12, marginBottom: 30 }}>{gallery.slice(0, 8).map((g, i) => <img key={i} src={g} alt="" style={{ width: "100%", height: 130, objectFit: "cover", borderRadius: 8 }} />)}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 28 }}>
          <div>
            <h2 className="section-title">About</h2>
            <p style={{ color: "#555", lineHeight: 1.7 }}>{v.description || "Talented professional ready to make your event memorable."}</p>
          </div>
          <aside style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 14, padding: 24, position: "sticky", top: 100, alignSelf: "start" }}>
            <div style={{ marginBottom: 16 }}><strong style={{ color: "var(--pink)" }}>{v.price_from != null ? `${fmtBDT(v.price_from)}+` : "Contact for price"}</strong></div>
            <button className="btn-primary" onClick={book} style={{ width: "100%", padding: 14, borderRadius: 10, marginBottom: 10 }}>Add to Cart</button>
            <button onClick={enquire} style={{ width: "100%", padding: 14, borderRadius: 10, border: "2px solid var(--pink)", color: "var(--pink)", background: "#fff", fontWeight: 700, cursor: "pointer" }}>Send Enquiry</button>
          </aside>
        </div>
        {similar.length > 0 && (<section style={{ marginTop: 60 }}><h2 className="section-title">Similar vendors</h2><div className="vendor-grid-main">{similar.map((s) => <VendorCardView key={s.id} v={s} />)}</div></section>)}
      </div>
    </div>
  );
}