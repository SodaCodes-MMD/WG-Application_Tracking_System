import { useState } from "react";
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
  const storageKey = `profile_${user?.email ?? "guest"}`;

  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? { ...EMPTY_PROFILE, ...JSON.parse(saved) } : { ...EMPTY_PROFILE };
    } catch {
      return { ...EMPTY_PROFILE };
    }
  });

  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field) => (e) => {
    setSaveSuccess(false);
    setProfile((p) => ({ ...p, [field]: e.target.value }));
  };

  // Email always counts as 1 filled field; check the rest against PROFILE_FIELDS
  const filledCount = 1 + PROFILE_FIELDS.filter((f) => profile[f]?.trim()).length;
  const totalFields = 1 + PROFILE_FIELDS.length; // 7 total
  const completionPct = Math.round((filledCount / totalFields) * 100);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem(storageKey, JSON.stringify(profile));
    setSaveSuccess(true);
  };

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

        <button type="submit" className="btn btn-primary">
          Save profile
        </button>
      </form>
    </>
  );
}
