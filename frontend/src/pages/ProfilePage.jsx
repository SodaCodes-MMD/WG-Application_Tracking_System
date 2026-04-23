import { useState, useEffect } from "react";
import { getToken } from "../services/auth-service.js";
import {
  getProfile, saveProfile,
  addExperience, updateExperience, deleteExperience, reorderExperience,
  addEducation, updateEducation, deleteEducation,
  addSkill, updateSkill, deleteSkill, reorderSkills,
  getPreferences, savePreferences,
} from "../services/profile-api.js";
import { MiniFlag, SectionSaveButton } from "../components/MiniFlag.jsx";
import "./AuthForms.css";
import "./ProfilePage.css";
import { calculateProfileCompletion } from "./profile-completion.js";

// ── Constants ────────────────────────────────────────────────────────────────

const BASIC_FIELDS = ["firstName", "lastName", "phone", "location", "headline", "summary"];
const EMPTY_PROFILE = { firstName: "", lastName: "", phone: "", location: "", headline: "", summary: "" };

const EMPTY_EXP   = { jobTitle: "", company: "", location: "", startDate: "", endDate: "", isCurrent: false, description: "", accomplishments: "" };
const EMPTY_EDU   = { institution: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", gpa: "", honors: "" };
const EMPTY_SKILL = { name: "", category: "", proficiency: "" };
const EMPTY_PREF  = { targetRoles: [], targetLocations: [], workMode: "Any", salaryMin: "", salaryMax: "", salaryCurrency: "USD", openToRelocation: false, notes: "" };

const PROFICIENCY_COLORS = { Beginner: "#6e7681", Intermediate: "#1a7fc1", Advanced: "#7c3aed", Expert: "#14a053" };
const WORK_MODES = ["Any", "Remote", "Hybrid", "On-site"];

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
  const [profile, setProfile]       = useState({ ...EMPTY_PROFILE });
  const [originalProfile, setOriginalProfile] = useState({ ...EMPTY_PROFILE });
  const [experience, setExp]        = useState([]);
  const [education, setEdu]         = useState([]);
  const [skills, setSkills]         = useState([]);
  const [prefs, setPrefs]           = useState({ ...EMPTY_PREF });
  const [originalPrefs, setOriginalPrefs]      = useState({ ...EMPTY_PREF });
  const [loading, setLoading]       = useState(true);

  const [savingBasic, setSavingBasic]       = useState(false);
  const [saveBasicError, setSaveBasicError] = useState("");
  const [dirtyBasic, setDirtyBasic]         = useState(false);

  const [savingExp, setSavingExp]       = useState(false);
  const [savedExp, setSavedExp]         = useState(false);
  const [saveExpError, setSaveExpError] = useState("");

  const [savingEdu, setSavingEdu]       = useState(false);
  const [savedEdu, setSavedEdu]         = useState(false);
  const [saveEduError, setSaveEduError] = useState("");

  const [savingSkill, setSavingSkill]       = useState(false);
  const [savedSkill, setSavedSkill]         = useState(false);
  const [saveSkillError, setSaveSkillError] = useState("");

  const [savingPref, setSavingPref]       = useState(false);
  const [savePrefError, setSavePrefError] = useState("");
  const [dirtyPref, setDirtyPref]         = useState(false);

  // Experience form state
  const [showExpForm, setShowExpForm]   = useState(false);
  const [editingExp, setEditingExp]     = useState(null);
  const [expForm, setExpForm]           = useState(EMPTY_EXP);

  // Education form state
  const [showEduForm, setShowEduForm]   = useState(false);
  const [editingEdu, setEditingEdu]     = useState(null);
  const [eduForm, setEduForm]           = useState(EMPTY_EDU);

  // Skills form state
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingSkill, setEditingSkill]   = useState(null);
  const [skillForm, setSkillForm]         = useState(EMPTY_SKILL);
  const [quickSkillName, setQuickSkillName] = useState("");

  // Career preferences state
  const [roleInput, setRoleInput]     = useState("");
  const [locInput, setLocInput]       = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      const token = getToken();
      const [profileResult, prefResult] = await Promise.all([
        getProfile(token),
        getPreferences(token),
      ]);
      if (profileResult.success && profileResult.data) {
        const profileData = { ...EMPTY_PROFILE, ...profileResult.data };
        setProfile(profileData);
        setOriginalProfile(profileData);
        setExp(profileResult.data.experience || []);
        setEdu(profileResult.data.education || []);
        setSkills(profileResult.data.skills || []);
      }
      if (prefResult.success && prefResult.data) {
        const d = prefResult.data;
        const prefsData = {
          targetRoles:      d.targetRoles      || [],
          targetLocations:  d.targetLocations  || [],
          workMode:         d.workMode         || "Any",
          salaryMin:        d.salaryMin        ?? "",
          salaryMax:        d.salaryMax        ?? "",
          salaryCurrency:   d.salaryCurrency   || "USD",
          openToRelocation: d.openToRelocation || false,
          notes:            d.notes            || "",
        };
        setPrefs(prefsData);
        setOriginalPrefs(prefsData);
      }
      setLoading(false);
    };
    fetchAll();
  }, []);

  const completionPct = calculateProfileCompletion({
    profile,
    experienceCount: experience.length,
    educationCount: education.length,
    skillsCount: skills.length,
    prefs,
  });

  const handleChange = (field) => (e) => {
    setSaveBasicError("");
    const newValue = e.target.value;
    setProfile((p) => {
      const updated = { ...p, [field]: newValue };
      setDirtyBasic(!isEqual(updated, originalProfile));
      return updated;
    });
  };

  function isEqual(a, b) {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  const handleSaveBasic = async (e) => {
    e?.preventDefault();
    setSavingBasic(true);
    setSaveBasicError("");
    const result = await saveProfile(getToken(), profile);
    setSavingBasic(false);
    if (!result.success) {
      setSaveBasicError(result.error?.message ?? "Failed to save profile");
    } else {
      setOriginalProfile(profile);
      setDirtyBasic(false);
    }
  };

  const openAddExp = () => {
    setEditingExp(null);
    setExpForm(EMPTY_EXP);
    setSaveExpError("");
    setSavedExp(false);
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
    setSaveExpError("");
    setSavedExp(false);
    setShowExpForm(true);
  };

  const cancelExpForm = () => { setShowExpForm(false); setEditingExp(null); setSaveExpError(""); };
  const setEF = (field) => (e) => { setSavedExp(false); setExpForm((f) => ({ ...f, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value })); };

  const handleExpSave = async (e) => {
    e.preventDefault();
    if (!expForm.jobTitle.trim() || !expForm.company.trim() || !expForm.startDate) {
      setSaveExpError("Job title, company, and start date are required.");
      return;
    }
    setSavingExp(true);
    setSaveExpError("");
    setSavedExp(false);
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
    setSavingExp(false);
    if (!result.success) { setSaveExpError(result.error?.message || "Failed to save experience"); return; }
    setExp(result.data.experience || []);
    setSavedExp(true);
    setShowExpForm(false);
    setEditingExp(null);
  };

  const handleExpDelete = async (entryId) => {
    if (!window.confirm("Delete this experience entry?")) return;
    setSavingExp(true);
    setSaveExpError("");
    const result = await deleteExperience(getToken(), entryId);
    setSavingExp(false);
    if (!result.success) { setSaveExpError(result.error?.message || "Failed to delete experience"); return; }
    setExp(result.data.experience || []);
  };

  const handleExpMove = async (index, direction) => {
    const next = [...experience];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setExp(next);
    const result = await reorderExperience(getToken(), next.map((e) => e._id));
    if (!result.success) setSaveExpError(result.error?.message || "Failed to reorder experience");
  };

  const openAddEdu = () => {
    setEditingEdu(null);
    setEduForm(EMPTY_EDU);
    setSaveEduError("");
    setSavedEdu(false);
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
    setSaveEduError("");
    setSavedEdu(false);
    setShowEduForm(true);
  };

  const cancelEduForm = () => { setShowEduForm(false); setEditingEdu(null); setSaveEduError(""); };
  const setDF = (field) => (e) => { setSavedEdu(false); setEduForm((f) => ({ ...f, [field]: e.target.value })); };

  const handleEduSave = async (e) => {
    e.preventDefault();
    if (!eduForm.institution.trim() || !eduForm.degree.trim() || !eduForm.fieldOfStudy.trim() || !eduForm.startDate) {
      setSaveEduError("Institution, degree, field of study, and start date are required.");
      return;
    }
    setSavingEdu(true);
    setSaveEduError("");
    setSavedEdu(false);
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
    setSavingEdu(false);
    if (!result.success) { setSaveEduError(result.error?.message || "Failed to save education"); return; }
    setEdu(result.data.education || []);
    setSavedEdu(true);
    setShowEduForm(false);
    setEditingEdu(null);
  };

  const handleEduDelete = async (entryId) => {
    if (!window.confirm("Delete this education entry?")) return;
    setSavingEdu(true);
    setSaveEduError("");
    const result = await deleteEducation(getToken(), entryId);
    setSavingEdu(false);
    if (!result.success) { setSaveEduError(result.error?.message || "Failed to delete education"); return; }
    setEdu(result.data.education || []);
  };

  const openAddSkill = () => {
    setEditingSkill(null);
    setSkillForm(EMPTY_SKILL);
    setSaveSkillError("");
    setSavedSkill(false);
    setShowSkillForm(true);
  };

  const openEditSkill = (entry) => {
    setEditingSkill(entry);
    setSkillForm({ name: entry.name || "", category: entry.category || "", proficiency: entry.proficiency || "" });
    setSaveSkillError("");
    setSavedSkill(false);
    setShowSkillForm(true);
  };

  const cancelSkillForm = () => { setShowSkillForm(false); setEditingSkill(null); setSaveSkillError(""); };
  const setSF = (field) => (e) => { setSavedSkill(false); setSkillForm((f) => ({ ...f, [field]: e.target.value })); };

  const handleSkillSave = async (e) => {
    e.preventDefault();
    if (!skillForm.name.trim()) { setSaveSkillError("Skill name is required."); return; }
    setSavingSkill(true);
    setSaveSkillError("");
    setSavedSkill(false);
    const payload = { name: skillForm.name.trim(), category: skillForm.category.trim(), proficiency: skillForm.proficiency };
    const result = editingSkill
      ? await updateSkill(getToken(), editingSkill._id, payload)
      : await addSkill(getToken(), payload);
    setSavingSkill(false);
    if (!result.success) { setSaveSkillError(result.error?.message || "Failed to save skill"); return; }
    setSkills(result.data.skills || []);
    setSavedSkill(true);
    setShowSkillForm(false);
    setEditingSkill(null);
  };

  const handleSkillDelete = async (skillId) => {
    if (!window.confirm("Delete this skill?")) return;
    setSavingSkill(true);
    setSaveSkillError("");
    const result = await deleteSkill(getToken(), skillId);
    setSavingSkill(false);
    if (!result.success) { setSaveSkillError(result.error?.message || "Failed to delete skill"); return; }
    setSkills(result.data.skills || []);
  };

  const handleSkillMove = async (index, direction) => {
    const next = [...skills];
    const swap = index + direction;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    setSkills(next);
    const result = await reorderSkills(getToken(), next.map((s) => s._id));
    if (!result.success) setSaveSkillError(result.error?.message || "Failed to reorder skills");
  };

  const addTag = (field, inputVal, setInput) => {
    const val = inputVal.trim();
    if (!val) return;
    setPrefs((p) => {
      const updated = { ...p, [field]: [...p[field], val] };
      setDirtyPref(!isEqual(updated, originalPrefs));
      return updated;
    });
    setSavePrefError("");
    setInput("");
  };

  const removeTag = (field, index) => {
    setPrefs((p) => {
      const updated = { ...p, [field]: p[field].filter((_, i) => i !== index) };
      setDirtyPref(!isEqual(updated, originalPrefs));
      return updated;
    });
    setSavePrefError("");
  };

  const setPF = (field) => (e) => {
    setPrefs((p) => {
      const updated = { ...p, [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value };
      setDirtyPref(!isEqual(updated, originalPrefs));
      return updated;
    });
    setSavePrefError("");
  };

  const handleSavePrefs = async (e) => {
    e.preventDefault();
    setSavingPref(true);
    setSavePrefError("");
    const payload = {
      ...prefs,
      salaryMin: prefs.salaryMin !== "" ? Number(prefs.salaryMin) : null,
      salaryMax: prefs.salaryMax !== "" ? Number(prefs.salaryMax) : null,
    };
    const result = await savePreferences(getToken(), payload);
    setSavingPref(false);
    if (!result.success) { setSavePrefError(result.error?.message || "Failed to save preferences"); return; }
    setOriginalPrefs(prefs);
    setDirtyPref(false);
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

        <h3 className="settings-section-title" style={{ marginTop: 24 }}>Professional Summary</h3>
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

        {saveBasicError && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>
            <div className="alert-icon">✗</div>
            <div className="alert-content"><p>{saveBasicError}</p></div>
          </div>
        )}
        <div className="profile-section-footer">
          <SectionSaveButton
            mood={savingBasic ? "saving" : dirtyBasic ? "unsaved" : "saved"}
            onClick={handleSaveBasic}
            disabled={savingBasic}
          >
            {savingBasic ? "Saving..." : dirtyBasic ? "Save Changes" : "Save"}
          </SectionSaveButton>
        </div>
      </section>

      {/* ── Experience section ───────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="profile-section-header">
          <h3 className="settings-section-title" style={{ margin: 0 }}>Work Experience</h3>
          {!showExpForm && (
            <button className="btn-profile-add" onClick={openAddExp} disabled={savingExp}>+ Add</button>
          )}
        </div>

        {saveExpError && <p className="profile-section-error">{saveExpError}</p>}
        {savedExp && !showExpForm && <p className="profile-section-success">Experience saved successfully.</p>}

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
                <button className="btn-entry-move" onClick={() => handleExpMove(idx, -1)} disabled={idx === 0 || savingExp} title="Move up">▲</button>
                <button className="btn-entry-move" onClick={() => handleExpMove(idx, 1)} disabled={idx === experience.length - 1 || savingExp} title="Move down">▼</button>
                <button className="btn-entry-edit" onClick={() => openEditExp(entry)} disabled={savingExp}>Edit</button>
                <button className="btn-entry-delete" onClick={() => handleExpDelete(entry._id)} disabled={savingExp}>Delete</button>
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
                <input type="text" value={expForm.jobTitle} onChange={setEF("jobTitle")} placeholder="e.g. Software Engineer" disabled={savingExp} />
              </div>
              <div className="form-group">
                <label>Company *</label>
                <input type="text" value={expForm.company} onChange={setEF("company")} placeholder="e.g. Acme Corp" disabled={savingExp} />
              </div>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" value={expForm.location} onChange={setEF("location")} placeholder="e.g. Remote" disabled={savingExp} />
            </div>
            <div className="profile-field-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input type="month" value={expForm.startDate} onChange={setEF("startDate")} disabled={savingExp} />
              </div>
              {!expForm.isCurrent && (
                <div className="form-group">
                  <label>End Date</label>
                  <input type="month" value={expForm.endDate} onChange={setEF("endDate")} disabled={savingExp} />
                </div>
              )}
            </div>
            <div className="form-group profile-checkbox-group">
              <label className="profile-checkbox-label">
                <input type="checkbox" checked={expForm.isCurrent} onChange={setEF("isCurrent")} disabled={savingExp} />
                Currently working here
              </label>
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={expForm.description} onChange={setEF("description")} rows={3} placeholder="Brief description of your role..." disabled={savingExp} />
            </div>
            <div className="form-group">
              <label>Accomplishments <span className="profile-hint-text">(one per line)</span></label>
              <textarea value={expForm.accomplishments} onChange={setEF("accomplishments")} rows={3} placeholder="Shipped feature X that increased conversions by 20%&#10;Led migration to React 19" disabled={savingExp} />
            </div>
            {saveExpError && <p className="profile-section-error">{saveExpError}</p>}
            <div className="profile-form-actions">
              <button type="button" className="btn-form-cancel" onClick={cancelExpForm} disabled={savingExp}>Cancel</button>
              <button type="submit" className="btn-form-save" disabled={savingExp}>{savingExp ? "Saving…" : editingExp ? "Update" : "Add Experience"}</button>
            </div>
          </form>
        )}
      </section>

      {/* ── Education section ────────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="profile-section-header">
          <h3 className="settings-section-title" style={{ margin: 0 }}>Education</h3>
          {!showEduForm && (
            <button className="btn-profile-add" onClick={openAddEdu} disabled={savingEdu}>+ Add</button>
          )}
        </div>

        {saveEduError && <p className="profile-section-error">{saveEduError}</p>}
        {savedEdu && !showEduForm && <p className="profile-section-success">Education saved successfully.</p>}

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
                <button className="btn-entry-edit" onClick={() => openEditEdu(entry)} disabled={savingEdu}>Edit</button>
                <button className="btn-entry-delete" onClick={() => handleEduDelete(entry._id)} disabled={savingEdu}>Delete</button>
              </div>
            </div>
          </div>
        ))}

        {showEduForm && (
          <form className="profile-entry-form" onSubmit={handleEduSave}>
            <h4 className="profile-entry-form-title">{editingEdu ? "Edit Education" : "Add Education"}</h4>
            <div className="form-group">
              <label>Institution *</label>
              <input type="text" value={eduForm.institution} onChange={setDF("institution")} placeholder="e.g. State University" disabled={savingEdu} />
            </div>
            <div className="profile-field-row">
              <div className="form-group">
                <label>Degree *</label>
                <input type="text" value={eduForm.degree} onChange={setDF("degree")} placeholder="e.g. Bachelor of Science" disabled={savingEdu} />
              </div>
              <div className="form-group">
                <label>Field of Study *</label>
                <input type="text" value={eduForm.fieldOfStudy} onChange={setDF("fieldOfStudy")} placeholder="e.g. Computer Science" disabled={savingEdu} />
              </div>
            </div>
            <div className="profile-field-row">
              <div className="form-group">
                <label>Start Date *</label>
                <input type="month" value={eduForm.startDate} onChange={setDF("startDate")} disabled={savingEdu} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input type="month" value={eduForm.endDate} onChange={setDF("endDate")} disabled={savingEdu} />
              </div>
            </div>
            <div className="profile-field-row">
              <div className="form-group">
                <label>GPA</label>
                <input type="text" value={eduForm.gpa} onChange={setDF("gpa")} placeholder="e.g. 3.8" disabled={savingEdu} />
              </div>
              <div className="form-group">
                <label>Honors</label>
                <input type="text" value={eduForm.honors} onChange={setDF("honors")} placeholder="e.g. Cum Laude" disabled={savingEdu} />
              </div>
            </div>
            {saveEduError && <p className="profile-section-error">{saveEduError}</p>}
            <div className="profile-form-actions">
              <button type="button" className="btn-form-cancel" onClick={cancelEduForm} disabled={savingEdu}>Cancel</button>
              <button type="submit" className="btn-form-save" disabled={savingEdu}>{savingEdu ? "Saving…" : editingEdu ? "Update" : "Add Education"}</button>
            </div>
          </form>
        )}
      </section>

      {/* ── Skills section ───────────────────────────────────────────────── */}
      <section className="settings-section">
        <div className="profile-section-header">
          <h3 className="settings-section-title" style={{ margin: 0 }}>Skills</h3>
          {!showSkillForm && (
            <button className="btn-profile-add" onClick={openAddSkill} disabled={savingSkill}>+ Add</button>
          )}
        </div>

        {saveSkillError && <p className="profile-section-error">{saveSkillError}</p>}
        {savedSkill && !showSkillForm && <p className="profile-section-success">Skill saved successfully.</p>}

        {/* Quick-add input */}
        {!showSkillForm && (
          <div className="form-group" style={{ marginBottom: 12 }}>
            <input
              type="text"
              value={quickSkillName}
              onChange={(e) => { setQuickSkillName(e.target.value); setSavedSkill(false); setSaveSkillError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("quickSkill", quickSkillName, setQuickSkillName); } }}
              placeholder="Quick add — type a skill name and press Enter"
              disabled={savingSkill}
            />
          </div>
        )}

        {skills.length === 0 && !showSkillForm && (
          <p className="profile-empty-hint">No skills added yet.</p>
        )}

        {skills.map((entry, idx) => (
          <div key={entry._id} className="profile-entry-card">
            <div className="profile-entry-header">
              <div className="profile-entry-title-block">
                <span className="profile-entry-title">{entry.name}</span>
                {entry.category && (
                  <span className="profile-entry-subtitle">{entry.category}</span>
                )}
                {entry.proficiency && (
                  <span
                    className="profile-entry-dates"
                    style={{ color: PROFICIENCY_COLORS[entry.proficiency] || "#6e7681", fontWeight: 500 }}
                  >
                    {entry.proficiency}
                  </span>
                )}
              </div>
              <div className="profile-entry-controls">
                <button className="btn-entry-move" onClick={() => handleSkillMove(idx, -1)} disabled={idx === 0 || savingSkill} title="Move up">▲</button>
                <button className="btn-entry-move" onClick={() => handleSkillMove(idx, 1)} disabled={idx === skills.length - 1 || savingSkill} title="Move down">▼</button>
                <button className="btn-entry-edit" onClick={() => openEditSkill(entry)} disabled={savingSkill}>Edit</button>
                <button className="btn-entry-delete" onClick={() => handleSkillDelete(entry._id)} disabled={savingSkill}>Delete</button>
              </div>
            </div>
          </div>
        ))}

        {showSkillForm && (
          <form className="profile-entry-form" onSubmit={handleSkillSave}>
            <h4 className="profile-entry-form-title">{editingSkill ? "Edit Skill" : "Add Skill"}</h4>
            <div className="profile-field-row">
              <div className="form-group">
                <label>Skill Name *</label>
                <input type="text" value={skillForm.name} onChange={setSF("name")} placeholder="e.g. TypeScript" disabled={savingSkill} />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input type="text" value={skillForm.category} onChange={setSF("category")} placeholder="e.g. Frontend" disabled={savingSkill} />
              </div>
            </div>
            <div className="form-group">
              <label>Proficiency</label>
              <select value={skillForm.proficiency} onChange={setSF("proficiency")} disabled={savingSkill}>
                <option value="">— select —</option>
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            {saveSkillError && <p className="profile-section-error">{saveSkillError}</p>}
            <div className="profile-form-actions">
              <button type="button" className="btn-form-cancel" onClick={cancelSkillForm} disabled={savingSkill}>Cancel</button>
              <button type="submit" className="btn-form-save" disabled={savingSkill}>{savingSkill ? "Saving…" : editingSkill ? "Update" : "Add Skill"}</button>
            </div>
          </form>
        )}
      </section>

      {/* ── Career Preferences section ───────────────────────────────────── */}
      <section className="settings-section">
        <h3 className="settings-section-title">Career Preferences</h3>
        <div className="settings-card">
          {/* Target Roles tag input */}
          <div className="form-group">
            <label>Target Roles</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
              {prefs.targetRoles.map((r, i) => (
                <span key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 4, padding: "2px 8px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4 }}>
                  {r}
                  <button type="button" onClick={() => removeTag("targetRoles", i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={roleInput}
              onChange={(e) => setRoleInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("targetRoles", roleInput, setRoleInput); } }}
              placeholder="Type a role and press Enter to add"
            />
          </div>

          {/* Target Locations tag input */}
          <div className="form-group">
            <label>Target Locations</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 6 }}>
              {prefs.targetLocations.map((l, i) => (
                <span key={i} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: 4, padding: "2px 8px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: 4 }}>
                  {l}
                  <button type="button" onClick={() => removeTag("targetLocations", i)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)", lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={locInput}
              onChange={(e) => setLocInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag("targetLocations", locInput, setLocInput); } }}
              placeholder="Type a location and press Enter to add"
            />
          </div>

          {/* Work Mode */}
          <div className="form-group">
            <label>Work Mode</label>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
              {WORK_MODES.map((mode) => (
                <label key={mode} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: "normal", cursor: "pointer", fontSize: "0.875rem" }}>
                  <input type="radio" name="workMode" value={mode} checked={prefs.workMode === mode} onChange={setPF("workMode")} />
                  {mode}
                </label>
              ))}
            </div>
          </div>

          {/* Salary Range */}
          <div className="profile-field-row">
            <div className="form-group">
              <label>Salary Min</label>
              <input type="number" value={prefs.salaryMin} onChange={setPF("salaryMin")} placeholder="e.g. 80000" min="0" />
            </div>
            <div className="form-group">
              <label>Salary Max</label>
              <input type="number" value={prefs.salaryMax} onChange={setPF("salaryMax")} placeholder="e.g. 120000" min="0" />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <input type="text" value={prefs.salaryCurrency} onChange={setPF("salaryCurrency")} placeholder="USD" maxLength={10} />
            </div>
          </div>

          {/* Open to Relocation */}
          <div className="form-group profile-checkbox-group">
            <label className="profile-checkbox-label">
              <input type="checkbox" checked={prefs.openToRelocation} onChange={setPF("openToRelocation")} />
              Open to relocation
            </label>
          </div>

          {/* Notes */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Notes</label>
            <textarea value={prefs.notes} onChange={setPF("notes")} rows={3} placeholder="Any other preferences or context for recruiters..." />
          </div>
        </div>

        {savePrefError && (
          <div className="alert alert-error" style={{ marginTop: 16 }}>
            <div className="alert-icon">✗</div>
            <div className="alert-content"><p>{savePrefError}</p></div>
          </div>
        )}
        <div className="profile-section-footer">
          <SectionSaveButton
            mood={savingPref ? "saving" : dirtyPref ? "unsaved" : "saved"}
            onClick={handleSavePrefs}
            disabled={savingPref}
          >
            {savingPref ? "Saving..." : dirtyPref ? "Save Changes" : "Save"}
          </SectionSaveButton>
        </div>
      </section>
    </>
  );
}
