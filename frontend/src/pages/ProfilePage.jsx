import { useState, useEffect } from "react";
import { getToken } from "../services/auth-service.js";
import {
  getProfile, saveProfile,
  addExperience, updateExperience, deleteExperience, reorderExperience,
  addEducation, updateEducation, deleteEducation,
} from "../services/profile-api.js";
import "./AuthForms.css";

// ── Constants ────────────────────────────────────────────────────────────────

const BASIC_FIELDS = ["firstName", "lastName", "phone", "location", "headline", "summary"];
const EMPTY_PROFILE = { firstName: "", lastName: "", phone: "", location: "", headline: "", summary: "" };

const EMPTY_EXP = { jobTitle: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "", accomplishments: "" };
const EMPTY_EDU = { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", gpa: "", honors: "" };

// ── Helpers ──────────────────────────────────────────────────────────────────

function toMonthInput(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return "";
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function formatMonthYear(d) {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt)) return "";
  return dt.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

// ── Main component ───────────────────────────────────────────────────────────

export default function ProfilePage({ user }) {
  const [profile, setProfile]     = useState({ ...EMPTY_PROFILE });
  const [experience, setExp]       = useState([]);
  const [education, setEdu]        = useState([]);
  const [loading, setLoading]      = useState(true);
  const [saving, setSaving]        = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError]  = useState("");

  // Experience form state
  const [showExpForm, setShowExpForm]   = useState(false);
  const [editingExp, setEditingExp]     = useState(null);
  const [expForm, setExpForm]           = useState(EMPTY_EXP);
  const [expLoading, setExpLoading]     = useState(false);
  const [expError, setExpError]         = useState("");

  // Education form state
  const [showEduForm, setShowEduForm]   = useState(false);
  const [editingEdu, setEditingEdu]     = useState(null);
  const [eduForm, setEduForm]           = useState(EMPTY_EDU);
  const [eduLoading, setEduLoading]     = useState(false);
  const [eduError, setEduError]         = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const result = await getProfile(getToken());
      if (result.success && result.data) {
        setProfile({ ...EMPTY_PROFILE, ...result.data });
        setExp(result.data.experience || []);
        setEdu(result.data.education || []);
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  // ── Completion indicator ───────────────────────────────────────────────────
  // email(1) + 6 basic fields + hasExp(1) + hasEdu(1) = 9 total
  const filledBasic = BASIC_FIELDS.filter((f) => profile[f]?.trim()).length;
  const filledCount = 1 + filledBasic + (experience.length > 0 ? 1 : 0) + (education.length > 0 ? 1 : 0);
  const totalFields = 9;
  const completionPct = Math.round((filledCount / totalFields) * 100);

  // ── Basic profile save ─────────────────────────────────────────────────────
  const handleChange = (field) => (e) => {
    setSaveSuccess(false);
    setSaveError("");
    setProfile((p) => ({ ...p, [field]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");
    const result = await saveProfile(getToken(), profile);
    setSaving(false);
    if (!result.success) setSaveError(result.error?.message ?? "Failed to save profile");
    else setSaveSuccess(true);
  };

  // ── Experience handlers ────────────────────────────────────────────────────
  const openAddExp = () => {
    setEditingExp(null);
    setExpForm(EMPTY_EXP);
    setExpError("");
    setShowExpForm(true);
  };

  const openEditExp = (entry) => {
    setEditingExp(entry);
    setExpForm({
      jobTitle:        entry.jobTitle || "",
      company:         entry.company || "",
      location:        entry.location || "",
      startDate:       toMonthInput(entry.startDate),
      endDate:         toMonthInput(entry.endDate),
      isCurrent:       entry.isCurrent || false,
      description:     entry.description || "",
      accomplishments: (entry.accomplishments || []).join("\n"),
    });
    setExpError("");
    setShowExpForm(true);
  };

  const cancelExpForm = () => { setShowExpForm(false); setEditingExp(null); setExpError(""); };
  const setEF = (field) => (e) => setExpForm((f) => ({ ...f, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));

  const handleExpSave = async (e) => {
    e.preventDefault();
    if (!expForm.jobTitle.trim() || !expForm.company.trim() || !expForm.startDate) {
      setExpError("Job title, company, and start date are required.");
      return;
    }
    setExpLoading(true);
    setExpError("");
    const payload = {
      jobTitle:        expForm.jobTitle.trim(),
      company:         expForm.company.trim(),
      location:        expForm.location.trim(),
      startDate:       expForm.startDate ? new Date(expForm.startDate + "-01") : null,
      endDate:         (!expForm.isCurrent && expForm.endDate) ? new Date(expForm.endDate + "-01") : null,
      isCurrent:       expForm.isCurrent,
      description:     expForm.description.trim(),
      accomplishments: expForm.accomplishments.split("\n").map((s) => s.trim()).filter(Boolean),
    };
    const result = editingExp
      ? await updateExperience(getToken(), editingExp._id, payload)
      : await addExperience(getToken(), payload);
    setExpLoading(false);
    if (!result.success) { setExpError(result.error?.message || "Failed to save experience"); return; }
    setExp(result.data.experience || []);
    cancelExpForm();
  };

  const handleExpDelete = async (entryId) => {
    if (!window.confirm("Delete this experience entry?")) return;
    setExpLoading(true);
    const result = await deleteExperience(getToken(), entryId);
    setExpLoading(false);
    if (!result.success) { setExpError(result.error?.message || "Failed to delete experience"); return; }
    setExp(result.data.experience || []);
  };

  const handleExpMove = async (index, direction) => {
    const next = [...experience];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setExp(next);
    const result = await reorderExperience(getToken(), next.map((e) => e._id));
    if (!result.success) setExpError(result.error?.message || "Failed to reorder experience");
  };

  // ── Education handlers ─────────────────────────────────────────────────────
  const openAddEdu = () => {
    setEditingEdu(null);
    setEduForm(EMPTY_EDU);
    setEduError("");
    setShowEduForm(true);
  };

  const openEditEdu = (entry) => {
    setEditingEdu(entry);
    setEduForm({
      institution:  entry.institution || "",
      degree:       entry.degree || "",
      fieldOfStudy: entry.fieldOfStudy || "",
      startDate:    toMonthInput(entry.startDate),
      endDate:      toMonthInput(entry.endDate),
      gpa:          entry.gpa || "",
      honors:       entry.honors || "",
    });
    setEduError("");
    setShowEduForm(true);
  };

  const cancelEduForm = () => { setShowEduForm(false); setEditingEdu(null); setEduError(""); };
  const setDF = (field) => (e) => setEduForm((f) => ({ ...f, [field]: e.target.value }));

  const handleEduSave = async (e) => {
    e.preventDefault();
    if (!eduForm.institution.trim() || !eduForm.degree.trim() || !eduForm.fieldOfStudy.trim() || !eduForm.startDate) {
      setEduError("Institution, degree, field of study, and start date are required.");
      return;
    }
    setEduLoading(true);
    setEduError("");
    const payload = {
      institution:  eduForm.institution.trim(),
      degree:       eduForm.degree.trim(),
      fieldOfStudy: eduForm.fieldOfStudy.trim(),
      startDate:    eduForm.startDate ? new Date(eduForm.startDate + "-01") : null,
      endDate:      eduForm.endDate ? new Date(eduForm.endDate + "-01") : null,
      gpa:          eduForm.gpa.trim(),
      honors:       eduForm.honors.trim(),
    };
    const result = editingEdu
      ? await updateEducation(getToken(), editingEdu._id, payload)
      : await addEducation(getToken(), payload);
    setEduLoading(false);
    if (!result.success) { setEduError(result.error?.message || "Failed to save education"); return; }
    setEdu(result.data.education || []);
    cancelEduForm();
  };

  const handleEduDelete = async (entryId) => {
    if (!window.confirm("Delete this education entry?")) return;
    setEduLoading(true);
    const result = await deleteEducation(getToken(), entryId);
    setEduLoading(false);
    if (!result.success) { setEduError(result.error?.message || "Failed to delete education"); return; }
    setEdu(result.data.education || []);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <>
        <div className="page-header">
          <h2>Profile</h2>
          <p>Your professional information used across applications.</p>
        </div>
        <div className="loading-container">
          <div className="spinner-large" />
          <p>Loading profile...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="page-header">
        <h2>Profile</h2>
        <p>Your professional information used across applications.</p>
      </div>

      {/* ── Completion indicator ─────────────────────────────────────────── */}
      <div className="profile-completion-card">
        <div className="profile-completion-header">
          <span className="profile-completion-label">Profile completeness</span>
          <span className="profile-completion-pct">{completionPct}%</span>
        </div>
        <div className="profile-completion-track">
          <div className="profile-completion-bar" style={{ width: `${completionPct}%` }} />
        </div>
      </div>

      {/* ── Basic profile form ───────────────────────────────────────────── */}
      <form onSubmit={handleSave}>
        {saveSuccess && (
          <div className="alert alert-success" style={{ marginBottom: 20 }}>
            <div className="alert-icon">✓</div>
            <div className="alert-content"><p>Profile saved.</p></div>
          </div>
        )}
        {saveError && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <div className="alert-icon">✗</div>
            <div className="alert-content"><p>{saveError}</p></div>
          </div>
        )}

        <section className="settings-section">
          <h3 className="settings-section-title">Identity &amp; Contact</h3>
          <div className="settings-card">
            <div className="profile-field-row">
              <div className="form-group">
                <label htmlFor="firstName">First name</label>
                <input id="firstName" type="text" value={profile.firstName} onChange={handleChange("firstName")} placeholder="Jane" />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last name</label>
                <input id="lastName" type="text" value={profile.lastName} onChange={handleChange("lastName")} placeholder="Smith" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input id="email" type="email" value={user?.email ?? ""} disabled className="input-disabled" aria-label="Email address (read only)" />
            </div>
            <div className="profile-field-row">
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input id="phone" type="tel" value={profile.phone} onChange={handleChange("phone")} placeholder="+1 (555) 000-0000" />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input id="location" type="text" value={profile.location} onChange={handleChange("location")} placeholder="City, State" />
              </div>
            </div>
          </div>
        </section>

        <section className="settings-section">
          <h3 className="settings-section-title">Professional Summary</h3>
          <div className="settings-card">
            <div className="form-group">
              <label htmlFor="headline">Headline</label>
              <input id="headline" type="text" value={profile.headline} onChange={handleChange("headline")} placeholder="e.g. Full Stack Engineer · Open to work" />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="summary">Summary</label>
              <textarea id="summary" value={profile.summary} onChange={handleChange("summary")} rows={5} placeholder="A short paragraph about your experience, skills, and goals..." />
            </div>
          </div>
        </section>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="spinner">Saving...</span> : "Save profile"}
        </button>
      </form>

      {/* ── Experience section ───────────────────────────────────────────── */}
      <section className="settings-section" style={{ marginTop: 32 }}>
        <div className="profile-section-header">
          <h3 className="settings-section-title" style={{ margin: 0 }}>Work Experience</h3>
          {!showExpForm && (
            <button className="btn-profile-add" onClick={openAddExp} disabled={expLoading}>+ Add</button>
          )}
        </div>

        {expError && <p className="profile-section-error">{expError}</p>}

        {experience.length === 0 && !showExpForm && (
          <p className="profile-empty-hint">No work experience added yet.</p>
        )}

        {experience.map((entry, idx) => (
          <div key={entry._id} className="profile-entry-card">
            <div className="profile-entry-header">
              <div className="profile-entry-title-block">
                <span className="profile-entry-title">{entry.jobTitle}</span>
                <span className="profile-entry-subtitle">{entry.company}{entry.location ? ` · ${entry.location}` : ""}</span>
                <span className="profile-entry-dates">
                  {formatMonthYear(entry.startDate)} – {entry.isCurrent ? "Present" : formatMonthYear(entry.endDate)}
                </span>
              </div>
              <div className="profile-entry-controls">
                <button className="btn-entry-move" onClick={() => handleExpMove(idx, -1)} disabled={idx === 0 || expLoading} title="Move up">▲</button>
                <button className="btn-entry-move" onClick={() => handleExpMove(idx, 1)} disabled={idx === experience.length - 1 || expLoading} title="Move down">▼</button>
                <button className="btn-entry-edit" onClick={() => openEditExp(entry)} disabled={expLoading}>Edit</button>
                <button className="btn-entry-delete" onClick={() => handleExpDelete(entry._id)} disabled={expLoading}>Delete</button>
              </div>
            </div>
            {entry.description && <p className="profile-entry-description">{entry.description}</p>}
            {entry.accomplishments?.length > 0 && (
              <ul className="profile-entry-accomplishments">
                {entry.accomplishments.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            )}
          </div>
        ))}

        {showExpForm && (
          <form className="profile-entry-form" onSubmit={handleExpSave}>
            <h4 className="profile-entry-form-title">{editingExp ? "Edit Experience" : "Add Experience"}</h4>
            <div className="profile-field-row">
              <div className="form-group">
                <label>Job Title *</label>
                <input type="text" value={expForm.jobTitle} onChange={setEF("jobTitle")} placeholder="e.g. Software Engineer" disabled={expLoading} />
              </div>
              <div className="form-group">
                <label>Company *</label>
                <input type="text" value={expForm.company} onChange={setEF("company")} placeholder="e.g. Acme Corp" disabled={expLoading} />
              </div>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" value={expForm.location} onChange={setEF("location")} placeholder="e.g. Remote" disabled={expLoading} />
            </div>
            <div className="profile-field-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input type="month" value={expForm.startDate} onChange={setEF("startDate")} disabled={expLoading} />
              </div>
              {!expForm.isCurrent && (
                <div className="form-group">
                  <label>End Date</label>
                  <input type="month" value={expForm.endDate} onChange={setEF("endDate")} disabled={expLoading} />
                </div>
              )}
            </div>
            <div className="form-group profile-checkbox-group">
              <label className="profile-checkbox-label">
                <input type="checkbox" checked={expForm.isCurrent} onChange={setEF("isCurrent")} disabled={expLoading} />
                Currently working here
              </label>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={expForm.description} onChange={setEF("description")} rows={3} placeholder="Brief description of your role..." disabled={expLoading} />
            </div>
            <div className="form-group">
              <label>Accomplishments <span className="profile-hint-text">(one per line)</span></label>
              <textarea value={expForm.accomplishments} onChange={setEF("accomplishments")} rows={3} placeholder="Shipped feature X that increased conversions by 20%&#10;Led migration to React 19" disabled={expLoading} />
            </div>
            {expError && <p className="profile-section-error">{expError}</p>}
            <div className="profile-form-actions">
              <button type="button" className="btn-form-cancel" onClick={cancelExpForm} disabled={expLoading}>Cancel</button>
              <button type="submit" className="btn-form-save" disabled={expLoading}>{expLoading ? "Saving…" : editingExp ? "Update" : "Add Experience"}</button>
            </div>
          </form>
        )}
      </section>

      {/* ── Education section ────────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="profile-section-header">
          <h3 className="settings-section-title" style={{ margin: 0 }}>Education</h3>
          {!showEduForm && (
            <button className="btn-profile-add" onClick={openAddEdu} disabled={eduLoading}>+ Add</button>
          )}
        </div>

        {eduError && <p className="profile-section-error">{eduError}</p>}

        {education.length === 0 && !showEduForm && (
          <p className="profile-empty-hint">No education entries added yet.</p>
        )}

        {education.map((entry) => (
          <div key={entry._id} className="profile-entry-card">
            <div className="profile-entry-header">
              <div className="profile-entry-title-block">
                <span className="profile-entry-title">{entry.institution}</span>
                <span className="profile-entry-subtitle">{entry.degree}, {entry.fieldOfStudy}</span>
                <span className="profile-entry-dates">
                  {formatMonthYear(entry.startDate)}{entry.endDate ? ` – ${formatMonthYear(entry.endDate)}` : ""}
                  {entry.gpa ? ` · GPA: ${entry.gpa}` : ""}
                  {entry.honors ? ` · ${entry.honors}` : ""}
                </span>
              </div>
              <div className="profile-entry-controls">
                <button className="btn-entry-edit" onClick={() => openEditEdu(entry)} disabled={eduLoading}>Edit</button>
                <button className="btn-entry-delete" onClick={() => handleEduDelete(entry._id)} disabled={eduLoading}>Delete</button>
              </div>
            </div>
          </div>
        ))}

        {showEduForm && (
          <form className="profile-entry-form" onSubmit={handleEduSave}>
            <h4 className="profile-entry-form-title">{editingEdu ? "Edit Education" : "Add Education"}</h4>
            <div className="form-group">
              <label>Institution *</label>
              <input type="text" value={eduForm.institution} onChange={setDF("institution")} placeholder="e.g. State University" disabled={eduLoading} />
            </div>
            <div className="profile-field-row">
              <div className="form-group">
                <label>Degree *</label>
                <input type="text" value={eduForm.degree} onChange={setDF("degree")} placeholder="e.g. Bachelor of Science" disabled={eduLoading} />
              </div>
              <div className="form-group">
                <label>Field of Study *</label>
                <input type="text" value={eduForm.fieldOfStudy} onChange={setDF("fieldOfStudy")} placeholder="e.g. Computer Science" disabled={eduLoading} />
              </div>
            </div>
            <div className="profile-field-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input type="month" value={eduForm.startDate} onChange={setDF("startDate")} disabled={eduLoading} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="month" value={eduForm.endDate} onChange={setDF("endDate")} disabled={eduLoading} />
              </div>
            </div>
            <div className="profile-field-row">
              <div className="form-group">
                <label>GPA</label>
                <input type="text" value={eduForm.gpa} onChange={setDF("gpa")} placeholder="e.g. 3.8" disabled={eduLoading} />
              </div>
              <div className="form-group">
                <label>Honors</label>
                <input type="text" value={eduForm.honors} onChange={setDF("honors")} placeholder="e.g. Cum Laude" disabled={eduLoading} />
              </div>
            </div>
            {eduError && <p className="profile-section-error">{eduError}</p>}
            <div className="profile-form-actions">
              <button type="button" className="btn-form-cancel" onClick={cancelEduForm} disabled={eduLoading}>Cancel</button>
              <button type="submit" className="btn-form-save" disabled={eduLoading}>{eduLoading ? "Saving…" : editingEdu ? "Update" : "Add Education"}</button>
            </div>
          </form>
        )}
      </section>
    </>
  );
}
