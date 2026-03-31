export default function DashboardHome() {
  return (
    <>
      <div className="page-header">
        <h2>Job Board</h2>
        <p>Track and manage your job applications in one place.</p>
      </div>

      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <h3>No jobs yet</h3>
        <p>
          Add your first job application to start tracking your progress
          through the hiring pipeline.
        </p>
        <button className="btn-primary" disabled>
          + Add Job
        </button>
      </div>
    </>
  );
}
