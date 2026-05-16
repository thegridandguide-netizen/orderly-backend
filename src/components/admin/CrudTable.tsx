/**
 * CrudTable — generic admin list/create/edit/delete UI with integrated binary image file uploader.
 *
 * Each admin route declares a `fields` schema describing one column per
 * editable attribute. Supported field types:
 * - text | textarea | number | boolean | date | json
 * - select   → static `options: {label,value}[]`
 * - select   → dynamic `optionsAsync: () => Promise<{label,value}[]>`
 *
 * Validation: required fields trigger a toast before submit (see handleSubmit).
 * JSON fields are parsed safely; parse errors surface as toasts instead of
 * throwing.
 *
 * The component is intentionally table-agnostic: it calls adminList /
 * adminCreate / adminUpdate / adminDelete from data.ts which dispatch on the
 * `table` prop. Add a new admin screen by creating a route that renders
 * <CrudTable table=\"my_table\" fields={...} /> — no extra wiring needed.
 */
import { useEffect, useState } from "react";
import { adminList, adminCreate, adminUpdate, adminDelete, type AdminTable, supabase } from "@/lib/data";
import { toast } from "sonner";

/**
 * Field schema for admin CRUD form.
 */
export type SelectOption = { value: string; label: string };
export type FieldDef = {
  key: string;
  label?: string;
  type?: "text" | "textarea" | "number" | "boolean" | "json" | "date" | "select";
  options?: SelectOption[] | string[];
  optionsAsync?: () => Promise<SelectOption[]>;
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
    try {
      setRows(await adminList(table));
    } catch (e: any) {
      toast.error(e.message || "Failed to load rows");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, [table]);

  async function save(values: any) {
    try {
      if (editing?.id) await adminUpdate(table, editing.id, values);
      else await adminCreate(table, values);
      toast.success("Saved successfully");
      setEditing(null);
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Save operation failed");
    }
  }

  async function del(id: string) {
    if (!confirm("Delete this row?")) return;
    try {
      await adminDelete(table, id);
      toast.success("Deleted successfully");
      refresh();
    } catch (e: any) {
      toast.error(e.message || "Deletion failed");
    }
  }

  const cols = display || fields.slice(0, 5).map((f) => f.key);

  return (
    <div className="admin-scope" style={{ padding: "4px 0" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#0f172a" }}>{title}</h2>
        <button 
          className="btn-primary" 
          onClick={() => setEditing({ ...defaults })}
          style={{ padding: "10px 18px", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          + New Entry
        </button>
      </div>

      {loading ? (
        <div style={{ padding: "40px 0", textAlign: "center", color: "#64748b", fontSize: 14 }}>Loading operational table datasets…</div>
      ) : (
        <div style={{ overflowX: "auto", background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#f8fafc" }}>
              <tr>
                {cols.map((c) => (
                  <th key={c} style={th}>{c.replace(/_/g, " ")}</th>
                ))}
                <th style={{ ...th, textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #f1f5f9" }}>
                  {cols.map((c) => {
                    const val = r[c];
                    const isImg = String(c).endsWith("image_url") && val;
                    const isGallery = c === "gallery_image_urls" && Array.isArray(val);

                    return (
                      <td key={c} style={td}>
                        {isImg ? (
                          <img src={val} alt="Preview" style={{ width: 48, height: 34, objectFit: "cover", borderRadius: 6, border: "1px solid #e2e8f0" }} />
                        ) : isGallery ? (
                          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                            {val.slice(0, 3).map((imgUrl: string, idx: number) => (
                              <img key={idx} src={imgUrl} alt="Thumb" style={{ width: 28, height: 22, objectFit: "cover", borderRadius: 4 }} />
                            ))}
                            {val.length > 3 && <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>+{val.length - 3}</span>}
                          </div>
                        ) : (
                          <div style={{ maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{fmt(val)}</div>
                        )}
                      </td>
                    );
                  })}
                  <td style={{ ...td, textAlign: "right", whiteSpace: "nowrap" }}>
                    <button onClick={() => setEditing(r)} style={btnSm}>Edit</button>
                    <button onClick={() => del(r.id)} style={{ ...btnSm, marginRight: 0, color: "#ef4444", borderColor: "#fecaca" }}>Delete</button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan={cols.length + 1} style={{ ...td, textAlign: "center", color: "#64748b", padding: "32px 0" }}>
                    No active records discovered inside this table module yet.
                  </td>
                </tr>
              )}
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
  if (typeof v === "boolean") return v ? "✓ Yes" : "✗ No";
  if (Array.isArray(v)) return v.join(", ") || "—";
  if (typeof v === "object") return JSON.stringify(v).slice(0, 60);
  const s = String(v);
  return s.length > 60 ? s.slice(0, 60) + "…" : s;
}

function normaliseOptions(opts: SelectOption[] | string[] | undefined): SelectOption[] {
  if (!opts) return [];
  return opts.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
}

function EditDialog({ row, fields, onSave, onClose }: { row: any; fields: FieldDef[]; onSave: (v: any) => void; onClose: () => void }) {
  const [v, setV] = useState<any>(() => {
    const o: any = {};
    fields.forEach((f) => {
      o[f.key] = row[f.key] ?? (f.type === "boolean" ? false : f.type === "number" ? "" : "");
    });
    
    if (!o["gallery_layouts"] || !Array.isArray(o["gallery_layouts"])) {
      o["gallery_layouts"] = row["gallery_layouts"] ?? [];
    }

    if (!o["gallery_image_urls"] || !Array.isArray(o["gallery_image_urls"])) {
      o["gallery_image_urls"] = Array.isArray(row["gallery_image_urls"]) 
        ? row["gallery_image_urls"] 
        : [];
    }
    
    return o;
  });

  const [asyncOpts, setAsyncOpts] = useState<Record<string, SelectOption[]>>({});
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"wedding" | "corporate" | "birthday">("wedding");

  const sectionLabels = ["Main Hall", "Stage", "Dining Area", "Decoration Setup", "Lighting", "Parking", "Entrance", "Washrooms", "Outdoor Area"];

  useEffect(() => {
    fields.forEach((f) => {
      if (f.optionsAsync && !asyncOpts[f.key]) {
        f.optionsAsync()
          .then((rs) => setAsyncOpts((prev) => ({ ...prev, [f.key]: rs })))
          .catch(() => {});
      }
    });
  }, [fields, asyncOpts]);

  async function uploadFileBinary(e: React.ChangeEvent<HTMLInputElement>, fieldKey: string, multiMode: boolean) {
    const targetFiles = e.target.files;
    if (!targetFiles || targetFiles.length === 0) return;

    setUploading(true);
    try {
      const linksArray: string[] = [];
      const updatedLayouts = Array.isArray(v["gallery_layouts"]) ? [...v["gallery_layouts"]] : [];

      for (let i = 0; i < targetFiles.length; i++) {
        const activeFile = targetFiles[i];
        const ext = activeFile.name.split(".").pop() || "jpg";
        const generatedSlug = `${Math.random().toString(36).substring(2)}-${Date.now()}.${ext}`;
        const finalStoragePath = `venues/${generatedSlug}`;

        const { error: err } = await supabase.storage
          .from("venue-images")
          .upload(finalStoragePath, activeFile, { cacheControl: "3600", upsert: false });

        if (err) throw err;

        const { data: pathData } = supabase.storage
          .from("venue-images")
          .getPublicUrl(finalStoragePath);

        linksArray.push(pathData.publicUrl);

        if (multiMode) {
          updatedLayouts.push({
            url: pathData.publicUrl,
            type: activeTab
          });
        }
      }

      if (multiMode) {
        let priorCollection: string[] = [];
        try {
          priorCollection = Array.isArray(v["gallery_image_urls"]) ? v["gallery_image_urls"] : JSON.parse(v["gallery_image_urls"] || "[]");
        } catch {
          priorCollection = [];
        }
        
        setV({ 
          ...v, 
          gallery_image_urls: [...priorCollection, ...linksArray],
          gallery_layouts: updatedLayouts
        });
        toast.success(`Appended ${linksArray.length} items safely into the gallery tracks.`);
      } else {
        setV({ ...v, [fieldKey]: linksArray[0] });
        toast.success("Primary header background image configuration refreshed.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed handling image server file uploads");
    } finally {
      setUploading(false);
    }
  }

  function removeGalleryItem(idxToRemove: number) {
    const currentUrls = Array.isArray(v["gallery_image_urls"]) ? v["gallery_image_urls"] : [];
    const currentLayouts = Array.isArray(v["gallery_layouts"]) ? v["gallery_layouts"] : [];

    setV({
      ...v,
      gallery_image_urls: currentUrls.filter((_, i) => i !== idxToRemove),
      gallery_layouts: currentLayouts.filter((_, i) => i !== idxToRemove)
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const out: any = {};
    const missing: string[] = [];

    const evaluationFields = fields.some(f => f.key === "gallery_image_urls") 
      ? fields 
      : [...fields, { key: "gallery_image_urls", optional: true }, { key: "gallery_layouts", optional: true }];

    for (const f of evaluationFields) {
      let val = v[f.key];
      const empty = val === "" || val == null;
      if (empty) {
        if (f.optional || f.key === "gallery_image_urls" || f.key === "gallery_layouts") {
          out[f.key] = f.key.endsWith("urls") || f.key.endsWith("layouts") ? [] : null;
          continue;
        }
        missing.push(f.label || f.key);
        continue;
      }
      if (f.type === "number") val = Number(val);
      if (f.type === "json") {
        try {
          val = typeof val === "string" ? JSON.parse(val) : val;
        } catch {
          toast.error(`${f.key}: invalid JSON object sequence structure`);
          return;
        }
      }
      if (f.type === "boolean") val = !!val;
      
      if (f.key === "gallery_image_urls" && typeof val === "string") {
        try { val = JSON.parse(val); } catch { val = val.split(",").map((s: string) => s.trim()).filter(Boolean); }
      }

      out[f.key] = val;
    }
    if (missing.length) {
      toast.error(`Required: ${missing.join(", ")}`);
      return;
    }
    onSave(out);
  }

  const currentGalleryUrls = Array.isArray(v["gallery_image_urls"]) ? v["gallery_image_urls"] : [];
  const currentGalleryLayouts = Array.isArray(v["gallery_layouts"]) ? v["gallery_layouts"] : [];

  // Group input fields logic cleanly for a dual-column split view layout
  const textAndSelectFields = fields.filter(f => f.key !== "gallery_layouts" && f.key !== "gallery_image_urls" && f.key !== "cover_image_url" && !f.key.endsWith("image_url") && f.type !== "textarea");
  const fullWidthTextAreaFields = fields.filter(f => f.type === "textarea" || f.type === "json");
  const mediaFields = fields.filter(f => f.key === "cover_image_url" || f.key.endsWith("image_url") || f.key === "gallery_image_urls");

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        
        {/* Sticky Header Panel */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, borderBottom: "1px solid #f1f5f9", paddingBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: "#0f172a", letterSpacing: "-0.025em" }}>
              {row.id ? "Edit Profile Specifications" : "Create New Profile Entry"}
            </h3>
            <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#64748b" }}>Manage operational variables and multimedia directory files.</p>
          </div>
          <button onClick={onClose} style={{ background: "#f1f5f9", border: "none", fontSize: 18, color: "#64748b", cursor: "pointer", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>×</button>
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          
          {/* SECTION 1: Meta Grid Panel */}
          {textAndSelectFields.length > 0 && (
            <div>
              <h4 style={sectionHeader}>1. Basic Attributes & Information</h4>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
                {textAndSelectFields.map((f) => {
                  const selectOpts = f.type === "select" ? (f.optionsAsync ? asyncOpts[f.key] || [] : normaliseOptions(f.options)) : [];
                  return (
                    <div key={f.key} style={f.type === "boolean" ? { gridColumn: "1 / -1", background: "#f8fafc", padding: "12px 16px", borderRadius: 8, border: "1px solid #e2e8f0" } : {}}>
                      {f.type !== "boolean" && (
                        <label style={inputLabel}>
                          {f.label || f.key.replace(/_/g, " ")} {!f.optional && <span style={{ color: "#e11d48" }}>*</span>}
                        </label>
                      )}

                      {f.type === "boolean" ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
                          <input type="checkbox" id={`chk-${f.key}`} checked={!!v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.checked })} style={{ width: 16, height: 16, cursor: "pointer" }} />
                          <label htmlFor={`chk-${f.key}`} style={{ fontSize: 13, color: "#334155", fontWeight: 600, cursor: "pointer", userSelect: "none" }}>
                            {f.label || f.key.replace(/_/g, " ")} (Enable visibility within search metrics)
                          </label>
                        </div>
                      ) : f.type === "select" ? (
                        <select value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} style={inp}>
                          <option value="">{f.optional ? "— none selected —" : "— select option —"}</option>
                          {selectOpts.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <input type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} style={inp} placeholder={`Enter ${f.key.replace(/_/g, " ")}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: Text Area Paragraph Panels */}
          {fullWidthTextAreaFields.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {fullWidthTextAreaFields.map((f) => (
                <div key={f.key}>
                  <label style={inputLabel}>
                    {f.label || f.key.replace(/_/g, " ")} {!f.optional && <span style={{ color: "#e11d48" }}>*</span>}
                  </label>
                  {f.type === "json" ? (
                    <textarea rows={4} value={typeof v[f.key] === "string" ? v[f.key] : JSON.stringify(v[f.key] ?? {}, null, 2)} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} style={{ ...inp, fontFamily: "monospace", fontSize: 12, background: "#f8fafc", lineHeight: "1.5" }} />
                  ) : (
                    <textarea rows={3} value={v[f.key] ?? ""} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} style={{ ...inp, lineHeight: "1.5" }} placeholder={`Provide comprehensive summary parameters about this listing entry...`} />
                  )}
                </div>
              ))}
            </div>
          )}

          {/* SECTION 3: Brand Asset Media Management Folders */}
          {mediaFields.length > 0 && (
            <div>
              <h4 style={sectionHeader}>2. Visual Banners & Multi-Layout Gallery</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {mediaFields.map((f) => {
                  const isMainCoverUrlField = f.key === "cover_image_url" || f.key.endsWith("image_url");
                  
                  if (isMainCoverUrlField) {
                    return (
                      <div key={f.key} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
                        <label style={{ ...inputLabel, marginBottom: 4 }}>Primary Cover Background Banner</label>
                        <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "#64748b" }}>Recommended: high resolution landscape 16:9 ratio (.jpg / .png).</p>
                        
                        <div style={{ display: "flex", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
                          <div style={{ flex: 1, minWidth: 200 }}>
                            <input type="file" accept=".jpg,.jpeg,.png" disabled={uploading} onChange={(e) => uploadFileBinary(e, f.key, false)} style={fileInputStyle} />
                          </div>
                          {v[f.key] && (
                            <div style={{ position: "relative", width: 140, height: 80, borderRadius: 8, overflow: "hidden", border: "1px solid #cbd5e1", boxShadow: "0 2px 4px rgba(0,0,0,0.04)" }}>
                              <img src={v[f.key]} alt="Cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <span style={{ position: "absolute", bottom: 0, insetX: 0, width: "100%", background: "rgba(15,23,42,0.75)", color: "#fff", fontSize: 9, textAlign: "center", padding: "2px 0", fontWeight: 600 }}>Active Header</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }

                  // Gallery Multi-Image Tabs Layout Handler
                  return (
                    <div key={f.key} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 16 }}>
                      <label style={{ ...inputLabel, marginBottom: 2 }}>Interactive Presentation Folders</label>
                      <p style={{ margin: "0 0 14px 0", fontSize: 12, color: "#64748b" }}>Select a specific category tab view folder below before batch-uploading related files.</p>
                      
                      {/* Segment Tab Controls Row */}
                      <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "#cbd5e1", padding: 4, borderRadius: 8 }}>
                        {(["wedding", "corporate", "birthday"] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => setActiveTab(mode)}
                            style={{
                              flex: 1,
                              padding: "8px 10px",
                              fontSize: 12,
                              fontWeight: 700,
                              border: "none",
                              borderRadius: 6,
                              cursor: "pointer",
                              textTransform: "capitalize",
                              background: activeTab === mode ? "var(--pink, #E72E77)" : "transparent",
                              color: activeTab === mode ? "#fff" : "#475569",
                              transition: "all 0.15s ease-in-out",
                              boxShadow: activeTab === mode ? "0 2px 4px rgba(231,46,119,0.2)" : "none"
                            }}
                          >
                            {mode} View
                          </button>
                        ))}
                      </div>

                      <input type="file" accept=".jpg,.jpeg,.png" multiple disabled={uploading} onChange={(e) => uploadFileBinary(e, f.key, true)} style={fileInputStyle} />
                      
                      {currentGalleryUrls.length > 0 && (
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(105px, 1fr))", gap: 12, marginTop: 16, borderTop: "1px solid #e2e8f0", paddingTop: 14 }}>
                          {currentGalleryUrls.map((imgUrl: string, idx: number) => {
                            const itemLayout = currentGalleryLayouts[idx]?.type || "wedding";
                            if (itemLayout !== activeTab) return null;

                            const conditionalLabel = sectionLabels[idx % sectionLabels.length];
                            return (
                              <div key={idx} style={{ position: "relative", border: "1px solid #e2e8f0", borderRadius: 8, padding: 4, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column" }}>
                                <div style={{ width: "100%", height: 60, borderRadius: 6, overflow: "hidden", position: "relative" }}>
                                  <img src={imgUrl} alt="Thumb" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                </div>
                                <div style={{ fontSize: 10, fontWeight: 700, color: "#1e293b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 6, padding: "0 2px" }}>
                                  {conditionalLabel}
                                </div>
                                <div style={{ fontSize: 9, color: "var(--pink, #E72E77)", fontWeight: 600, padding: "0 2px" }}>{activeTab}</div>
                                <button
                                  type="button"
                                  onClick={() => removeGalleryItem(idx)}
                                  style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "#fff", border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 10, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", fontWeight: "bold" }}
                                >
                                  ×
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions Command Bar */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 8, borderTop: "1px solid #f1f5f9", paddingTop: 18 }}>
            <button type="button" onClick={onClose} style={{ ...btnSm, padding: "10px 20px", borderRadius: 8, margin: 0, height: "auto", fontSize: 13, fontWeight: 600, background: "#f8fafc" }}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={uploading} style={{ padding: "10px 24px", borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: uploading ? "not-allowed" : "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
              {uploading ? "Uploading Assets..." : "Save Operational Record"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const th: React.CSSProperties = { textAlign: "left", padding: "12px 14px", fontWeight: 600, fontSize: 12, color: "#475569", textTransform: "capitalize" };
const td: React.CSSProperties = { padding: "12px 14px", verticalAlign: "middle", color: "#334155" };
const btnSm: React.CSSProperties = { padding: "6px 12px", marginRight: 8, border: "1px solid #cbd5e1", background: "#fff", borderRadius: 6, cursor: "pointer", fontSize: 12, fontWeight: 500, color: "#334155" };
const inp: React.CSSProperties = { width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 8, fontSize: 13, color: "#0f172a", outline: "none", background: "#fff", transition: "border-color 0.15s ease" };
const overlay: React.CSSProperties = { position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 20 };
const modal: React.CSSProperties = { background: "#fff", borderRadius: 16, padding: 28, width: "100%", maxWidth: 640, maxHeight: "88vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.15)" };

const sectionHeader: React.CSSProperties = { margin: "0 0 14px 0", fontSize: 14, fontWeight: 700, color: "#0f172a", borderBottom: "2px solid #f1f5f9", paddingBottom: 6, letterSpacing: "-0.01em" };
const inputLabel: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 700, color: "#344054", marginBottom: 6 };
const fileInputStyle: React.CSSProperties = { width: "100%", padding: "8px 12px", border: "1px solid #cbd5e1", background: "#fff", borderRadius: 6, fontSize: 12, cursor: "pointer", color: "#475569" };