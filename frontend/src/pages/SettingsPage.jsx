import { useState, useContext } from "react";
import { isStrongPassword, changePassword } from "../services/auth-service.js";
import { ThemeContext } from "../context/ThemeContext.jsx";
import "./AuthForms.css";

export default function SettingsPage() {
  const [user] = useState(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  });

  // ── Change password form ───────────────────────────────────────────────────
  const [currentPassword, setCurrentPassword]   = useState("");
  const [newPassword, setNewPassword]           = useState("");
  const [confirmPassword, setConfirmPassword]   = useState("");
  const [pwErrors, setPwErrors]                 = useState({});
  const [pwSuccess, setPwSuccess]               = useState("");
  const [pwLoading, setPwLoading]               = useState(false);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const { theme, toggleTheme } = useContext(ThemeContext);

  // ── Delete account modal ──────────────────────────────────────────────────
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  const validatePasswordForm = () => {
    const errors = {};
    if (!currentPassword) {
      errors.currentPassword = "Current password is required";
    }
    if (!newPassword) {
      errors.newPassword = "New password is required";
    } else if (!isStrongPassword(newPassword)) {
      errors.newPassword = "Must be at least 8 characters and include a special character";
    }
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }
    return errors;
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwSuccess("");

    const errors = validatePasswordForm();
    setPwErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPwLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setPwLoading(false);

    if (!result.success) {
      setPwErrors({ currentPassword: result.error?.message ?? "Failed to change password" });
    } else {
      setPwSuccess("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <div className="page-header">
        <h2>Settings</h2>
        <p>Manage your account and application preferences.</p>
      </div>

      {/* ── Account ────────────────────────────────────────────────────────── */}
      <section className="settings-section">
        <h3 className="settings-section-title">Account</h3>

        {/* Email display */}
        <div className="settings-card">
          <p className="settings-card-title">Email address</p>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <input
              type="email"
              value={user?.email ?? ""}
              disabled
              className="input-disabled"
              aria-label="Email address (read only)"
            />
          </div>
        </div>

        {/* Change password */}
        <div className="settings-card">
          <p className="settings-card-title">Change password</p>

          {pwSuccess && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              <div className="alert-icon">✓</div>
              <div className="alert-content"><p>{pwSuccess}</p></div>
            </div>
          )}

          <form onSubmit={handleChangePassword} noValidate>
            <div className="form-group">
              <label htmlFor="current-password">Current password</label>
              <input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => { setCurrentPassword(e.target.value); setPwErrors({}); }}
                autoComplete="current-password"
                disabled={pwLoading}
                className={pwErrors.currentPassword ? "error" : ""}
              />
              {pwErrors.currentPassword && (
                <span className="error-message">{pwErrors.currentPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="new-password">New password</label>
              <input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => { setNewPassword(e.target.value); setPwErrors({}); }}
                autoComplete="new-password"
                disabled={pwLoading}
                className={pwErrors.newPassword ? "error" : ""}
              />
              {pwErrors.newPassword && (
                <span className="error-message">{pwErrors.newPassword}</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="confirm-password">Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setPwErrors({}); }}
                autoComplete="new-password"
                disabled={pwLoading}
                className={pwErrors.confirmPassword ? "error" : ""}
              />
              {pwErrors.confirmPassword && (
                <span className="error-message">{pwErrors.confirmPassword}</span>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary settings-submit"
              disabled={pwLoading}
            >
              {pwLoading ? <span className="spinner">Saving...</span> : "Update password"}
            </button>
          </form>
        </div>
      </section>

      {/* ── Preferences ────────────────────────────────────────────────────── */}
      <section className="settings-section">
        <h3 className="settings-section-title">Preferences</h3>

        <div className="settings-card">
          <div className="settings-row">
            <div>
              <p className="settings-card-title">Theme</p>
              <p className="settings-hint">Choose your preferred colour scheme</p>
            </div>
            <div className="theme-toggle">
              <button
                type="button"
                className={`theme-btn${theme === "light" ? " theme-btn-active" : ""}`}
                onClick={() => theme !== "light" && toggleTheme()}
              >
                Light
              </button>
              <button
                type="button"
                className={`theme-btn${theme === "dark" ? " theme-btn-active" : ""}`}
                onClick={() => theme !== "dark" && toggleTheme()}
              >
                Dark
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Danger zone ────────────────────────────────────────────────────── */}
      <section className="settings-section">
        <h3 className="settings-section-title settings-section-title--danger">Danger Zone</h3>

        <div className="settings-card settings-card--danger">
          <div className="settings-row">
            <div>
              <p className="settings-card-title">Delete account</p>
              <p className="settings-hint">
                Permanently remove your account and all associated data. This cannot be undone.
              </p>
            </div>
            <button
              type="button"
              className="btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              Delete account
            </button>
          </div>
        </div>
      </section>

      {/* ── Delete confirmation modal ───────────────────────────────────────── */}
      {showDeleteModal && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="modal-title" className="modal-title">Delete your account?</h3>
            <p className="modal-body">
              This will permanently delete your account and all data associated with it.
              There is no way to recover your account after this action.
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                disabled
                title="Backend not yet wired"
              >
                Yes, delete my account
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
