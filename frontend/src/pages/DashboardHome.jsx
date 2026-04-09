import { useState, useEffect, useCallback, useMemo } from "react";
import { jobsApi, JOB_STATUSES, STATUS_COLORS } from "../services/jobs-api.js";
import JobCard from "../components/JobCard.jsx";
import JobForm from "../components/JobForm.jsx";
import JobDetailPanel from "../components/JobDetailPanel.jsx";
import "./DashboardHome.css";

const ALL = "All";

export default function DashboardHome() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [filterLocation, setFilterLocation] = useState(ALL);
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null); // For JobDetailPanel
  const [formLoading, setFormLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    try { const res = await jobsApi.list(); setJobs(res.data || []); setError(""); }
    catch (err) { setError(err.message || "Failed to load jobs"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const locations = useMemo(() => {
    const locs = jobs.map(j => j.location).filter(Boolean);
    return [...new Set(locs)].sort();
  }, [jobs]);

  const filtered = jobs
    .filter(j => filterStatus === ALL || j.status === filterStatus)
    .filter(j => filterLocation === ALL || j.location === filterLocation)
    .filter(j => {
      if (!filterDateFrom && !filterDateTo) return true;
      const d = j.appliedAt ? new Date(j.appliedAt) : null;
      if (!d) return false;
      if (filterDateFrom && d < new Date(filterDateFrom)) return false;
      if (filterDateTo   && d > new Date(filterDateTo + "T23:59:59")) return false;
      return true;
    })
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
  const hasActiveFilters = filterStatus !== ALL || filterLocation !== ALL || filterDateFrom || filterDateTo;

  const clearFilters = () => { setFilterStatus(ALL); setFilterLocation(ALL); setFilterDateFrom(""); setFilterDateTo(""); };

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

      <div className="dh-filters">
        <div className="dh-filter-group">
          <label className="dh-filter-label">Stage</label>
          <select className="dh-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value={ALL}>All stages</option>
            {JOB_STATUSES.map(s => (
              <option key={s} value={s}>{s}{statusCounts[s] ? ` (${statusCounts[s]})` : ""}</option>
            ))}
          </select>
        </div>

        <div className="dh-filter-group">
          <label className="dh-filter-label">Location</label>
          <select className="dh-filter-select" value={filterLocation} onChange={e => setFilterLocation(e.target.value)} disabled={locations.length === 0}>
            <option value={ALL}>All locations</option>
            {locations.map(loc => <option key={loc} value={loc}>{loc}</option>)}
          </select>
        </div>

        <div className="dh-filter-group">
          <label className="dh-filter-label">Applied from</label>
          <input className="dh-filter-date" type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} />
        </div>

        <div className="dh-filter-group">
          <label className="dh-filter-label">Applied to</label>
          <input className="dh-filter-date" type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} />
        </div>

        {hasActiveFilters && (
          <button className="dh-clear-all-filters" onClick={clearFilters}>✕ Clear filters</button>
        )}
      </div>

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
          <h3>No jobs match these filters</h3>
          <button className="btn-primary" onClick={clearFilters}>Clear filters</button>
        </div>
      ) : (
        <div className="dh-grid">
          {filtered.map(job => <JobCard key={job._id} job={job} onEdit={openEdit} onDelete={handleDelete} onSelect={setSelectedJob}/>)}
        </div>
      )}

      {showForm && <JobForm job={editingJob} onSave={handleSave} onClose={closeForm} loading={formLoading} />}
      {selectedJob && <JobDetailPanel job={selectedJob} onClose={() => setSelectedJob(null)} />}
    </>
  );
}
