import { useState } from "react";
import { signIn, signUp, signInWithGoogle } from "@/lib/data";
import { toast } from "sonner";

export function AuthModal({ open, mode, onClose, onSwitch }: {
  open: boolean; mode: "login" | "signup";
  onClose: () => void; onSwitch: (m: "login" | "signup") => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return toast.error("Email and password required");
    setBusy(true);
    try {
      if (mode === "login") {
        await signIn({ email, password });
        toast.success("Welcome back!");
        onClose();
      } else {
        await signUp({ email, password, name });
        toast.success("Check your email to confirm your account.");
        onSwitch("login");
      }
    } catch (err: any) {
      toast.error(err.message || "Authentication failed");
    } finally { setBusy(false); }
  }

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}
    >
      <div style={{ background:"#fff", borderRadius:14, padding:32, width:"100%", maxWidth:400, position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:12, right:16, background:"none", border:"none", fontSize:24, cursor:"pointer", color:"#999" }}>×</button>
        <h2 style={{ marginBottom:6, fontSize:22 }}>{mode === "login" ? "Welcome Back" : "Create Account"}</h2>
        <p style={{ color:"#888", fontSize:13, marginBottom:20 }}>
          {mode === "login" ? "Log in to continue planning your event" : "Join Eventix to start planning"}
        </p>
        <form onSubmit={submit} style={{ display:"flex", flexDirection:"column", gap:12 }}>
          {mode === "signup" && (
            <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)}
              style={{ padding:12, border:"1px solid #ddd", borderRadius:8, fontSize:14 }} />
          )}
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required
            style={{ padding:12, border:"1px solid #ddd", borderRadius:8, fontSize:14 }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required
            style={{ padding:12, border:"1px solid #ddd", borderRadius:8, fontSize:14 }} />
          <button type="submit" disabled={busy} className="btn-primary" style={{ marginTop:6, padding:13, borderRadius:10 }}>
            {busy ? "Please wait…" : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>
        <button onClick={() => signInWithGoogle().catch((e) => toast.error(e.message))}
          className="social-btn"
          style={{ width:"100%", marginTop:14, padding:11, border:"1px solid #ddd", borderRadius:10, background:"#fff", cursor:"pointer", fontSize:14, fontWeight:500 }}>
          <i className="fa-brands fa-google" style={{ marginRight:8, color:"#DB4437" }} /> Continue with Google
        </button>
        <p style={{ textAlign:"center", marginTop:16, fontSize:13, color:"#666" }}>
          {mode === "login" ? (
            <>Don't have an account? <a onClick={() => onSwitch("signup")} style={{ color:"var(--pink)", fontWeight:600, cursor:"pointer" }}>Sign up</a></>
          ) : (
            <>Already have an account? <a onClick={() => onSwitch("login")} style={{ color:"var(--pink)", fontWeight:600, cursor:"pointer" }}>Log in</a></>
          )}
        </p>
      </div>
    </div>
  );
}