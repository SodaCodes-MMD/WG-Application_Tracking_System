import React, { useState, useEffect } from "react";
import { JOB_STATUSES, JOB_OUTCOMES } from "../services/jobs-api.js";
import "./JobForm.css";

const EMPTY = {
  company: "",
  title: "",
  status: "Wishlist",
  location: "",
  url: "",
  salary: "",
  salaryMode: "structured",
  salaryCurrency: "USD",
  salaryMin: "",
  salaryMax: "",
  salaryPeriod: "year",
  notes: "",
  appliedAt: "",
  deadline: "",
  recruiterNotes: "",
  outcome: "",
  outcomeNotes: "",
  respondedAt: "",
};

function toDateInput(d) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt) ? "" : dt.toISOString().split("T")[0];
}

function parseLegacySalary(rawSalary) {
  if (!rawSalary) return { salaryMode: "structured", salaryCurrency: "USD", salaryMin: "", salaryMax: "", salaryPeriod: "year", salary: "" };
  const numberChunks = String(rawSalary).match(/\d[\d,.]*/g) || [];
  const normalized = numberChunks
    .map((chunk) => Number(chunk.replace(/,/g, "")))
    .filter((n) => !isNaN(n));

  const period = /hour|hr\b/i.test(rawSalary) ? "hour" : /month/i.test(rawSalary) ? "month" : "year";
  const currency = /\$/i.test(rawSalary) ? "USD" : /€/i.test(rawSalary) ? "EUR" : /£/i.test(rawSalary) ? "GBP" : "USD";

  if (normalized.length === 0) {
    return { salaryMode: "custom", salaryCurrency: currency, salaryMin: "", salaryMax: "", salaryPeriod: period, salary: rawSalary };
  }

  const [min, max] = normalized.length >= 2 ? [normalized[0], normalized[1]] : [normalized[0], ""];
  return {
    salaryMode: "structured",
    salaryCurrency: currency,
    salaryMin: min ? String(min) : "",
    salaryMax: max ? String(max) : "",
    salaryPeriod: period,
    salary: rawSalary,
  };
}

function formatSalaryForSave({ salaryMode, salaryCurrency, salaryMin, salaryMax, salaryPeriod, salary }) {
  if (salaryMode === "custom") return salary?.trim() || "";

  const minNum = Number(salaryMin);
  const maxNum = Number(salaryMax);
  const hasMin = !isNaN(minNum) && salaryMin !== "";
  const hasMax = !isNaN(maxNum) && salaryMax !== "";

  if (!hasMin && !hasMax) return "";

  const symbol = salaryCurrency === "USD" ? "$" : salaryCurrency === "EUR" ? "EUR " : "GBP ";
  const compact = (value) => {
    if (value >= 1000) return `${Math.round(value / 1000)}k`;
    return String(Math.round(value));
  };

  const amount = hasMin && hasMax ? `${compact(minNum)}-${compact(maxNum)}` : compact(hasMin ? minNum : maxNum);
  const suffix = salaryPeriod === "year" ? "/yr" : salaryPeriod === "month" ? "/mo" : "/hr";
  return `${symbol}${amount}${suffix}`;
}

