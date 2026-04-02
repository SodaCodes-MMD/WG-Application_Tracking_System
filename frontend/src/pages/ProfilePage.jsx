import { useState, useEffect } from "react";
import { getToken } from "../services/auth-service.js";
import { getProfile, saveProfile } from "../services/profile-api.js";
import "./AuthForms.css";

// Fields that contribute to completion (email always counts as filled)
const PROFILE_FIELDS = ["firstName", "lastName", "phone", "location", "headline", "summary"];

const EMPTY_PROFILE = {
  firstName: "",
  lastName: "",
  phone: "",
  location: "",
  headline: "",
  summary: "",
};

export default function ProfilePage({ user }) {
  const [profile, setProfile] = useState({ ...EMPTY_PROFILE });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const result = await getProfile(getToken());
      if (result.success && result.data) {
        setProfile({ ...EMPTY_PROFILE, ...result.data });
      }
      setLoading(false);
    };
    fetchProfile();
  }, []);

  const handleChange = (field) => (e) => {
    setSaveSuccess(false);
    setSaveError("");
    setProfile((p) => ({ ...p, [field]: e.target.value }));
  };

  // Email always counts as 1 filled field; check the rest against PROFILE_FIELDS
  const filledCount = 1 + PROFILE_FIELDS.filter((f) => profile[f]?.trim()).length;
  const totalFields = 1 + PROFILE_FIELDS.length; // 7 total
  const completionPct = Math.round((filledCount / totalFields) * 100);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError("");

    const result = await saveProfile(getToken(), profile);
    setSaving(false);

    if (!result.success) {
      setSaveError(result.error?.message ?? "Failed to save profile");
    } else {
      setSaveSuccess(true);
    }
  };

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

      {/* ── Completion indicator ──────────────────────────────────────────── */}
      <div className="profile-completion-card">
        <div className="profile-completion-header">
          <span className="profile-completion-label">Profile completeness</span>
          <span className="profile-completion-pct">{completionPct}%</span>
        </div>
        <div className="profile-completion-track">
          <div
            className="profile-completion-bar"
            style={{ width: `${completionPct}%` }}
          />
        </div>
      </div>

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

        {/* ── Identity & Contact ─────────────────────────────────────────── */}
        <section className="settings-section">
          <h3 className="settings-section-title">Identity &amp; Contact</h3>
          <div className="settings-card">
            <div className="profile-field-row">
              <div className="form-group">
                <label htmlFor="firstName">First name</label>
                <input
                  id="firstName"
                  type="text"
                  value={profile.firstName}
                  onChange={handleChange("firstName")}
                  placeholder="Jane"
                />
              </div>
              <div className="form-group">
                <label htmlFor="lastName">Last name</label>
                <input
                  id="lastName"
                  type="text"
                  value={profile.lastName}
                  onChange={handleChange("lastName")}
                  placeholder="Smith"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={user?.email ?? ""}
                disabled
                className="input-disabled"
                aria-label="Email address (read only)"
              />
            </div>

            <div className="profile-field-row">
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  id="phone"
                  type="tel"
                  value={profile.phone}
                  onChange={handleChange("phone")}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  id="location"
                  type="text"
                  value={profile.location}
                  onChange={handleChange("location")}
                  placeholder="City, State"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── Professional Summary ───────────────────────────────────────── */}
        <section className="settings-section">
          <h3 className="settings-section-title">Professional Summary</h3>
          <div className="settings-card">
            <div className="form-group">
              <label htmlFor="headline">Headline</label>
              <input
                id="headline"
                type="text"
                value={profile.headline}
                onChange={handleChange("headline")}
                placeholder="e.g. Full Stack Engineer · Open to work"
              />
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label htmlFor="summary">Summary</label>
              <textarea
                id="summary"
                value={profile.summary}
                onChange={handleChange("summary")}
                rows={5}
                placeholder="A short paragraph about your experience, skills, and goals..."
              />
            </div>
          </div>
        </section>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <span className="spinner">Saving...</span> : "Save profile"}
        </button>
      </form>
    </>
  );
}
