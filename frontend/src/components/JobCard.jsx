import { STATUS_COLORS, OUTCOME_COLORS } from "../services/jobs-api.js";
import "./JobCard.css";

const PIPELINE = ["Wishlist", "Applied", "Phone Screen", "Interview", "Offer"];
const PIPE_LABELS = { "Wishlist": "Wishlist", "Applied": "Applied", "Phone Screen": "Phone", "Interview": "Interview", "Offer": "Offer" };
const TERMINAL_COLORS = { Rejected: { bg: "#fee2e2", text: "#991b1b", border: "#ef4444" }, Withdrawn: { bg: "#f5f5f5", text: "#555555", border: "#cccccc" } };

function StagePipeline({ status, onStatusChange }) {
  const isTerminal = status in TERMINAL_COLORS;
  const currentIdx = PIPELINE.indexOf(status);

  return (
    <div className="stage-pipeline">
      {PIPELINE.map((stage, i) => {
        const isPast = !isTerminal && i < currentIdx;
        const isCurrent = !isTerminal && i === currentIdx;
        const colors = isCurrent ? (STATUS_COLORS[stage] || {}) : null;
        return (
          <div key={stage} className="pipeline-segment">
            <button
              className={`pipeline-step${isPast ? " past" : isCurrent ? " current" : " future"}`}
              style={colors ? { background: colors.bg, color: colors.text, border: `1.5px solid ${colors.border}` } : {}}
              onClick={e => { e.stopPropagation(); onStatusChange(stage); }}
              title={stage}
            >
              {PIPE_LABELS[stage]}
            </button>
            {i < PIPELINE.length - 1 && (
              <span className={`pipeline-line${isPast || isCurrent ? " done" : ""}`} />
            )}
          </div>
        );
      })}
      {isTerminal && (
        <div className="pipeline-segment">
          <span className={`pipeline-line`} />
          <button
            className="pipeline-step current terminal"
            style={{ background: TERMINAL_COLORS[status].bg, color: TERMINAL_COLORS[status].text, border: `1.5px solid ${TERMINAL_COLORS[status].border}` }}
            onClick={e => e.stopPropagation()}
            title={status}
          >
            {status}
          </button>
        </div>
      )}
    </div>
  );
}

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

export default function JobCard({ job, onEdit, onDelete, onStatusChange, onView }) {
  const outcomeColors = job.outcome ? OUTCOME_COLORS[job.outcome] : null;
  const appliedDate = job.appliedAt ? new Date(job.appliedAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }) : null;
  const createdDate = new Date(job.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="job-card" onClick={() => onView(job)} style={{ cursor: "pointer" }}>
      <div className="job-card-header">
        <div className="job-card-info">
          <h3 className="job-title">{job.title}</h3>
          <p className="job-company">{job.company}</p>
          {job.location && <p className="job-location">📍 {job.location}</p>}
        </div>
        {outcomeColors && (
          <div className="job-card-badges">
            <span className="job-outcome-badge" style={{ background: outcomeColors.bg, color: outcomeColors.text, border: `1px solid ${outcomeColors.border}` }}>
              {job.outcome}
            </span>
          </div>
        )}
      </div>
      <div className="job-card-meta">
        {job.salary && <span className="job-meta-item">💰 {formatSalary(job.salary)}</span>}
        {job.url && <a className="job-meta-item job-link" href={job.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>🔗 Posting</a>}
        <span className="job-meta-item job-date">{appliedDate ? `Applied ${appliedDate}` : `Added ${createdDate}`}</span>
      </div>
      {job.notes && <p className="job-notes">{job.notes}</p>}
      {job.outcomeNotes && <p className="job-outcome-notes">{job.outcomeNotes}</p>}
      <StagePipeline status={job.status} onStatusChange={(s) => onStatusChange(job._id, s)} />
      <div className="job-card-actions">
        <button className="btn-card-edit" onClick={e => { e.stopPropagation(); onEdit(job); }}>Edit</button>
        <button className="btn-card-delete" onClick={e => { e.stopPropagation(); onDelete(job._id); }}>Delete</button>
      </div>
    </div>
  );
}