export default function JobForm({ job, onSave, onClose, loading }) {
  const isEdit = Boolean(job);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const parsedSalary = parseLegacySalary(job?.salary || "");
    const nextForm = job
      ? {
          company: job.company || "",
          title: job.title || "",
          status: job.status || "Wishlist",
          location: job.location || "",
          url: job.url || "",
          salary: job.salary || "",
          salaryMode: parsedSalary.salaryMode,
          salaryCurrency: parsedSalary.salaryCurrency,
          salaryMin: parsedSalary.salaryMin,
          salaryMax: parsedSalary.salaryMax,
          salaryPeriod: parsedSalary.salaryPeriod,
          notes: job.notes || "",
          appliedAt: toDateInput(job.appliedAt),
          deadline: toDateInput(job.deadline),
          recruiterNotes: job.recruiterNotes || "",
          outcome: job.outcome || "",
          outcomeNotes: job.outcomeNotes || "",
          respondedAt: toDateInput(job.respondedAt),
        }
      : EMPTY;
    if (job) { setForm(nextForm); } else { setForm(EMPTY); } // eslint-disable-line react-hooks/set-state-in-effect
    setErrors({});
  }, [job]);

  const set = (field) => (e) => { setForm(f => ({ ...f, [field]: e.target.value })); setErrors(errs => ({ ...errs, [field]: undefined })); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.company.trim()) errs.company = "Company is required";
    if (!form.title.trim()) errs.title = "Job title is required";

    if (form.salaryMode === "structured") {
      const hasMin = form.salaryMin !== "";
      const hasMax = form.salaryMax !== "";
      if (!hasMin && !hasMax) {
        errs.salary = "Enter at least min or max salary";
      }
      if (hasMin && Number(form.salaryMin) < 0) errs.salary = "Salary cannot be negative";
      if (hasMax && Number(form.salaryMax) < 0) errs.salary = "Salary cannot be negative";
      if (hasMin && hasMax && Number(form.salaryMin) > Number(form.salaryMax)) {
        errs.salary = "Min salary cannot exceed max salary";
      }
    } else if (form.salaryMode === "custom" && !form.salary.trim()) {
      errs.salary = "Custom salary text is required";
    }

    if (Object.keys(errs).length) { setErrors(errs); return; }

    const payload = {
      ...form,
      salary: formatSalaryForSave(form),
      appliedAt: form.appliedAt || null,
      deadline: form.deadline || null,
      recruiterNotes: form.recruiterNotes?.trim() || "",
      outcome: form.outcome || null,
      outcomeNotes: form.outcomeNotes?.trim() || "",
      respondedAt: form.respondedAt || null,
    };

    onSave(payload);
  };

  return (
    <div className="jf-overlay" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="jf-modal" onClick={e => e.stopPropagation()}>
        <div className="jf-header">
          <h3>{isEdit ? "Edit Job" : "Add Job Application"}</h3>
          <button className="jf-close" onClick={onClose}>✕</button>
        </div>
        <form className="jf-form" onSubmit={handleSubmit} noValidate>
          <section className="jf-section jf-section-span">
            <h4 className="jf-section-title">Role Details</h4>
            <div className="jf-grid-2">
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
              <div className="jf-group">
                <label>Status</label>
                <select value={form.status} onChange={set("status")} disabled={loading}>
                  {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="jf-group">
                <label>Location</label>
                <input type="text" value={form.location} onChange={set("location")} placeholder="e.g. Remote" disabled={loading} />
              </div>
              <div className="jf-group jf-field-span">
                <label>Job Posting URL</label>
                <input type="url" value={form.url} onChange={set("url")} placeholder="https://..." disabled={loading} />
              </div>
            </div>
          </section>

          <section className="jf-section">
            <h4 className="jf-section-title">Compensation</h4>
            <div className="jf-group">
              <label>Salary / Compensation</label>
              <div className="jf-salary-mode">
                <button type="button" className={`jf-chip ${form.salaryMode === "structured" ? "jf-chip-active" : ""}`} onClick={() => setForm((f) => ({ ...f, salaryMode: "structured" }))} disabled={loading}>Range</button>
                <button type="button" className={`jf-chip ${form.salaryMode === "custom" ? "jf-chip-active" : ""}`} onClick={() => setForm((f) => ({ ...f, salaryMode: "custom" }))} disabled={loading}>Custom text</button>
              </div>
              {form.salaryMode === "structured" ? (
                <div className="jf-salary-grid">
                  <select value={form.salaryCurrency} onChange={set("salaryCurrency")} disabled={loading}>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="GBP">GBP</option>
                  </select>
                  <input type="number" min="0" step="1000" value={form.salaryMin} onChange={set("salaryMin")} placeholder="Min" disabled={loading} />
                  <input type="number" min="0" step="1000" value={form.salaryMax} onChange={set("salaryMax")} placeholder="Max" disabled={loading} />
                  <select className="jf-salary-period" value={form.salaryPeriod} onChange={set("salaryPeriod")} disabled={loading}>
                    <option value="year">Per year</option>
                    <option value="month">Per month</option>
                    <option value="hour">Per hour</option>
                  </select>
                </div>
              ) : (
                <input type="text" value={form.salary} onChange={set("salary")} placeholder="e.g. OTE up to $180k" disabled={loading} />
              )}
              {errors.salary && <span className="jf-error">{errors.salary}</span>}
            </div>
          </section>

          <section className="jf-section">
            <h4 className="jf-section-title">Timeline</h4>
            <div className="jf-grid-2">
              <div className="jf-group">
                <label>Date Applied</label>
                <input type="date" value={form.appliedAt} onChange={set("appliedAt")} disabled={loading} />
              </div>
              <div className="jf-group">
                <label>Deadline</label>
                <input type="date" value={form.deadline} onChange={set("deadline")} disabled={loading} />
              </div>
            </div>
          </section>

          <section className="jf-section jf-section-span">
            <h4 className="jf-section-title">Notes</h4>
            <div className="jf-grid-2">
              <div className="jf-group">
                <label>Application Notes</label>
                <textarea value={form.notes} onChange={set("notes")} placeholder="Application notes..." rows={4} disabled={loading} />
              </div>
              <div className="jf-group">
                <label>Recruiter / Contact Notes</label>
                <textarea value={form.recruiterNotes} onChange={set("recruiterNotes")} placeholder="Recruiter name, email, phone, next steps..." rows={4} disabled={loading} />
              </div>
            </div>
          </section>

          <section className="jf-section jf-section-span">
            <h4 className="jf-section-title">Outcome</h4>
            <div className="jf-grid-2">
              <div className="jf-group">
                <label>Outcome</label>
                <select value={form.outcome} onChange={set("outcome")} disabled={loading}>
                  <option value="">None</option>
                  {JOB_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="jf-group">
                <label>Response Date</label>
                <input type="date" value={form.respondedAt} onChange={set("respondedAt")} disabled={loading} />
              </div>
              <div className="jf-group jf-field-span">
                <label>Outcome Notes</label>
                <textarea value={form.outcomeNotes} onChange={set("outcomeNotes")} placeholder="Notes about response outcome..." rows={3} disabled={loading} />
              </div>
            </div>
          </section>

          <div className="jf-actions">
            <button type="button" className="jf-btn-cancel" onClick={onClose} disabled={loading}>Cancel</button>
            <button type="submit" className="jf-btn-save" disabled={loading}>{loading ? "Saving…" : isEdit ? "Save Changes" : "Add Job"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}