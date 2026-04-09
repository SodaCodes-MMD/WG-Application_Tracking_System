import { JOB_STATUSES, STATUS_COLORS, OUTCOME_COLORS } from "../services/jobs-api.js";
import "./JobDetail.css";

function formatSalary(raw) {
  if (!raw) return null;
  return raw;
}

export default function JobDetail({ job, onClose, onEdit, onDelete, onStatusChange }) {
  const colors = STATUS_COLORS[job.status] || STATUS_COLORS["Wishlist"];
  const outcomeColors = job.outcome ? OUTCOME_COLORS[job.outcome] : null;
  const appliedDate = job.appliedAt
    ? new Date(job.appliedAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })
    : null;
  const createdDate = new Date(job.createdAt).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });

  return (
    <div className="jd-overlay" onClick={onClose}>
      <div className="jd-modal" onClick={e => e.stopPropagation()}>
        <div className="jd-header">
          <div className="jd-header-info">
            <h2 className="jd-title">{job.title}</h2>
            <p className="jd-company">{job.company}</p>
          </div>
          <button className="jd-close" onClick={onClose}>✕</button>
        </div>

        <div className="jd-stage-row">
          <label className="jd-label">Stage</label>
          <select
            className="jd-stage-select"
            style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}
            value={job.status}
            onChange={e => onStatusChange(job._id, e.target.value)}
          >
            {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {outcomeColors && (
            <span className="jd-outcome-badge" style={{ background: outcomeColors.bg, color: outcomeColors.text, border: `1px solid ${outcomeColors.border}` }}>
              {job.outcome}
            </span>
          )}
        </div>

        <div className="jd-body">
          {job.location && (
            <div className="jd-field">
              <span className="jd-field-label">Location</span>
              <span className="jd-field-value">📍 {job.location}</span>
            </div>
          )}
          {job.salary && (
            <div className="jd-field">
              <span className="jd-field-label">Salary</span>
              <span className="jd-field-value">💰 {job.salary}</span>
            </div>
          )}
          {job.url && (
            <div className="jd-field">
              <span className="jd-field-label">Posting</span>
              <a className="jd-link" href={job.url} target="_blank" rel="noopener noreferrer">🔗 View posting</a>
            </div>
          )}
          <div className="jd-field">
            <span className="jd-field-label">{appliedDate ? "Applied" : "Added"}</span>
            <span className="jd-field-value">{appliedDate || createdDate}</span>
          </div>
          {job.notes && (
            <div className="jd-field jd-field-block">
              <span className="jd-field-label">Notes</span>
              <p className="jd-notes">{job.notes}</p>
            </div>
          )}
          {job.outcome && (
            <div className="jd-field jd-field-block">
              <span className="jd-field-label">Outcome notes</span>
              <p className="jd-outcome-notes">{job.outcomeNotes || "—"}</p>
            </div>
          )}
        </div>

        <div className="jd-footer">
          <button className="btn-jd-edit" onClick={() => { onClose(); onEdit(job); }}>Edit</button>
          <button className="btn-jd-delete" onClick={() => { onClose(); onDelete(job._id); }}>Delete</button>
        </div>
      </div>
    </div>
  );
}
