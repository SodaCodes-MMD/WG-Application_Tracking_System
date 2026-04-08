import { STATUS_COLORS } from "../services/jobs-api.js";
import "./JobCard.css";

export default function JobCard({ job, onEdit, onDelete, onArchive, onRestore, isArchived }) {
  const colors = isArchived ? { bg: "#f5f5f5", text: "#888888", border: "#cccccc" } : STATUS_COLORS[job.status] || STATUS_COLORS["Wishlist"];
  const appliedDate = job.appliedAt ? new Date(job.appliedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
  const createdDate = new Date(job.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const archivedDate = job.archivedAt ? new Date(job.archivedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;

  return (
    <div className={`job-card${isArchived ? " job-card--archived" : ""}`}>
      <div className="job-card-header">
        <div className="job-card-info">
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company}</p>
          {job.location && <p className="job-location">📍 {job.location}</p>}
        </div>
        <span className="job-status-badge" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
          {isArchived ? "Archived" : job.status}
        </span>
      </div>
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
      <div className="job-card-actions">
        {!isArchived && (
          <>
            <button className="btn-card-edit" onClick={() => onEdit(job)} disabled={isArchived}>Edit</button>
            <button className="btn-card-archive" onClick={() => onArchive(job._id)}>Archive</button>
          </>
        )}
        {isArchived && (
          <>
            <button className="btn-card-restore" onClick={() => onRestore(job._id)}>Restore</button>
            <button className="btn-card-delete" onClick={() => onDelete(job._id)}>Delete</button>
          </>
        )}
      </div>
    </div>
  );
}