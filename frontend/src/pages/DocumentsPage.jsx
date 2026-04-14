import { useEffect, useState } from "react";
import { documentsApi } from "../services/documents-api.js";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentsApi.list();
      setDocuments(res.data || []);
      setError("");
    } catch (err) {
      setError(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this document?")) {
      return;
    }

    try {
      await documentsApi.remove(id);
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
    } catch (err) {
      alert(err.message || "Failed to delete document");
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Document Library</h2>
        <p>Saved drafts linked to job applications.</p>
      </div>

      {loading ? (
        <div className="stub-page">
          <h2>Loading documents...</h2>
        </div>
      ) : error ? (
        <div className="stub-page">
          <h2>Could not load documents</h2>
          <p>{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="stub-page">
          <h2>No documents yet</h2>
          <p>Open a job and use Save Document to create one.</p>
        </div>
      ) : (
        <div className="dh-grid">
          {documents.map((doc) => (
            <div key={doc._id} className="job-card">
              <div className="job-card-header">
                <div className="job-card-info">
                  <h3 className="job-title">{doc.title}</h3>
                  <p className="job-company">{doc.type}</p>
                </div>
              </div>

              <p className="job-notes">
                {doc.content || "No content"}
              </p>

              <p className="job-meta-item job-date">
                Updated {new Date(doc.updatedAt).toLocaleDateString()}
              </p>

              <div className="jd-footer">
                <button
                  className="btn-jd-delete"
                  onClick={() => handleDelete(doc._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}