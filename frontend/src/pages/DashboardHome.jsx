/*
 * S3-019: memoized filtered/sorted job list with useMemo; added aria-labels on
 * search and clear buttons; added role="alert" on the error container.
 */
import { useState, useEffect, useCallback, useMemo } from "react";
import { jobsApi, JOB_STATUSES, STATUS_COLORS } from "../services/jobs-api.js";
import JobCard from "../components/JobCard.jsx";
import JobForm from "../components/JobForm.jsx";
import JobDetail from "../components/JobDetail.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import "./DashboardHome.css";

const ALL = "All";
const FUNNEL_STAGES = ["Wishlist", "Applied", "Phone Screen", "Interview", "Offer"];


function compareValues(a, b, sortBy, sortDirection) {
  const direction = sortDirection === "asc" ? 1 : -1;

  if (sortBy === "company") {
    const aValue = (a.company || "").toLowerCase();
    const bValue = (b.company || "").toLowerCase();
    if (aValue < bValue) return -1 * direction;
    if (aValue > bValue) return 1 * direction;
    return 0;
  }

  if (sortBy === "deadline") {
    const aValue = a.deadline ? new Date(a.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    const bValue = b.deadline ? new Date(b.deadline).getTime() : Number.MAX_SAFE_INTEGER;
    return (aValue - bValue) * direction;
  }

  if (sortBy === "createdDate") {
    const aValue = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bValue = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return (aValue - bValue) * direction;
  }

  if (sortBy === "lastActivity") {
    const aValue = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bValue = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return (aValue - bValue) * direction;
  }

  return 0;
}





















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
  const [formLoading, setFormLoading] = useState(false);
  const [sortBy, setSortBy] = useState("lastActivity");
  const [sortDirection, setSortDirection] = useState("desc");
  const [viewingJob, setViewingJob] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const [archivedJobs, setArchivedJobs] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const [active, archived] = await Promise.all([jobsApi.list(), jobsApi.listArchived()]);
      setJobs(active.data || []);
      setArchivedJobs(archived.data || []);
      setError("");
    }
    catch (err) { setError(err.message || "Failed to load jobs"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const locations = useMemo(() => {
    const locs = jobs.map(j => j.location).filter(Boolean);
    return [...new Set(locs)].sort();
  }, [jobs]);

const filtered = useMemo(() => [...jobs]
  .filter(j => filterStatus === ALL || j.status === filterStatus)
  .filter(j => filterLocation === ALL || j.location === filterLocation)
  .filter(j => {
    if (!filterDateFrom && !filterDateTo) return true;
    const d = j.appliedAt ? new Date(j.appliedAt) : null;
    if (!d) return false;
    if (filterDateFrom && d < new Date(filterDateFrom)) return false;
    if (filterDateTo && d > new Date(filterDateTo + "T23:59:59")) return false;
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
  })
  .sort((a, b) => compareValues(a, b, sortBy, sortDirection)),
  [jobs, filterStatus, filterLocation, filterDateFrom, filterDateTo, searchQuery, sortBy, sortDirection]
);

  const statusCounts = JOB_STATUSES.reduce((acc, s) => { acc[s] = jobs.filter(j => j.status === s).length; return acc; }, {});
  const responseMetrics = {
    responded: jobs.filter((j) => Boolean(j.outcome)).length,
    accepted: jobs.filter((j) => j.outcome === "Accepted").length,
    rejected: jobs.filter((j) => j.outcome === "Rejected").length,
    withdrawn: jobs.filter((j) => j.outcome === "Withdrawn").length,
    ghosted: jobs.filter((j) => j.outcome === "Ghosted").length,
  };
  const analytics = useMemo(() => {
    // Count how many jobs ever reached each funnel stage.
    // A job counts for all stages up to its highest reached stage so the
    // funnel is monotonically decreasing (e.g. reaching Interview implies
    // passing through Applied and Phone Screen).
    const stageReach = {};
    FUNNEL_STAGES.forEach(s => { stageReach[s] = 0; });
    jobs.forEach(job => {
      const allStatuses = new Set((job.statusHistory || []).map(h => h.status));
      allStatuses.add(job.status);
      let highestIdx = -1;
      FUNNEL_STAGES.forEach((s, idx) => { if (allStatuses.has(s)) highestIdx = Math.max(highestIdx, idx); });
      for (let i = 0; i <= highestIdx; i++) stageReach[FUNNEL_STAGES[i]]++;
    });

    // Conversion rate between consecutive funnel stages
    const conversions = [];
    for (let i = 0; i < FUNNEL_STAGES.length - 1; i++) {
      const from = FUNNEL_STAGES[i];
      const to = FUNNEL_STAGES[i + 1];
      const fromCount = stageReach[from];
      const toCount = stageReach[to];
      const rate = fromCount > 0 ? Math.round((toCount / fromCount) * 100) : null;
      conversions.push({ from, to, fromCount, toCount, rate });
    }

    // Average time spent in each stage (days between consecutive history entries)
    const stageTimes = {};
    jobs.forEach(job => {
      const history = [...(job.statusHistory || [])].sort(
        (a, b) => new Date(a.changedAt) - new Date(b.changedAt)
      );
      for (let i = 0; i < history.length - 1; i++) {
        const stage = history[i].status;
        const days = (new Date(history[i + 1].changedAt) - new Date(history[i].changedAt)) / 86400000;
        if (days >= 0) {
          if (!stageTimes[stage]) stageTimes[stage] = [];
          stageTimes[stage].push(days);
        }
      }
      // Current stage: time since last transition until now
      if (history.length > 0) {
        const last = history[history.length - 1];
        const days = (Date.now() - new Date(last.changedAt)) / 86400000;
        if (!stageTimes[last.status]) stageTimes[last.status] = [];
        stageTimes[last.status].push(days);
      }
    });

    const avgTimeInStage = Object.entries(stageTimes)
      .map(([stage, times]) => ({
        stage,
        avgDays: Math.round((times.reduce((s, d) => s + d, 0) / times.length) * 10) / 10,
        sampleSize: times.length,
      }))
      .sort((a, b) => JOB_STATUSES.indexOf(a.stage) - JOB_STATUSES.indexOf(b.stage));

    return { conversions, avgTimeInStage };
  }, [jobs]);

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

  const handleDelete = (id) => setPendingDeleteId(id);

  const confirmDelete = async () => {
    const id = pendingDeleteId;
    setPendingDeleteId(null);
    try {
      await jobsApi.remove(id);
      setJobs(prev => prev.filter(j => j._id !== id));
      setArchivedJobs(prev => prev.filter(j => j._id !== id));
      if (viewingJob?._id === id) setViewingJob(null);
    } catch (err) { alert(err.message || "Failed to delete job"); }
  };

  const handleArchive = async (id) => {
    try {
      const res = await jobsApi.archive(id);
      setJobs(prev => prev.filter(j => j._id !== id));
      setArchivedJobs(prev => [res.data, ...prev]);
    } catch (err) { alert(err.message || "Failed to archive job"); }
  };

  const handleRestore = async (id) => {
    try {
      const res = await jobsApi.restore(id);
      setArchivedJobs(prev => prev.filter(j => j._id !== id));
      setJobs(prev => [res.data, ...prev]);
    } catch (err) { alert(err.message || "Failed to restore job"); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await jobsApi.update(id, { status });
      setJobs(prev => prev.map(j => j._id === id ? res.data : j));
      if (viewingJob?._id === id) setViewingJob(res.data);
    } catch (err) { alert(err.message || "Failed to update stage"); }
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
          aria-label="Search jobs"
        />
        {searchQuery && (
          <button className="dh-clear-filter" onClick={() => setSearchQuery("")} aria-label="Clear search">✕ Clear</button>
        )}
      </div>

      <div className="dh-metrics">
        <div className="dh-metric-card"><span className="dh-metric-label">Responded</span><span className="dh-metric-value">{responseMetrics.responded}</span></div>
        <div className="dh-metric-card"><span className="dh-metric-label">Accepted</span><span className="dh-metric-value">{responseMetrics.accepted}</span></div>
        <div className="dh-metric-card"><span className="dh-metric-label">Rejected</span><span className="dh-metric-value">{responseMetrics.rejected}</span></div>
        <div className="dh-metric-card"><span className="dh-metric-label">Withdrawn</span><span className="dh-metric-value">{responseMetrics.withdrawn}</span></div>
        <div className="dh-metric-card"><span className="dh-metric-label">Ghosted</span><span className="dh-metric-value">{responseMetrics.ghosted}</span></div>
      </div>

      <div className="dh-analytics-section">
        <button className="dh-analytics-toggle" onClick={() => setShowAnalytics(o => !o)}>
          Analytics {showAnalytics ? "▲" : "▼"}
        </button>
        {showAnalytics && (
          <div className="dh-analytics-panels">
            <div className="dh-analytics-panel">
              <h4 className="dh-analytics-heading">Conversion Funnel</h4>
              {analytics.conversions.every(c => c.rate === null) ? (
                <p className="dh-analytics-empty">Not enough data yet.</p>
              ) : (
                <div className="dh-funnel-list">
                  {analytics.conversions.map(c => (
                    <div key={c.from + c.to} className="dh-funnel-item">
                      <div className="dh-funnel-label">
                        <span>{c.from} → {c.to}</span>
                        <span className="dh-funnel-rate">{c.rate !== null ? `${c.rate}%` : "—"}</span>
                      </div>
                      <div className="dh-bar-track">
                        <div
                          className="dh-bar-fill"
                          style={{ width: c.rate !== null ? `${c.rate}%` : "0%" }}
                        />
                      </div>
                      <div className="dh-funnel-counts">{c.toCount} of {c.fromCount} jobs</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="dh-analytics-panel">
              <h4 className="dh-analytics-heading">Avg. Time in Stage</h4>
              {analytics.avgTimeInStage.length === 0 ? (
                <p className="dh-analytics-empty">Not enough data yet.</p>
              ) : (() => {
                const maxDays = Math.max(...analytics.avgTimeInStage.map(s => s.avgDays), 1);
                return (
                  <div className="dh-funnel-list">
                    {analytics.avgTimeInStage.map(s => (
                      <div key={s.stage} className="dh-funnel-item">
                        <div className="dh-funnel-label">
                          <span>{s.stage}</span>
                          <span className="dh-funnel-rate">{s.avgDays}d</span>
                        </div>
                        <div className="dh-bar-track">
                          <div
                            className="dh-bar-fill dh-bar-fill--time"
                            style={{ width: `${Math.min((s.avgDays / maxDays) * 100, 100)}%` }}
                          />
                        </div>
                        <div className="dh-funnel-counts">{s.sampleSize} sample{s.sampleSize !== 1 ? "s" : ""}</div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
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
            
            <div className="dh-filter-group">
  <label className="dh-filter-label">Sort by</label>
  <select
    className="dh-filter-select"
    value={sortBy}
    onChange={e => setSortBy(e.target.value)}
  >
    <option value="lastActivity">Last activity</option>
    <option value="deadline">Deadline</option>
    <option value="company">Company</option>
    <option value="createdDate">Created date</option>
  </select>
</div>

<div className="dh-filter-group">
  <label className="dh-filter-label">Order</label>
  <select
    className="dh-filter-select"
    value={sortDirection}
    onChange={e => setSortDirection(e.target.value)}
  >
    <option value="desc">Descending</option>
    <option value="asc">Ascending</option>
  </select>
</div>





        {hasActiveFilters && (
          <button className="dh-clear-all-filters" onClick={clearFilters}>✕ Clear filters</button>
        )}
      </div>

      {loading ? (
        <div className="dh-loading"><div className="dh-spinner" /><p>Loading jobs…</p></div>
      ) : error ? (
        <div className="dh-error" role="alert"><p>⚠️ {error}</p><button className="btn-primary" onClick={fetchJobs}>Retry</button></div>
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
          {filtered.map(job => (
            <JobCard
              key={job._id}
              job={job}
              onEdit={openEdit}
              onDelete={handleDelete}
              onArchive={handleArchive}
              onStatusChange={handleStatusChange}
              onView={setViewingJob}
              isArchived={false}
            />
          ))}
        </div>
      )}

      {archivedJobs.length > 0 && (
        <div className="dh-archived-section">
          <button className="dh-archived-toggle" onClick={() => setShowArchived(o => !o)}>
            Archived Jobs ({archivedJobs.length}) {showArchived ? "▲" : "▼"}
          </button>
          {showArchived && (
            <div className="dh-grid">
              {archivedJobs.map(job => (
                <JobCard
                  key={job._id}
                  job={job}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onRestore={handleRestore}
                  isArchived={true}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {showForm && <JobForm job={editingJob} onSave={handleSave} onClose={closeForm} loading={formLoading} />}
      {viewingJob && (
        <JobDetail
          job={viewingJob}
          onClose={() => setViewingJob(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onArchive={handleArchive}
          onStatusChange={handleStatusChange}
          onJobUpdated={(updatedJob) => {
            setJobs((prev) => prev.map((j) => (j._id === updatedJob._id ? updatedJob : j)));
            if (viewingJob?._id === updatedJob._id) setViewingJob(updatedJob);
          }}
        />
      )}
      {pendingDeleteId && (
        <ConfirmDialog
          title="Delete job application?"
          message="This will permanently remove the application. This action cannot be undone."
          confirmLabel="Delete"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDeleteId(null)}
        />
      )}
    </>
  );
}
