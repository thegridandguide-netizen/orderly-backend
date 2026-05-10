import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { adminList, adminCreate, adminDelete } from "@/lib/data";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({ component: UsersPage });

function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    const [u, r] = await Promise.all([adminList("profiles", { limit: 500 }), adminList("user_roles", { limit: 1000 })]);
    setUsers(u); setRoles(r); setLoading(false);
  }
  useEffect(() => { refresh(); }, []);

  async function setRole(user_id: string, role: "admin" | "vendor" | "customer", on: boolean) {
    try {
      const existing = roles.find((x) => x.user_id === user_id && x.role === role);
      if (on && !existing) await adminCreate("user_roles", { user_id, role });
      else if (!on && existing) await adminDelete("user_roles", existing.id);
      toast.success("Role updated"); refresh();
    } catch (e: any) { toast.error(e.message); }
  }

  if (loading) return <div>Loading…</div>;
  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Users &amp; Roles</h1>
      <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 10, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead style={{ background: "#f9fafb" }}>
            <tr>
              <th style={th}>Name</th><th style={th}>Email</th>
              <th style={th}>Admin</th><th style={th}>Vendor</th><th style={th}>Customer</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const userRoles = roles.filter((r) => r.user_id === u.id).map((r) => r.role);
              return (
                <tr key={u.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={td}>{u.name || "—"}</td>
                  <td style={td}>{u.email || "—"}</td>
                  {(["admin", "vendor", "customer"] as const).map((role) => (
                    <td key={role} style={td}>
                      <input type="checkbox" checked={userRoles.includes(role)} onChange={(e) => setRole(u.id, role, e.target.checked)} />
                    </td>
                  ))}
                </tr>
              );
            })}
            {!users.length && <tr><td colSpan={5} style={{ ...td, textAlign: "center", color: "#888" }}>No users yet</td></tr>}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 14, color: "#666", fontSize: 13 }}>
        Tip: To create the first admin, sign up a user, then run the SQL: <code>INSERT INTO user_roles(user_id, role) VALUES ('USER_ID','admin');</code>
      </p>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: 12 };
const td: React.CSSProperties = { padding: "10px 12px" };
