/*
 * S3-022: 404 Not Found page shown for unknown authenticated routes inside DashboardPage.
 */
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center" }}>
      <h2>404 — Page Not Found</h2>
      <p style={{ marginTop: "0.75rem", color: "var(--text-secondary)" }}>
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link
        to="/"
        style={{ display: "inline-block", marginTop: "1.5rem", color: "var(--accent)" }}
      >
        Return to Dashboard
      </Link>
    </div>
  );
}
