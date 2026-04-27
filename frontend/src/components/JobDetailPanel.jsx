import { useState, useEffect } from "react";
import { getToken } from "../services/auth-service.js";
import { getProfile } from "../services/profile-api.js";
import { getDocumentsByJob, generateAiCoverLetter, generateAiResume, addDocumentVersion, listDocuments, linkDocumentToJob, unlinkDocumentFromJob } from "../services/documents-api.js";
import "./JobDetailPanel.css";

export default function JobDetailPanel({ job, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");
  const [editingDoc, setEditingDoc] = useState(null);
  const [docContent, setDocContent] = useState("");

  // S3-009: library picker state
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [libraryDocs, setLibraryDocs] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const token = getToken();
      if (!token) {
        setLoadingDocs(false);
        return;
      }
      const result = await getDocumentsByJob(token, job._id);
      if (result.success) {
        setDocuments(result.data);
      }
      setLoadingDocs(false);
    })();
  }, [job._id]);

  const handleGenerateCoverLetter = async () => {
    setGenerating(true);
    setError(null);
    setSuccess("");

    const token = getToken();
    if (!token) {
      setError("Please log in to generate a cover letter.");
      setGenerating(false);
      return;
    }

    const profileResult = await getProfile(token);
    if (!profileResult.success || !profileResult.data) {
      setError("Please complete your profile before generating a cover letter.");
      setGenerating(false);
      return;
    }

    const result = await generateAiCoverLetter(token, job._id);
    if (result.success) {
      setDocuments(prev => [result.data, ...prev]);
      localStorage.setItem('document-generated', Date.now().toString());
      setSuccess("AI cover letter generated successfully.");
    } else {
      setError(result.error?.message || "Failed to generate cover letter");
    }
    setGenerating(false);
  };

  const handleGenerateResume = async () => {
    setGeneratingResume(true);
    setError(null);
    setSuccess("");

    const token = getToken();
    if (!token) {
      setError("Please log in to generate a resume.");
      setGeneratingResume(false);
      return;
    }

    const profileResult = await getProfile(token);
    if (!profileResult.success || !profileResult.data) {
      setError("Please complete your profile before generating a resume.");
      setGeneratingResume(false);
      return;
    }

    const result = await generateAiResume(token, job._id);
    if (result.success) {
      setDocuments(prev => [result.data, ...prev]);
      localStorage.setItem('document-generated', Date.now().toString());
      setSuccess("AI resume generated successfully.");
    } else {
      setError(result.error?.message || "Failed to generate resume");
    }
    setGeneratingResume(false);
  };

  // S3-009: open library picker and load unlinked documents
  const openLibraryPicker = async () => {
    setShowLibraryPicker(true);
    setLibraryLoading(true);
    setError(null);
    const token = getToken();
    const res = await listDocuments(token);
    if (res.success) {
      const linkedIds = new Set(documents.map(d => d._id));
      setLibraryDocs((res.data || []).filter(d => !linkedIds.has(d._id) && d.status !== "Archived"));
    } else {
      setError(res.error?.message || "Failed to load library");
    }
    setLibraryLoading(false);
  };

  // S3-009: link selected library document to this job
  const handleLinkDocument = async (docId) => {
    const token = getToken();
    const res = await linkDocumentToJob(token, docId, job._id);
    if (res.success) {
      setDocuments(prev => [...prev, res.data]);
      setLibraryDocs(prev => prev.filter(d => d._id !== docId));
      setSuccess("Document linked.");
      setError(null);
    } else {
      setError(res.error?.message || "Failed to link document");
    }
  };

  // S3-009: unlink document from job without deleting it
  const handleUnlinkDocument = async (docId) => {
    if (!window.confirm("Unlink this document from the job? The document remains in your library.")) return;
    const token = getToken();
    const res = await unlinkDocumentFromJob(token, docId, job._id);
    if (res.success) {
      setDocuments(prev => prev.filter(d => d._id !== docId));
      setSuccess("Document unlinked.");
      setError(null);
    } else {
      setError(res.error?.message || "Failed to unlink document");
    }
  };

  const handleEditDocument = (doc) => {
    setEditingDoc(doc);
    setDocContent(doc.versions[doc.versions.length - 1]?.content || "");
  };

  const handleSaveDocument = async () => {
    if (!editingDoc) return;
    const token = getToken();
    const result = await addDocumentVersion(token, editingDoc._id, docContent);
    if (result.success) {
      setDocuments(prev => prev.map(d => d._id === editingDoc._id ? result.data : d));
      setEditingDoc(null);
    }
  };

  return (
    <div className="jdp-overlay" onClick={onClose}>
      <div className="jdp-panel" onClick={e => e.stopPropagation()}>
        <div className="jdp-header">
          <button className="jdp-back" onClick={onClose}> Back </button>
          <div className="jdp-title">
            <h2>{job.title}</h2>
            <p>{job.company}</p>
          </div>
        </div>

        <div className="jdp-body">
          <div className="jdp-section">
            <div className="jdp-section-head">
              <h3 className="jdp-section-title">Documents</h3>
              {/* S3-009: new button — opens library picker */}
              <button className="jdp-doc-btn" onClick={openLibraryPicker}>Link from Library</button>
            </div>

            <button
              className="jdp-generate-btn"
              onClick={handleGenerateCoverLetter}
              disabled={generating}
            >
              {generating ? "Generating..." : "Generate AI Cover Letter"}
            </button>
            <button
              className="jdp-generate-btn"
              onClick={handleGenerateResume}
              disabled={generatingResume}
            >
              {generatingResume ? "Generating..." : "Generate AI Resume"}
            </button>

            {error && <p className="jdp-error">{error}</p>}
            {success && <p className="jdp-success">{success}</p>}

            {/* S3-009: library picker panel — shows user's unlinked, non-archived docs */}
            {showLibraryPicker && (
              <div className="jdp-library-picker">
                <div className="jdp-section-head">
                  <strong>Your Library</strong>
                  <button className="jdp-cancel-btn" onClick={() => setShowLibraryPicker(false)}>Close</button>
                </div>
                {libraryLoading ? <p className="jdp-loading">Loading...</p> : (
                  <div className="jdp-doc-list">
                    {libraryDocs.map(doc => (
                      <div key={doc._id} className="jdp-doc-item">
                        <div className="jdp-doc-info">
                          <span className="jdp-doc-name">{doc.name}</span>
                          <span className="jdp-doc-type">{doc.type}{doc.category ? ` · ${doc.category}` : ""} · {doc.status}</span>
                        </div>
                        {/* S3-009: link a library document to this job */}
                        <button className="jdp-doc-btn" onClick={() => handleLinkDocument(doc._id)}>Link</button>
                      </div>
                    ))}
                    {libraryDocs.length === 0 && <p className="jdp-empty">No available library documents to link.</p>}
                  </div>
                )}
              </div>
            )}
            {/* S3-009: end library picker panel */}

            {loadingDocs ? (
              <p className="jdp-loading">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="jdp-empty">No documents yet. Generate one or link from your library.</p>
            ) : (
              <div className="jdp-doc-list">
                {documents.map(doc => (
                  <div key={doc._id} className="jdp-doc-item">
                    <div className="jdp-doc-info">
                      <span className="jdp-doc-name">{doc.name}</span>
                      <span className="jdp-doc-type">{doc.type}</span>
                    </div>
                    <div className="jdp-doc-actions">
                      <button className="jdp-doc-btn" onClick={() => handleEditDocument(doc)}>Edit</button>
                      {/* S3-009: unlink button — removes job association without deleting the document */}
                      <button className="jdp-doc-btn" onClick={() => handleUnlinkDocument(doc._id)}>Unlink</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {editingDoc && (
            <div className="jdp-section">
              <h3 className="jdp-section-title">Edit {editingDoc.name}</h3>
              <textarea
                className="jdp-textarea"
                value={docContent}
                onChange={e => setDocContent(e.target.value)}
                rows={15}
              />
              <div className="jdp-btn-row">
                <button className="jdp-save-btn" onClick={handleSaveDocument}>
                  Save New Version
                </button>
                <button className="jdp-cancel-btn" onClick={() => setEditingDoc(null)}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
