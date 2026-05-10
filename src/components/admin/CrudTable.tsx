import { useEffect, useState } from "react";
import { adminList, adminCreate, adminUpdate, adminDelete, type AdminTable } from "@/lib/data";
import { toast } from "sonner";

export type FieldDef = {
  key: string;
  label?: string;
  type?: "text" | "textarea" | "number" | "boolean" | "json" | "date" | "select";
  options?: string[];
  optional?: boolean;
};

export function CrudTable({
  table,
  title,
  fields,
  display,
  defaults = {},
}: {
  table: AdminTable;
  title: string;
  fields: FieldDef[];
  display?: string[];
  defaults?: Record<string, any>;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);

  async function refresh() {
    setLoading(true);
    try { setRows(await adminList(table)); }
    catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, [table]);

  async function save(values: any) {
    try {
      if (editing?.id) await adminUpdate(table, editing.id, values);
      else await adminCreate(table, values);
      toast.success("Saved"); setEditing(null); refresh();
    } catch (e: any) { toast.error(e.message); }
  }
  async function del(id: string) {
    if (!confirm("Delete this row?")) return;
    try { await adminDelete(table, id); toast.success("Deleted"); refresh(); }
    catch (e: any) { toast.error(e.message); }
  }

  const cols = display || fields.slice(0, 5).map((f) => f.key);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        <button className="btn-primary" onClick={() => setEditing({ ...defaults })}>+ New</button>
      </div>
      {loading ? <div>Loading…</div> : (
        <div style={{ overflowX: "auto", background: "#fff", borderRadius: 10, border: "1px solid var(--border)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#f9fafb" }}>
              <tr>{cols.map((c) => <th key={c} style={th}>{c}</th>)}<th style={th}>Actions</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid var(--border)" }}>
                  {cols.map((c) => <td key={c} style={td}>{fmt(r[c])}</td>)}
                  <td style={td}>
                    <button onClick={() => setEditing(r)} style={btnSm}>Edit</button>
                    <button onClick={() => del(r.id)} style={{ ...btnSm, color: "#b91c1c" }}>Delete</button>
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan={cols.length + 1} style={{ ...td, textAlign: "center", color: "#888" }}>No rows</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {editing && <EditDialog row={editing} fields={fields} onSave={save} onClose={() => setEditing(null)} />}
    </div>
  );
}

function fmt(v: any) {
  if (v == null) return "—";
  if (typeof v === "boolean") return v ? "✓" : "✗";
  if (Array.isArray(v)) return v.join(", ") || "—";
  if (typeof v === "object") return JSON.stringify(v).slice(0, 60);
  const s = String(v);
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
}

function EditDialog({ row, fields, onSave, onClose }: { row: any; fields: FieldDef[]; onSave: (v: any) => void; onClose: () => void }) {
  const [v, setV] = useState<any>(() => {
    const o: any = {};
    fields.forEach((f) => { o[f.key] = row[f.key] ?? (f.type === "boolean" ? false : f.type === "number" ? "" : ""); });
    return o;
  });
  function submit(e: React.FormEvent) {
    e.preventDefault();
    const out: any = {};
    fields.forEach((f) => {
      let val = v[f.key];
      if (val === "" || val == null) { if (!f.optional) return; out[f.key] = null; return; }
      if (f.type === "number") val = Number(val);
      if (f.type === "json") { try { val = JSON.parse(val); } catch { toast.error(`${f.key}: invalid JSON`); throw new Error("bad json"); } }
      if (f.type === "boolean") val = !!val;
      out[f.key] = val;
    });
    onSave(out);
  }
  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0 }}>{row.id ? "Edit" : "Create"}</h3>
        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {fields.map((f) => (
            <div key={f.key}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{f.label || f.key}</label>
              {f.type === "textarea" ? (
                <textarea rows={3} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} style={inp} />
              ) : f.type === "boolean" ? (
                <input type="checkbox" checked={!!v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.checked })} />
              ) : f.type === "select" ? (
                <select value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} style={inp}>
                  <option value="">—</option>
                  {(f.options || []).map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === "json" ? (
                <textarea rows={3} value={typeof v[f.key] === "string" ? v[f.key] : JSON.stringify(v[f.key] ?? {}, null, 2)} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} style={{ ...inp, fontFamily: "monospace", fontSize: 12 }} />
              ) : (
                <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} style={inp} />
              )}
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
            <button type="button" onClick={onClose} style={btnSm}>Cancel</button>
            <button type="submit" className="btn-primary">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: 12, color: "#444" };
const td: React.CSSProperties = { padding: "10px 12px", verticalAlign: "top" };
const btnSm: React.CSSProperties = { padding: "4px 10px", marginRight: 6, border: "1px solid var(--border)", background: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 12 };
const inp: React.CSSProperties = { width: "100%", padding: 8, border: "1px solid var(--border)", borderRadius: 6, fontSize: 13 };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 };
const modal: React.CSSProperties = { background: "#fff", borderRadius: 12, padding: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflow: "auto" };
