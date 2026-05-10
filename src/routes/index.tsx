import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadVenues, type VenueCard } from "@/lib/data";
import { VenueCardView } from "@/components/cards";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [q, setQ] = useState("");
  const [picks, setPicks] = useState<VenueCard[]>([]);

  useEffect(() => {
    loadVenues({ handpicked: true, limit: 3 }).then(setPicks).catch(() => setPicks([]));
  }, []);

  function search() {
    if (q) sessionStorage.setItem("eventix_search", q);
    navigate({ to: "/venues", search: city ? { city } : undefined } as any);
  }

  return (
    <div className="page active">
      <section className="hero">
        <div className="hero-overlay">
          <div className="container hero-content">
            <h1>eventix: Crafting Incredible Public Events,<br />for Everyone.</h1>
            <p>We Plan, Coordinate, and Execute Unforgettable Experiences with eventix.</p>
            <div className="main-search">
              <select value={city} onChange={(e) => setCity(e.target.value)}>
                <option value="">All Cities</option>
                {["Dhaka","Chittagong","Khulna","Rajshahi","Sylhet","Rangpur","Barishal","Cox's Bazar"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Search Venues, Makeup Artists, Photographers..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && search()}
              />
              <button onClick={search}>Get Started</button>
            </div>
          </div>
        </div>
      </section>

      <div className="stats-bar">
        <div className="container stats-grid">
          {[
            ["40,000+", "Venues Listed"],
            ["3,800+", "Verified Vendors"],
            ["1.2M+", "Happy Couples"],
            ["150+", "Cities Covered"],
            ["4.8★", "Average Rating"],
          ].map(([n, l]) => (
            <div className="stat-item" key={l}><div className="num">{n}</div><div className="lbl">{l}</div></div>
          ))}
        </div>
      </div>

      <section className="container section-padding">
        <h2 className="section-title">Event Categories</h2>
        <p className="section-sub">Find the perfect service for every celebration</p>
        <div className="category-grid">
          {[
            { to: "/venues", cls: "blue-bg", title: "Venues", sub: "Banquet halls, resorts & more", img: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=150" },
            { to: "/vendors", cls: "orange-bg", title: "Photographers", sub: "Candid, Traditional...", img: "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=150" },
            { to: "/vendors", cls: "pink-bg", title: "Makeup Artists", sub: "Bridal, Party...", img: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=150" },
            { to: "/vendors", cls: "green-bg", title: "Decorators", sub: "Floral, Themed, Elegant", img: "https://images.unsplash.com/photo-1478146522997-6f2d0285a219?auto=format&fit=crop&q=80&w=150" },
            { to: "/vendors", cls: "purple-bg", title: "Caterers", sub: "Multi-cuisine, Live counters", img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=150" },
            { to: "/vendors", cls: "yellow-bg", title: "DJs & Music", sub: "Live bands, Sound systems", img: "https://images.unsplash.com/photo-1501386761578-eaa54b07c8e5?auto=format&fit=crop&q=80&w=150" },
          ].map((c) => (
            <Link to={c.to} key={c.title} className={`cat-card ${c.cls}`} style={{ textDecoration: "none" }}>
              <div className="cat-info"><h3>{c.title}</h3><p>{c.sub}</p></div>
              <img src={c.img} alt={c.title} />
            </Link>
          ))}
        </div>
      </section>

      <section style={{ background: "#fafafa", padding: "60px 0" }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: "center" }}>How Eventix Works</h2>
          <p className="section-sub" style={{ textAlign: "center" }}>Plan your perfect event in 4 simple steps</p>
          <div className="steps-grid">
            {[
              ["1","fa-magnifying-glass","Search & Discover","Browse thousands of venues and vendors with powerful filters."],
              ["2","fa-heart","Shortlist Favourites","Save your favourite picks and compare options side by side."],
              ["3","fa-message","Get Quotes","Send enquiries directly and receive personalised quotes instantly."],
              ["4","fa-calendar-check","Book & Celebrate","Confirm your bookings and enjoy your perfectly planned event!"],
            ].map(([n, ic, t, d]) => (
              <div className="step" key={n}>
                <div className="step-num">{n}</div>
                <div className="step-icon"><i className={`fa-solid ${ic}`} /></div>
                <h4>{t}</h4><p>{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container section-padding">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <h2 className="section-title" style={{ marginBottom: 4 }}>Handpicked Venues</h2>
            <p className="section-sub" style={{ margin: 0 }}>Curated selections near you</p>
          </div>
          <Link to="/venues" style={{ color: "var(--pink)", fontWeight: 700, fontSize: 14 }}>View All →</Link>
        </div>
        <div className="venue-grid">
          {picks.length === 0
            ? Array.from({ length: 3 }).map((_, i) => <div key={i} className="venue-card" style={{ height: 380, background: "#f3f3f3" }} />)
            : picks.map((v) => <VenueCardView key={v.id} v={v} />)}
        </div>
      </section>

      <section style={{ background: "#fafafa", padding: "60px 0", marginBottom: 60 }}>
        <div className="container">
          <h2 className="section-title" style={{ textAlign: "center" }}>What Our Clients Say</h2>
          <p className="section-sub" style={{ textAlign: "center", marginBottom: 36 }}>Real stories from real events</p>
          <div className="testimonial-grid">
            {[
              ["Eventix made our wedding planning a breeze. Found the perfect venue and photographer within days.", "Nadia Rahman", "Wedding · Dhaka", "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80"],
              ["We organised a corporate gala for 500 guests using Eventix. The platform made vendor coordination so simple.", "Rafiq Hasan", "Corporate Event · Chittagong", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80"],
              ["Best decision was using Eventix. Our birthday party was stress-free thanks to amazing vendors.", "Sara Ahmed", "Birthday · Sylhet", "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80"],
            ].map(([text, name, ev, img]) => (
              <div className="testimonial-card" key={name}>
                <div className="t-stars">★★★★★</div>
                <p className="t-text">"{text}"</p>
                <div className="t-author">
                  <img className="t-avatar" src={img} alt="" />
                  <div><div className="t-name">{name}</div><div className="t-event">{ev}</div></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
