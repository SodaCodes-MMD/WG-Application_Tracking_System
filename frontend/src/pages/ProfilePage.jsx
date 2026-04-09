import { useState, useEffect } from "react";
import "./ProfilePage.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) };
}

async function apiFetch(method, path, body) {
  const res = await fetch(`${API_URL}${path}`, { method, headers: getAuthHeaders(), ...(body ? { body: JSON.stringify(body) } : {}) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Request failed");
  return data;
}

function getInitials(displayName, email) {
  if (displayName?.trim()) return displayName.trim().split(" ").slice(0,2).map(w => w[0].toUpperCase()).join("");
  return (email || "?")[0].toUpperCase();
}

export default function ProfilePage({ user: userProp }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: "", bio: "", location: "" });
  const [formErrors, setFormErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    apiFetch("GET", "/profile")
      .then(res => { setProfile(res.data); setForm({ displayName: res.data.displayName||"", bio: res.data.bio||"", location: res.data.location||"" }); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const set = (field) => (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setFormErrors(errs => ({ ...errs, [field]: undefined })); setSaveSuccess(false); };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try { const res = await apiFetch("PATCH", "/profile", form); setProfile(res.data); setSaveSuccess(true); setEditing(false); }
    catch (err) { setFormErrors({ _general: err.message }); }
    finally { setSaving(false); }
  };

  const handleCancel = () => { setForm({ displayName: profile?.displayName||"", bio: profile?.bio||"", location: profile?.location||"" }); setFormErrors({}); setEditing(false); };

  if (loading) return (<><div className="page-header"><h2>Profile</h2><p>Manage your account information.</p></div><div className="prof-loading"><div className="prof-spinner" /><p>Loading…</p></div></>);
  if (error) return (<><div className="page-header"><h2>Profile</h2><p>Manage your account information.</p></div><div className="prof-error">⚠️ {error}</div></>);

  const email = profile?.email || userProp?.email || "";
  const displayName = profile?.displayName || "";
  const memberSince = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: "long", year: "numeric" }) : null;
  const pwChanged = profile?.passwordUpdatedAt ? new Date(profile.passwordUpdatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <>
      <div className="page-header"><h2>Profile</h2><p>Manage your account information.</p></div>

      <div className="prof-identity-card">
        <div className="prof-avatar">{getInitials(displayName, email)}</div>
        <div className="prof-identity-info">
          <p className="prof-display-name">{displayName || <span className="prof-placeholder">No display name set</span>}</p>
          <p className="prof-email">{email}</p>
          {memberSince && <p className="prof-member-since">Member since {memberSince}</p>}
        </div>
        {!editing && <button className="prof-edit-btn" onClick={() => setEditing(true)}>Edit Profile</button>}
      </div>

      {saveSuccess && <div className="prof-success-banner">✓ Profile updated successfully.</div>}

      {editing ? (
        <section className="prof-section">
          <h3 className="prof-section-title">Edit Profile</h3>
          <div className="prof-card">
            {formErrors._general && <div className="prof-error-banner">{formErrors._general}</div>}
            <form onSubmit={handleSave} noValidate>
              <div className="prof-form-group">
                <label>Display Name</label>
                <input type="text" value={form.displayName} onChange={set("displayName")} placeholder="How you'd like to be known" disabled={saving} maxLength={100} />
              </div>
              <div className="prof-form-group">
                <label>Location</label>
                <input type="text" value={form.location} onChange={set("location")} placeholder="e.g. New York, NY" disabled={saving} maxLength={100} />
              </div>
              <div className="prof-form-group">
                <label>Bio <span className="prof-char-count">{form.bio.length}/500</span></label>
                <textarea value={form.bio} onChange={set("bio")} placeholder="A short bio about yourself…" rows={4} disabled={saving} maxLength={500} />
              </div>
              <div className="prof-form-actions">
                <button type="button" className="prof-btn-cancel" onClick={handleCancel} disabled={saving}>Cancel</button>
                <button type="submit" className="prof-btn-save" disabled={saving}>{saving ? "Saving…" : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </section>
      ) : (
        <section className="prof-section">
          <h3 className="prof-section-title">About</h3>
          <div className="prof-card prof-info-grid">
            {[["Display Name", displayName], ["Email", email], ["Location", profile?.location], ["Bio", profile?.bio]].map(([label, val]) => (
              <div key={label} className="prof-info-row">
                <span className="prof-info-label">{label}</span>
                <span className="prof-info-value prof-bio-value">{val || <span className="prof-placeholder">—</span>}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="prof-section">
        <h3 className="prof-section-title">Account</h3>
        <div className="prof-card prof-info-grid">
          <div className="prof-info-row"><span className="prof-info-label">Member Since</span><span className="prof-info-value">{memberSince || "—"}</span></div>
          <div className="prof-info-row"><span className="prof-info-label">Password Last Changed</span><span className="prof-info-value">{pwChanged || <span className="prof-placeholder">Never</span>}</span></div>
        </div>
      </section>
    </>
  );
}
