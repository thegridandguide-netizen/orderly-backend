/**
 * /profile — user profile management.
 * NOTE: __root.tsx already wraps every route in <Layout>. Do NOT wrap this
 * page in <Layout> again, or the navbar/bottom-nav will render twice.
 */
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getMyProfile, updateMyProfile, changeMyPassword } from "@/lib/data";
import { CITIES } from "@/lib/filters";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

function ProfilePage() {
  const { user, ready } = useAuth();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", city: "", avatar_url: "" });
  const [pw, setPw] = useState("");

  useEffect(() => {
    if (!ready) return;
    if (!user) { nav({ to: "/" }); return; }
    getMyProfile().then((p) => {
      if (p) setForm({ name: p.name || "", phone: p.phone || "", city: p.city || "", avatar_url: p.avatar_url || "" });
      setLoading(false);
    }).catch((e) => { toast.error(e.message); setLoading(false); });
  }, [ready, user]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try { await updateMyProfile(form); toast.success("Profile updated"); }
    catch (e: any) { toast.error(e.message); }
    finally { setSaving(false); }
  }
  async function changePw(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters");
    try { await changeMyPassword(pw); toast.success("Password changed"); setPw(""); }
    catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="container" style={{ maxWidth: 720, padding: "32px 16px" }}>
      <h1 style={{ marginTop: 0 }}>My Profile</h1>
      {loading ? <p>Loading…</p> : (
        <>
          <form onSubmit={save} style={card}>
            <h3 style={{ marginTop: 0 }}>Personal Information</h3>
            <Field label="Email"><input value={user?.email || ""} disabled style={input} /></Field>
            <Field label="Full name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={input} /></Field>
            <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} style={input} /></Field>
            <Field label="City">
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} style={input}>
                <option value="">Select your city</option>
                {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Avatar URL"><input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} style={input} /></Field>
            {form.avatar_url && <img src={form.avatar_url} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", marginTop: 8 }} />}
            <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: 14 }}>{saving ? "Saving…" : "Save changes"}</button>
          </form>

          <form onSubmit={changePw} style={card}>
            <h3 style={{ marginTop: 0 }}>Change Password</h3>
            <Field label="New password"><input type="password" value={pw} onChange={(e) => setPw(e.target.value)} style={input} /></Field>
            <button type="submit" className="btn-primary" style={{ marginTop: 14, background: "#444" }}>Update password</button>
          </form>

          <div style={card}>
            <h3 style={{ marginTop: 0 }}>Quick Links</h3>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <Link to="/my-bookings" className="btn-primary" style={{ background: "#0f766e" }}>My Bookings</Link>
              <Link to="/cart" className="btn-primary" style={{ background: "#7c3aed" }}>My Cart</Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const card: React.CSSProperties = { background: "#fff", border: "1px solid var(--border, #e5e7eb)", borderRadius: 12, padding: 20, marginBottom: 18 };
const input: React.CSSProperties = { width: "100%", padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: 8, fontSize: 14 };
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#555", marginBottom: 4 }}>{label}</div>
      {children}
    </label>
  );
}
