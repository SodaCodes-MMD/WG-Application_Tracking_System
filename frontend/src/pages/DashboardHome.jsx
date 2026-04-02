import { useState, useEffect, useCallback } from "react";
import { jobsApi, JOB_STATUSES, STATUS_COLORS } from "../services/jobs-api.js";
import JobCard from "../components/JobCard.jsx";
import JobForm from "../components/JobForm.jsx";
import "./DashboardHome.css";

const ALL = "All";

export default function DashboardHome() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    try { const res = await jobsApi.list(); setJobs(res.data || []); setError(""); }
    catch (err) { setError(err.message || "Failed to load jobs"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const filtered = jobs
    .filter(j => filterStatus === ALL || j.status === filterStatus)
    .filter(j => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        j.title?.toLowerCase().includes(q) ||
        j.company?.toLowerCase().includes(q) ||
        j.location?.toLowerCase().includes(q) ||
        j.notes?.toLowerCase().includes(q)
      );
    });
  const statusCounts = JOB_STATUSES.reduce((acc, s) => { acc[s] = jobs.filter(j => j.status === s).length; return acc; }, {});

  const openAdd = () => { setEditingJob(null); setShowForm(true); };
  const openEdit = (job) => { setEditingJob(job); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditingJob(null); };

  const handleSave = async (payload) => {
    setFormLoading(true);
    try {
      if (editingJob) { const res = await jobsApi.update(editingJob._id, payload); setJobs(prev => prev.map(j => j._id === editingJob._id ? res.data : j)); }
      else { const res = await jobsApi.create(payload); setJobs(prev => [res.data, ...prev]); }
      closeForm();
    } catch (err) { alert(err.message || "Failed to save job"); }
    finally { setFormLoading(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this job application?")) return;
    try { await jobsApi.remove(id); setJobs(prev => prev.filter(j => j._id !== id)); }
    catch (err) { alert(err.message || "Failed to delete job"); }
  };

  return (
    <>
      <div className="page-header dh-page-header">
        <div><h2>Job Board</h2><p>Track and manage your job applications in one place.</p></div>
        <button className="btn-primary" onClick={openAdd}>+ Add Job</button>
      </div>

      <div className="dh-search-bar">
        <input
          className="dh-search-input"
          type="search"
          placeholder="Search by title, company, location or notes..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="dh-clear-filter" onClick={() => setSearchQuery("")}>✕ Clear</button>
        )}
      </div>

      {jobs.length > 0 && (
        <div className="dh-stats">
          {JOB_STATUSES.filter(s => statusCounts[s] > 0).map(s => {
            const c = STATUS_COLORS[s];
            return (
              <button key={s} className={`dh-stat-chip${filterStatus === s ? " dh-stat-chip--active" : ""}`}
                style={filterStatus === s ? { background: c.bg, color: c.text, borderColor: c.border } : {}}
                onClick={() => setFilterStatus(filterStatus === s ? ALL : s)}>
                {s}<span className="dh-stat-count">{statusCounts[s]}</span>
              </button>
            );
          })}
          {filterStatus !== ALL && <button className="dh-clear-filter" onClick={() => setFilterStatus(ALL)}>✕ Clear filter</button>}
        </div>
      )}

      {loading ? (
        <div className="dh-loading"><div className="dh-spinner" /><p>Loading jobs…</p></div>
      ) : error ? (
        <div className="dh-error"><p>⚠️ {error}</p><button className="btn-primary" onClick={fetchJobs}>Retry</button></div>
      ) : filtered.length === 0 && jobs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <h3>No jobs yet</h3>
          <p>Add your first job application to start tracking your progress.</p>
          <button className="btn-primary" onClick={openAdd}>+ Add Job</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🔍</div>
          <h3>No jobs match this filter</h3>
          <button className="btn-primary" onClick={() => setFilterStatus(ALL)}>Show all</button>
        </div>
      ) : (
        <div className="dh-grid">
          {filtered.map(job => <JobCard key={job._id} job={job} onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      )}

      {showForm && <JobForm job={editingJob} onSave={handleSave} onClose={closeForm} loading={formLoading} />}
    </>
  );
}