import { useState } from "react";
import { STATUS_COLORS, jobsApi } from "../services/jobs-api.js";
import "./JobCard.css";

const INTERVIEW_ROUNDS = ["Phone Screen", "Technical", "Behavioral", "System Design", "Final Round", "Other"];
const EMPTY_INTERVIEW = { roundType: "Phone Screen", date: "", interviewer: "", notes: "" };

function toDateInput(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? "" : dt.toISOString().split("T")[0];
}
<<<<<<< HEAD
// Scrum 37: added onSelect to props
export default function JobCard({ job, onEdit, onDelete, onSelect }) {
  const colors = STATUS_COLORS[job.status] || STATUS_COLORS["Wishlist"];
=======

export default function JobCard({ job, onEdit, onDelete, onArchive, onRestore, isArchived }) {
  const colors = isArchived ? { bg: "#f5f5f5", text: "#888888", border: "#cccccc" } : STATUS_COLORS[job.status] || STATUS_COLORS["Wishlist"];
>>>>>>> origin/main

  const appliedDate = job.appliedAt ? new Date(job.appliedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
  const createdDate = new Date(job.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const archivedDate = job.archivedAt ? new Date(job.archivedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
  const deadlineDate = job.deadline ? new Date(job.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
  const isPastDeadline = job.deadline && new Date(job.deadline) < new Date();

  const now = new Date();
  const daysUntilDeadline = job.deadline ? (new Date(job.deadline) - now) / 86400000 : null;
  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline >= 0 && daysUntilDeadline <= 7;
  const urgentDays = isUrgent ? Math.ceil(daysUntilDeadline) : 0;
  const daysSinceActivity = job.updatedAt ? (now - new Date(job.updatedAt)) / 86400000 : 0;
  const isStale = daysSinceActivity > 14 && !["Offer", "Rejected", "Withdrawn"].includes(job.status);

  const [interviewsOpen, setInterviewsOpen] = useState(false);
  const [interviews, setInterviews] = useState(job.interviews || []);
  const [showIForm, setShowIForm] = useState(false);
  const [editingIv, setEditingIv] = useState(null);
  const [iForm, setIForm] = useState(EMPTY_INTERVIEW);
  const [iLoading, setILoading] = useState(false);
  const [iError, setIError] = useState("");

  const openAddInterview = () => {
    setEditingIv(null);
    setIForm(EMPTY_INTERVIEW);
    setIError("");
    setShowIForm(true);
  };

  const openEditInterview = (iv) => {
    setEditingIv(iv);
    setIForm({ roundType: iv.roundType, date: toDateInput(iv.date), interviewer: iv.interviewer || "", notes: iv.notes || "" });
    setIError("");
    setShowIForm(true);
  };

  const cancelIForm = () => { setShowIForm(false); setEditingIv(null); setIError(""); };
  const setIF = (field) => (e) => setIForm(f => ({ ...f, [field]: e.target.value }));

  const handleISave = async (e) => {
    e.preventDefault();
    if (!iForm.roundType) { setIError("Round type is required"); return; }
    setILoading(true);
    setIError("");
    try {
      const payload = { roundType: iForm.roundType, date: iForm.date || null, interviewer: iForm.interviewer, notes: iForm.notes };
      const result = editingIv
        ? await jobsApi.updateInterview(job._id, editingIv._id, payload)
        : await jobsApi.addInterview(job._id, payload);
      setInterviews(result.data.interviews || []);
      cancelIForm();
    } catch (err) {
      setIError(err.message || "Failed to save interview");
    } finally {
      setILoading(false);
    }
  };

  const handleIDelete = async (ivId) => {
    if (!window.confirm("Delete this interview record?")) return;
    setILoading(true);
    setIError("");
    try {
      const result = await jobsApi.removeInterview(job._id, ivId);
      setInterviews(result.data.interviews || []);
    } catch (err) {
      setIError(err.message || "Failed to delete interview");
    } finally {
      setILoading(false);
    }
  };

  return (
    <div className={`job-card${isArchived ? " job-card--archived" : ""}${isStale ? " job-card-stale" : ""}`}>
      <div className="job-card-header">
        <div className="job-card-info">
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company}</p>
          {job.location && <p className="job-location">📍 {job.location}</p>}
        </div>
        <div className="job-card-badges">
          <span className="job-status-badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
            {isArchived ? "Archived" : job.status}
          </span>
          {isStale && !isArchived && <span className="job-stale-badge">Stale</span>}
        </div>
      </div>

      {isUrgent && !isArchived && (
        <div className="job-urgency-banner">
          ⚠ Deadline in {urgentDays} day{urgentDays === 1 ? "" : "s"}
        </div>
      )}

      <div className="job-card-meta">
        {job.salary && <span className="job-meta-item">💰 {job.salary}</span>}
        {job.url && <a className="job-meta-item job-link" href={job.url} target="_blank" rel="noopener noreferrer">🔗 Posting</a>}
        {isArchived && archivedDate && (
          <span className="job-meta-item job-date">📦 Archived {archivedDate}</span>
        )}
        {!isArchived && (
          <span className="job-meta-item job-date">{appliedDate ? `Applied ${appliedDate}` : `Added ${createdDate}`}</span>
        )}
      </div>

      {job.notes && <p className="job-notes">{job.notes}</p>}
      {deadlineDate && !isArchived && <p className={`job-deadline ${isPastDeadline ? "job-deadline-past" : ""}`}>📅 Deadline: {deadlineDate}{isPastDeadline ? " (past)" : ""}</p>}
      {job.recruiterNotes && !isArchived && <p className="job-recruiter-notes">{job.recruiterNotes}</p>}

      {!isArchived && (
        <>
          <div className="job-interviews-header" onClick={() => setInterviewsOpen(o => !o)}>
            <span>Interviews{interviews.length > 0 ? ` (${interviews.length})` : ""}</span>
            <span className="job-interviews-chevron">{interviewsOpen ? "▲" : "▼"}</span>
          </div>

          {interviewsOpen && (
            <div className="job-interviews-body">
              {interviews.length === 0 && !showIForm && (
                <p className="job-interviews-empty">No interviews logged yet.</p>
              )}

              {interviews.map(iv => (
                <div key={iv._id} className="job-interview-item">
                  <div className="job-interview-row">
                    <span className="job-interview-round">{iv.roundType}</span>
                    {iv.date && <span className="job-interview-date">{new Date(iv.date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>}
                    {iv.interviewer && <span className="job-interview-interviewer">with {iv.interviewer}</span>}
                    <div className="job-interview-actions">
                      <button className="btn-iv-edit" onClick={() => openEditInterview(iv)} disabled={iLoading}>Edit</button>
                      <button className="btn-iv-delete" onClick={() => handleIDelete(iv._id)} disabled={iLoading}>×</button>
                    </div>
                  </div>
                  {iv.notes && <p className="job-interview-notes">{iv.notes}</p>}
                </div>
              ))}

              {showIForm ? (
                <form className="job-interview-form" onSubmit={handleISave}>
                  <div className="jif-row">
                    <select value={iForm.roundType} onChange={setIF("roundType")} disabled={iLoading} className="jif-select">
                      {INTERVIEW_ROUNDS.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <input type="date" value={iForm.date} onChange={setIF("date")} disabled={iLoading} className="jif-date" />
                  </div>
                  <input type="text" value={iForm.interviewer} onChange={setIF("interviewer")} placeholder="Interviewer name (optional)" disabled={iLoading} className="jif-text" />
                  <textarea value={iForm.notes} onChange={setIF("notes")} placeholder="Notes..." rows={2} disabled={iLoading} className="jif-textarea" />
                  {iError && <p className="jif-error">{iError}</p>}
                  <div className="jif-actions">
                    <button type="button" className="btn-jif-cancel" onClick={cancelIForm} disabled={iLoading}>Cancel</button>
                    <button type="submit" className="btn-jif-save" disabled={iLoading}>{iLoading ? "Saving…" : editingIv ? "Update" : "Add"}</button>
                  </div>
                </form>
              ) : (
                <button className="btn-add-interview" onClick={openAddInterview} disabled={iLoading}>+ Add Interview</button>
              )}

              {iError && !showIForm && <p className="jif-error">{iError}</p>}
            </div>
          )}
        </>
      )}

      <div className="job-card-actions">
<<<<<<< HEAD
        {/* added a view button next to edit and delete, which opens the JobDetailPanel --- Scrum 37 */}
        <button className="btn-card-view" onClick={() => onSelect(job)}>View</button>
        <button className="btn-card-edit" onClick={() => onEdit(job)}>Edit</button>
        <button className="btn-card-delete" onClick={() => onDelete(job._id)}>Delete</button>
=======
        {!isArchived && (
          <>
            <button className="btn-card-edit" onClick={() => onEdit(job)}>Edit</button>
            <button className="btn-card-archive" onClick={() => onArchive(job._id)}>Archive</button>
          </>
        )}
        {isArchived && (
          <>
            <button className="btn-card-restore" onClick={() => onRestore(job._id)}>Restore</button>
            <button className="btn-card-delete" onClick={() => onDelete(job._id)}>Delete</button>
          </>
        )}
>>>>>>> origin/main
      </div>
    </div>
  );
}