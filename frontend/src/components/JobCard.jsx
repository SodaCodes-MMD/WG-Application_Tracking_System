import { STATUS_COLORS, OUTCOME_COLORS } from "../services/jobs-api.js";
import "./JobCard.css";

function parseNum(str) {
  const n = parseFloat(str);
  return isNaN(n) ? null : /k$/i.test(str) ? n * 1000 : n;
}

function fmtNum(n) {
  return "$" + Math.round(n).toLocaleString();
}

function formatSalary(raw) {
  if (!raw) return null;
  const isHourly = /\b(hr|hour|hourly)\b/i.test(raw);
  const isYearly = /\b(yr|year|annual|annually)\b/i.test(raw);
  const suffix = isHourly ? "/hr" : isYearly ? "/yr" : "";
  const cleaned = raw.replace(/[$,\s]/g, "");
  const range = cleaned.match(/^(\d+(?:\.\d+)?k?)[-–to]+(\d+(?:\.\d+)?k?)$/i);
  if (range) {
    const lo = parseNum(range[1]), hi = parseNum(range[2]);
    if (lo && hi) return `${fmtNum(lo)} – ${fmtNum(hi)}${suffix}`;
  }
  const single = cleaned.match(/^(\d+(?:\.\d+)?k?)$/i);
  if (single) {
    const n = parseNum(single[1]);
    if (n) return `${fmtNum(n)}${suffix}`;
  }
  return raw;
}

export default function JobCard({ job, onEdit, onDelete }) {
  const colors = STATUS_COLORS[job.status] || STATUS_COLORS["Wishlist"];
  const outcomeColors = job.outcome ? OUTCOME_COLORS[job.outcome] : null;
  const appliedDate = job.appliedAt ? new Date(job.appliedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
  const createdDate = new Date(job.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="job-card">
      <div className="job-card-header">
        <div className="job-card-info">
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company}</p>
          {job.location && <p className="job-location">📍 {job.location}</p>}
        </div>
        <div className="job-card-badges">
          <span className="job-status-badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
            {job.status}
          </span>
          {outcomeColors && (
            <span className="job-outcome-badge" style={{ background: outcomeColors.bg, color: outcomeColors.text, border: `1px solid ${outcomeColors.border}` }}>
              {job.outcome}
            </span>
          )}
        </div>
      </div>
      <div className="job-card-meta">
        {job.salary && <span className="job-meta-item">💰 {formatSalary(job.salary)}</span>}
        {job.url && <a className="job-meta-item job-link" href={job.url} target="_blank" rel="noopener noreferrer">🔗 Posting</a>}
        <span className="job-meta-item job-date">{appliedDate ? `Applied ${appliedDate}` : `Added ${createdDate}`}</span>
      </div>
      {job.notes && <p className="job-notes">{job.notes}</p>}
      {job.outcomeNotes && (
        <p className="job-outcome-notes">{job.outcomeNotes}</p>
      )}
      <div className="job-card-actions">
        <button className="btn-card-edit" onClick={() => onEdit(job)}>Edit</button>
        <button className="btn-card-delete" onClick={() => onDelete(job._id)}>Delete</button>
      </div>
    </div>
  );
}