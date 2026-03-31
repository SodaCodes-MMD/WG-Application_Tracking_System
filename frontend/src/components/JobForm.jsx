import { useState, useEffect } from "react";
import { JOB_STATUSES } from "../services/jobs-api.js";
import "./JobForm.css";

const EMPTY = { company: "", title: "", status: "Wishlist", location: "", url: "", salary: "", notes: "", appliedAt: "" };

function toDateInput(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? "" : dt.toISOString().split("T")[0];
}

export default function JobForm({ job, onSave, onClose, loading }) {
  const isEdit = Boolean(job);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const nextForm = job
      ? { company: job.company||"", title: job.title||"", status: job.status||"Wishlist", location: job.location||"", url: job.url||"", salary: job.salary||"", notes: job.notes||"", appliedAt: toDateInput(job.appliedAt) }
      : EMPTY;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(nextForm);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setErrors({});
  }, [job]);

  const set = (field) => (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(errs => ({ ...errs, [field]: undefined })); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.company.trim()) errs.company = "Company is required";
    if (!form.title.trim()) errs.title = "Job title is required";
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave({ ...form, appliedAt: form.appliedAt || null });
  };

  return (
    <div className="jf-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="jf-modal" onClick={e => e.stopPropagation()}>
        <div className="jf-header">
          <h3>{isEdit ? "Edit Job" : "Add Job Application"}</h3>
          <button className="jf-close" onClick={onClose}>✕</button>
        </div>
        <form className="jf-form" onSubmit={handleSubmit} noValidate>
          <div className="jf-group jf-required">
            <label>Company</label>
            <input type="text" value={form.company} onChange={set("company")} placeholder="e.g. Acme Corp" disabled={loading} className={errors.company ? "jf-err" : ""} />
            {errors.company && <span className="jf-error">{errors.company}</span>}
          </div>
          <div className="jf-group jf-required">
            <label>Job Title</label>
            <input type="text" value={form.title} onChange={set("title")} placeholder="e.g. Software Engineer" disabled={loading} className={errors.title ? "jf-err" : ""} />
            {errors.title && <span className="jf-error">{errors.title}</span>}
          </div>
          <div className="jf-row">
            <div className="jf-group">
              <label>Status</label>
              <select value={form.status} onChange={set("status")} disabled={loading}>
                {JOB_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="jf-group">
              <label>Location</label>
              <input type="text" value={form.location} onChange={set("location")} placeholder="e.g. Remote" disabled={loading} />
            </div>
          </div>
          <div className="jf-row">
            <div className="jf-group">
              <label>Salary / Range</label>
              <input type="text" value={form.salary} onChange={set("salary")} placeholder="e.g. $80k–$100k" disabled={loading} />
            </div>
            <div className="jf-group">
              <label>Date Applied</label>
              <input type="date" value={form.appliedAt} onChange={set("appliedAt")} disabled={loading} />
            </div>
          </div>
          <div className="jf-group">
            <label>Job Posting URL</label>
            <input type="url" value={form.url} onChange={set("url")} placeholder="https://..." disabled={loading} />
          </div>
          <div className="jf-group">
            <label>Notes</label>
            <textarea value={form.notes} onChange={set("notes")} placeholder="Recruiter name, next steps..." rows={3} disabled={loading} />
          </div>
          <div className="jf-actions">
            <button type="button" className="jf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="jf-btn-save" disabled={loading}>{loading ? "Saving…" : isEdit ? "Save Changes" : "Add Job"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}