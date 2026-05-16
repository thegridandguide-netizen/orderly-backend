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
  const [activeTab, setActiveTab] = useState<"wedding" | "corporate" | "birthday">("wedding");
  
  // Interactive full-screen image light-box state tracking parameters
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const sectionLabels = ["Main Hall", "Stage", "Dining Area", "Decoration Setup", "Lighting", "Parking", "Entrance", "Washrooms", "Outdoor Area"];

  useEffect(() => {
    setLoading(true);
    loadVenueById(id).then((vv) => {
      setV(vv);
      if (vv) loadSimilarVenues({ city: vv.city ?? undefined, excludeId: vv.id, limit: 4 }).then(setSimilar);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container section-padding" style={{ padding: "40px 20px", color: "#64748b" }}>Loading dynamic venue configuration dataset…</div>;
  if (!v) return <div className="container section-padding" style={{ padding: 40 }}><h2>Venue profiles not discovered</h2><Link to="/venues">← Back to listings directory</Link></div>;

  const currentGalleryUrls = Array.isArray(v.gallery_image_urls) ? v.gallery_image_urls : [];
  const currentGalleryLayouts = Array.isArray(v.gallery_layouts) ? v.gallery_layouts : [];

  async function book() {
    try {
      // FIX: Passing a single unified target configuration object matching data.ts definitions
      await addToCart({
        target_type: "venue",
        target_id: v.id,
        price: v.rental_price ? Number(v.rental_price) : 50000
      });
      toast.success("Venue successfully configured and appended into your checkout cart!");
    } catch (err: any) {
      toast.error(err.message || "Failed appending item to checkout database pools");
    }
  }

  async function enquire() {
    const msg = prompt("Enter specific request queries or customization questions for this vendor:");
    if (!msg) return;
    try {
      // FIX: Passing a single unified argument object container matching data.ts definitions
      await submitEnquiry({
        target_type: "venue",
        target_id: v.id,
        message: msg
      });
      toast.success("Enquiry message safely dispatched to the platform operations department.");
    } catch (err: any) {
      toast.error(err.message || "Could not route custom request enquiry profile logs");
    }
  }

  return (
    <div className="container section-padding" style={{ padding: "24px 20px", maxWidth: 1200, margin: "0 auto", fontFamily: "system-ui, sans-serif" }}>
      
      {/* Dynamic Header Path Navigation */}
      <div style={{ marginBottom: 16, fontSize: 13, color: "#64748b" }}>
        <Link to="/" style={{ color: "inherit", textDecoration: "none" }}>Home</Link> /{" "}
        <Link to="/venues" style={{ color: "inherit", textDecoration: "none" }}>Venues</Link> /{" "}
        <span style={{ color: "#0f172a", fontWeight: 500 }}>{v.name}</span>
      </div>

      {/* Main Feature Coverage Block */}
      <div style={{ position: "relative", width: "100%", height: 380, borderRadius: 16, overflow: "hidden", marginBottom: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", cursor: "pointer" }} onClick={() => setLightboxImg(v.cover_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552")}>
        <img src={v.cover_image_url || "https://images.unsplash.com/photo-1519741497674-611481863552"} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 50%)" }} />
        <div style={{ position: "absolute", bottom: 24, left: 24, color: "#fff" }}>
          <span style={{ background: "var(--pink, #E72E77)", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>{v.venue_type || "Premium Venue"}</span>
          <h1 style={{ margin: "12px 0 6px 0", fontSize: 32, fontWeight: 800, letterSpacing: "-0.02em" }}>{v.name}</h1>
          <p style={{ margin: 0, fontSize: 14, opacity: 0.9, display: "flex", alignItems: "center", gap: 6 }}>
            <i className="fa-solid fa-location-dot" /> {v.address ? `${v.address}, ` : ""}{v.area || "Primary Zone"}, {v.city || "Dhaka"}
          </p>
        </div>
      </div>

      {/* Grid Layout Framework */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 32, alignItems: "start" }}>
        
        {/* Left Information Section */}
        <main>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <h2 style={{ margin: "0 0 12px 0", fontSize: 20, fontWeight: 700, color: "#0f172a" }}>About Venue</h2>
            <p style={{ margin: 0, fontSize: 15, color: "#334155", lineHeight: "1.6", whiteSpace: "pre-line" }}>{v.description || "No public structural overview statement has been filled inside this registration module yet."}</p>
          </div>

          {/* INTERACTIVE MULTI-LAYOUT PHOTO GALLERY VIEW SECTION */}
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a" }}>Interior & Structural Layouts</h2>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 500, background: "#f1f5f9", padding: "4px 10px", borderRadius: 20 }}>Click pictures to view full screen</span>
            </div>

            {/* Folder Layout Mode Button Row */}
            <div style={{ display: "flex", gap: 8, background: "#f1f5f9", padding: 4, borderRadius: 10, marginBottom: 20 }}>
              {(["wedding", "corporate", "birthday"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    padding: "10px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    textTransform: "capitalize",
                    background: activeTab === tab ? "var(--pink, #E72E77)" : "transparent",
                    color: activeTab === tab ? "#fff" : "#475569",
                    transition: "all 0.2s ease",
                    boxShadow: activeTab === tab ? "0 4px 10px rgba(231,46,119,0.2)" : "none"
                  }}
                >
                  {tab} Arrangement
                </button>
              ))}
            </div>

            {/* Photo Thumbnail Gallery Matrix */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 }}>
              {currentGalleryUrls.map((imgUrl: string, idx: number) => {
                // Match configuration metadata row structures
                const assignedLayoutType = currentGalleryLayouts[idx]?.type || "wedding";
                if (assignedLayoutType !== activeTab) return null;

                const specificContextLabel = sectionLabels[idx % sectionLabels.length];

                return (
                  <div
                    key={idx}
                    onClick={() => setLightboxImg(imgUrl)}
                    className="clickable-gallery-card"
                    style={{
                      position: "relative",
                      borderRadius: 10,
                      overflow: "hidden",
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      cursor: "pointer",
                      transition: "transform 0.2s ease, box-shadow 0.2s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-4px)";
                      e.currentTarget.style.boxShadow = "0 8px 16px rgba(0,0,0,0.06)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "none";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <div style={{ width: "100%", height: 110, position: "relative", overflow: "hidden" }}>
                      <img src={imgUrl} alt={specificContextLabel} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,0.02)" }} />
                    </div>
                    <div style={{ padding: "10px 12px" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{specificContextLabel}</div>
                      <div style={{ fontSize: 11, color: "var(--pink, #E72E77)", fontWeight: 600, marginTop: 2, textTransform: "capitalize" }}>{activeTab} Area</div>
                    </div>
                  </div>
                );
              })}
              
              {/* FIX: Typed variables implicitly inside the layout array checker function block */}
              {currentGalleryUrls.filter((_: string, i: number) => (currentGalleryLayouts[i]?.type || "wedding") === activeTab).length === 0 && (
                <div style={{ gridColumn: "1 / -1", padding: "40px 16px", textAlign: "center", border: "2px dashed #e2e8f0", borderRadius: 10, color: "#64748b" }}>
                  <i className="fa-regular fa-image" style={{ fontSize: 24, marginBottom: 8, display: "block", color: "#cbd5e1" }} />
                  No layout photographs uploaded for the <strong style={{ textTransform: "lowercase" }}>{activeTab}</strong> configuration variant yet.
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Right Pricing Pricing Calculation Action Box */}
        <aside style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.02)", position: "sticky", top: 24 }}>
          <div style={{ borderBottom: "1px solid #f1f5f9", paddingBottom: 16, marginBottom: 16 }}>
            <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Booking Price Matrix</span>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>
              {fmtBDT(v.rental_price ? Number(v.rental_price) : 50000)}
              <span style={{ fontSize: 13, fontWeight: 500, color: "#64748b", marginLeft: 4 }}>/ shift base</span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#475569" }}><i className="fa-solid fa-users" style={{ marginRight: 6, color: "#94a3b8" }} /> Max Capacity</span>
              <strong style={{ color: "#0f172a" }}>{v.capacity_max ? `${Number(v.capacity_max).toLocaleString()} Pax` : "800 Pax"}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "#475569" }}><i className="fa-solid fa-door-open" style={{ marginRight: 6, color: "#94a3b8" }} /> Guest Rooms</span>
              <strong style={{ color: "#0f172a" }}>{v.rooms ? `${v.rooms} Rooms` : "—"}</strong>
            </div>
          </div>

          <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>
              <span>Booking Token (20%)</span>
              <strong style={{ color: "var(--pink, #E72E77)" }}>
                {fmtBDT(Math.round((v.rental_price ? Number(v.rental_price) : 50000) * 0.20))}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", padding: "0 4px" }}>
              <span>Remaining Due Amount (80%)</span>
              <span>{fmtBDT(Math.round((v.rental_price ? Number(v.rental_price) : 50000) * 0.80))}</span>
            </div>
          </div>

          <button className="btn-primary" onClick={book} style={{ width: "100%", padding: 14, borderRadius: 10, marginTop: 20, marginBottom: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>
            Add Venue to Cart
          </button>
          <button onClick={enquire} style={{ width: "100%", padding: 12, borderRadius: 10, border: "2px solid var(--pink, #E72E77)", color: "var(--pink, #E72E77)", background: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 14 }}>
            Send Custom Enquiry
          </button>
        </aside>
      </div>

      {/* Similar Venues Sub-Grid Selector */}
      {similar.length > 0 && (
        <section style={{ marginTop: 64 }}>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 24 }}>Explore Comparable Venues Nearby</h2>
          <div className="venue-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
            {similar.map((sv) => <VenueCardView key={sv.id} v={sv} />)}
          </div>
        </section>
      )}

      {/* USER SIDE INTERACTIVE IMAGE LIGHTBOX OVERLAY DIALOG */}
      {lightboxImg && (
        <div
          onClick={() => setLightboxImg(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.9)",
            backdropFilter: "blur(8px)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            cursor: "zoom-out"
          }}
        >
          <div style={{ position: "relative", maxWidth: "90%", maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImg}
              alt="Expanded view profile panel"
              style={{
                width: "100%",
                maxHeight: "85vh",
                objectFit: "contain",
                borderRadius: 12,
                boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
              }}
            />
            <button
              onClick={() => setLightboxImg(null)}
              style={{
                position: "absolute",
                top: -16,
                right: -16,
                background: "var(--pink, #E72E77)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 36,
                height: 36,
                fontSize: 18,
                fontWeight: "bold",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
              }}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
}