import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadAlbums, loadPhotos } from "@/lib/data";

export const Route = createFileRoute("/photos")({ component: PhotosPage });

const CATS = ["", "decor", "outfits", "catering", "entertainment", "venue", "makeup"];

function PhotosPage() {
  const [category, setCategory] = useState("");
  const [albums, setAlbums] = useState<any[]>([]);
  const [photos, setPhotos] = useState<any[]>([]);
  useEffect(() => { loadAlbums({ featured: true, limit: 4 }).then(setAlbums).catch(() => {}); }, []);
  useEffect(() => { loadPhotos({ category: category || undefined, limit: 30 }).then(setPhotos).catch(() => setPhotos([])); }, [category]);
  return (
    <div className="page active">
      <section className="photos-hero"><div className="container"><h1>Photo Inspiration</h1><p>Discover real events and styling ideas</p></div></section>
      <section className="container section-padding">
        {albums.length > 0 && (<><h2 className="section-title">Featured Albums</h2><div className="featured-albums">{albums.map((a) => (<div key={a.id} className="album-card">{a.cover_image_url && <img src={a.cover_image_url} alt={a.title} />}<div className="album-overlay"><div><div className="album-title">{a.title}</div><div className="album-count">{a.city}</div></div></div></div>))}</div></>)}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "30px 0 24px" }}>{CATS.map((c) => (<div key={c || "all"} className={`photo-pill ${category === c ? "active" : ""}`} onClick={() => setCategory(c)}>{c ? c[0].toUpperCase() + c.slice(1) : "All"}</div>))}</div>
        <div className="masonry">{photos.map((p) => (<Link key={p.id} to="/photo/$id" params={{ id: p.id }} className="masonry-item" style={{ display: "block" }}>{p.image_url && <img src={p.image_url} alt={p.caption || ""} loading="lazy" />}<div className="masonry-overlay"><div><span className="mi-name">{p.caption || p.category}</span>{p.city && <span className="mi-loc">{p.city}</span>}</div></div></Link>))}</div>
        {photos.length === 0 && <p style={{ color: "#888", textAlign: "center", padding: 40 }}>No photos found.</p>}
      </section>
    </div>
  );
}