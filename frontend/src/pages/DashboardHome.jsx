import { useState, useEffect, useCallback } from "react";
import { jobsApi, JOB_STATUSES, STATUS_COLORS } from "../services/jobs-api.js";
import JobCard from "../components/JobCard.jsx";
import JobForm from "../components/JobForm.jsx";
import "./DashboardHome.css";

const ALL = "All";
const VIEW_ACTIVE = "active";
const VIEW_ARCHIVED = "archived";

export default function DashboardHome() {
  const [jobs, setJobs] = useState([]);
  const [archivedJobs, setArchivedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [viewMode, setViewMode] = useState(VIEW_ACTIVE);

  const fetchActiveJobs = useCallback(async () => {
    try { const res = await jobsApi.list(); setJobs(res.data || []); setError(""); }
    catch (err) { setError(err.message || "Failed to load jobs"); }
    finally { setLoading(false); }
  }, []);

  const fetchArchivedJobs = useCallback(async () => {
    try { const res = await jobsApi.listArchived(); setArchivedJobs(res.data || []); setError(""); }
    catch (err) { setError(err.message || "Failed to load archived jobs"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchActiveJobs(); }, [fetchActiveJobs]);
  useEffect(() => { if (viewMode === VIEW_ARCHIVED) fetchArchivedJobs(); }, [viewMode, fetchArchivedJobs]);

  const currentJobs = viewMode === VIEW_ARCHIVED ? archivedJobs : jobs;
  const filtered = currentJobs
    .filter(j => viewMode === VIEW_ARCHIVED || filterStatus === ALL || j.status === filterStatus)
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

  const handleArchive = async (id) => {
    if (!window.confirm("Archive this job application? You can restore it later from the Archived view.")) return;
    try { const res = await jobsApi.archive(id); setJobs(prev => prev.filter(j => j._id !== id)); setArchivedJobs(prev => [res.data, ...prev]); }
    catch (err) { alert(err.message || "Failed to archive job"); }
  };

  const handleRestore = async (id) => {
    if (!window.confirm("Restore this job application to your active jobs?")) return;
    try { const res = await jobsApi.restore(id); setArchivedJobs(prev => prev.filter(j => j._id !== id)); setJobs(prev => [res.data, ...prev]); }
    catch (err) { alert(err.message || "Failed to restore job"); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Permanently delete this job application? This action cannot be undone.")) return;
    try { await jobsApi.remove(id); if (viewMode === VIEW_ARCHIVED) setArchivedJobs(prev => prev.filter(j => j._id !== id)); else setJobs(prev => prev.filter(j => j._id !== id)); }
    catch (err) { alert(err.message || "Failed to delete job"); }
  };

  return (
    <>
      <div className="page-header dh-page-header">
        <div><h2>Job Board</h2><p>Track and manage your job applications in one place.</p></div>
        <div className="dh-view-toggle">
          <button className={`dh-view-btn${viewMode === VIEW_ACTIVE ? " dh-view-btn--active" : ""}`} onClick={() => setViewMode(VIEW_ACTIVE)}>
            Active ({jobs.length})
          </button>
          <button className={`dh-view-btn${viewMode === VIEW_ARCHIVED ? " dh-view-btn--active" : ""}`} onClick={() => setViewMode(VIEW_ARCHIVED)}>
            Archived ({archivedJobs.length})
          </button>
        </div>
      </div>

      {viewMode === VIEW_ACTIVE && (
        <>
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
        </>
      )}

      {loading ? (
        <div className="dh-loading"><div className="dh-spinner" /><p>Loading jobs…</p></div>
      ) : error ? (
        <div className="dh-error"><p>⚠️ {error}</p><button className="btn-primary" onClick={() => viewMode === VIEW_ARCHIVED ? fetchArchivedJobs() : fetchActiveJobs()}>Retry</button></div>
      ) : filtered.length === 0 && currentJobs.length === 0 ? (
        viewMode === VIEW_ARCHIVED ? (
          <div className="empty-state">
            <div className="empty-state-icon">📦</div>
            <h3>No archived jobs</h3>
            <p>Archived jobs will appear here. You can archive jobs from the Active view.</p>
            <button className="btn-primary" onClick={() => setViewMode(VIEW_ACTIVE)}>View Active Jobs</button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <h3>No jobs yet</h3>
            <p>Add your first job application to start tracking your progress.</p>
            <button className="btn-primary" onClick={openAdd}>+ Add Job</button>
          </div>
        )
      ) : filtered.length === 0 ? (
        viewMode === VIEW_ARCHIVED ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No archived jobs found</h3>
            <button className="btn-primary" onClick={() => setViewMode(VIEW_ACTIVE)}>View Active Jobs</button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">🔍</div>
            <h3>No jobs match this filter</h3>
            <button className="btn-primary" onClick={() => setFilterStatus(ALL)}>Show all</button>
          </div>
        )
      ) : (
        <div className="dh-grid">
          {filtered.map(job => (
            <JobCard
              key={job._id}
              job={job}
              isArchived={viewMode === VIEW_ARCHIVED}
              onEdit={openEdit}
              onArchive={handleArchive}
              onRestore={handleRestore}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showForm && viewMode === VIEW_ACTIVE && <JobForm job={editingJob} onSave={handleSave} onClose={closeForm} loading={formLoading} />}
    </>
  );
}