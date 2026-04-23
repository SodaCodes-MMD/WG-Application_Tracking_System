import { useState, useEffect } from "react";
import { getToken } from "../services/auth-service.js";
import { listDocuments, deleteDocument, getDocument, addDocumentVersion, downloadDocx, aiRewriteDocument } from "../services/documents-api.js";

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewingContent, setViewingContent] = useState("");
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [downloadingDocx, setDownloadingDocx] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const [rewrittenContent, setRewrittenContent] = useState(null);
  const [rewriteInstruction, setRewriteInstruction] = useState("");
  const [showRewriteInput, setShowRewriteInput] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      const result = await listDocuments(token);
      if (result.success) {
        setDocuments(result.data);
      } else {
        setError(result.error?.message || "Failed to load documents");
      }
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const checkForNewDocuments = () => {
      const timestamp = localStorage.getItem('document-generated');
      if (timestamp) {
        localStorage.removeItem('document-generated');
        (async () => {
          const token = getToken();
          if (token) {
            const result = await listDocuments(token);
            if (result.success) {
              setDocuments(result.data);
            }
          }
        })();
      }
    };

    const interval = setInterval(checkForNewDocuments, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    const token = getToken();
    const result = await deleteDocument(token, docId);
    if (result.success) {
      setDocuments(prev => prev.filter(d => d._id !== docId));
    }
  };

  const handleView = async (doc) => {
    setSelectedDoc(doc);
    const token = getToken();
    const result = await getDocument(token, doc._id);
    if (result.success && result.data.versions?.length > 0) {
      const latestVersion = result.data.versions[result.data.versions.length - 1];
      setSelectedVersion(latestVersion);
      setViewingContent(latestVersion.content);
      setIsEditing(false);
    }
  };

  const handleVersionChange = (version) => {
    setSelectedVersion(version);
    setViewingContent(version.content);
    setIsEditing(false);
  };

  const handleEdit = () => {
    setEditContent(viewingContent);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedDoc || !editContent.trim()) return;
    setSaving(true);
    const token = getToken();
    const result = await addDocumentVersion(token, selectedDoc._id, editContent);
    if (result.success) {
      setSelectedDoc(result.data);
      const newVersion = result.data.versions[result.data.versions.length - 1];
      setSelectedVersion(newVersion);
      setViewingContent(newVersion.content);
      setIsEditing(false);
      setDocuments(prev => prev.map(d => d._id === selectedDoc._id ? result.data : d));
    }
    setSaving(false);
  };

  const handleDownloadDocx = async () => {
    if (!selectedDoc?._id) return;
    setDownloadingDocx(true);
    const token = getToken();
    await downloadDocx(token, selectedDoc._id, selectedVersion?._id, {
      type: selectedDoc.type,
      name: selectedDoc.name,
      versionNumber: selectedVersion?.versionNumber,
    });
    setDownloadingDocx(false);
  };

  const isHtmlContent = (content) => content && content.trimStart().startsWith("<");

  const handleAiRewrite = async () => {
    setRewriting(true);
    const token = getToken();
    const result = await aiRewriteDocument(token, selectedDoc._id, rewriteInstruction);
    if (result.success) {
      setRewrittenContent(result.data.rewritten);
      setShowRewriteInput(false);
    }
    setRewriting(false);
  };

  const handleAcceptRewrite = async () => {
    setSaving(true);
    const token = getToken();
    const result = await addDocumentVersion(token, selectedDoc._id, rewrittenContent);
    if (result.success) {
      setSelectedDoc(result.data);
      const newVersion = result.data.versions[result.data.versions.length - 1];
      setSelectedVersion(newVersion);
      setViewingContent(newVersion.content);
      setDocuments(prev => prev.map(d => d._id === selectedDoc._id ? result.data : d));
      setRewrittenContent(null);
      setRewriteInstruction("");
    }
    setSaving(false);
  };

  const handleDiscardRewrite = () => {
    setRewrittenContent(null);
    setRewriteInstruction("");
    setShowRewriteInput(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent("");
  };

  const handleCloseView = () => {
    setSelectedDoc(null);
    setSelectedVersion(null);
    setViewingContent("");
    setIsEditing(false);
    setEditContent("");
    setRewrittenContent(null);
    setRewriteInstruction("");
    setShowRewriteInput(false);
  };

  const formatDate = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <>
      <div className="page-header">
        <h2>Document Library</h2>
        <p>Store and manage your resumes, cover letters, and other application materials.</p>
      </div>

      {loading ? (
        <div className="loading-container">
          <p>Loading documents...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
        </div>
      ) : documents.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>No documents yet</h3>
          <p>Generate AI resumes and cover letters from the Job Board to see them here.</p>
        </div>
      ) : (
        <div className="documents-grid">
          {documents.map(doc => (
            <div key={doc._id} className="document-card">
              <div className="document-card-header">
                <span className={`document-type-badge ${doc.type.toLowerCase().replace(" ", "-")}`}>
                  {doc.type}
                </span>
                <span className={`document-status-badge ${doc.status.toLowerCase()}`}>
                  {doc.status}
                </span>
              </div>
              <h3 className="document-name">{doc.name}</h3>
              <p className="document-category">{doc.category}</p>
              <div className="document-meta">
                <span>{formatDate(doc.createdAt)}</span>
                <span>{doc.versions?.length || 0} version(s)</span>
              </div>
              {doc.linkedJobs?.length > 0 && (
                <p className="document-linked">Linked to {doc.linkedJobs.length} job(s)</p>
              )}
              <div className="document-actions">
                <button 
                  className="btn-view-document"
                  onClick={() => handleView(doc)}
                >
                  View
                </button>
                <button 
                  className="btn-delete-document"
                  onClick={() => handleDelete(doc._id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedDoc && (
        <div className="document-view-overlay" onClick={handleCloseView}>
          <div className="document-view-modal" onClick={e => e.stopPropagation()}>
            <div className="document-view-header">
              <div className="document-view-title-section">
                <h3>{selectedDoc.name}</h3>
                <span className={`document-type-badge ${selectedDoc.type.toLowerCase().replace(" ", "-")}`}>
                  {selectedDoc.type}
                </span>
              </div>
              <button className="document-view-close" onClick={handleCloseView} aria-label="Close">✕</button>
            </div>

            <div className="document-view-controls">
              <div className="version-selector">
                <label htmlFor="version-select">Version:</label>
                <select 
                  id="version-select"
                  value={selectedVersion?._id || ""}
                  onChange={e => {
                    const version = selectedDoc.versions.find(v => v._id === e.target.value);
                    if (version) handleVersionChange(version);
                  }}
                >
                  {selectedDoc.versions?.slice().reverse().map((v) => (
                    <option key={v._id} value={v._id}>
                      Version {v.versionNumber} - {formatDate(v.createdAt)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="document-view-actions">
                {isHtmlContent(viewingContent) && !isEditing && !rewrittenContent && (
                  <button className="btn-download-docx" onClick={handleDownloadDocx} disabled={downloadingDocx}>
                    {downloadingDocx ? "Downloading..." : "Download DOCX"}
                  </button>
                )}
                {!isEditing && !rewrittenContent && (
                  <button className="btn-ai-improve" onClick={() => setShowRewriteInput(v => !v)} disabled={rewriting}>
                    AI Improve
                  </button>
                )}
                {!isEditing && !rewrittenContent ? (
                  <button className="btn-edit-document" onClick={handleEdit}>
                    Edit / Save New Version
                  </button>
                ) : rewrittenContent ? null : (
                  <>
                    <button
                      className="btn-save-document"
                      onClick={handleSaveEdit}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save New Version"}
                    </button>
                    <button className="btn-cancel-edit" onClick={handleCancelEdit}>
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>

            {showRewriteInput && !rewrittenContent && (
              <div className="rewrite-input-bar">
                <input
                  className="rewrite-instruction-input"
                  type="text"
                  placeholder="Optional: give instructions (e.g. make it more concise, stronger action verbs...)"
                  value={rewriteInstruction}
                  onChange={e => setRewriteInstruction(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !rewriting && handleAiRewrite()}
                />
                <button className="btn-run-rewrite" onClick={handleAiRewrite} disabled={rewriting}>
                  {rewriting ? "Rewriting..." : "Run"}
                </button>
                <button className="btn-cancel-rewrite" onClick={() => setShowRewriteInput(false)}>Cancel</button>
              </div>
            )}

            {rewrittenContent ? (
              <div className="rewrite-compare-wrapper">
                <div className="rewrite-compare-actions">
                  <button className="btn-accept-rewrite" onClick={handleAcceptRewrite} disabled={saving}>
                    {saving ? "Saving..." : "Save as New Version"}
                  </button>
                  <button className="btn-discard-rewrite" onClick={handleDiscardRewrite}>Discard</button>
                </div>
                <div className="rewrite-compare-panes">
                  <div className="rewrite-pane">
                    <div className="rewrite-pane-label">Original</div>
                    {isHtmlContent(viewingContent) ? (
                      <iframe className="document-html-preview" srcDoc={viewingContent} title="Original" sandbox="allow-same-origin" />
                    ) : (
                      <div className="document-content-display">
                        {viewingContent.split('\n').map((line, i) => <p key={i}>{line || <br />}</p>)}
                      </div>
                    )}
                  </div>
                  <div className="rewrite-pane">
                    <div className="rewrite-pane-label rewrite-pane-label--new">AI Rewrite</div>
                    {isHtmlContent(rewrittenContent) ? (
                      <iframe className="document-html-preview" srcDoc={rewrittenContent} title="AI Rewrite" sandbox="allow-same-origin" />
                    ) : (
                      <div className="document-content-display">
                        {rewrittenContent.split('\n').map((line, i) => <p key={i}>{line || <br />}</p>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="document-view-content">
                {isEditing ? (
                  <textarea
                    className="document-edit-textarea"
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    placeholder="Edit your document content..."
                    autoFocus
                  />
                ) : isHtmlContent(viewingContent) ? (
                  <iframe
                    className="document-html-preview"
                    srcDoc={viewingContent}
                    title="Resume Preview"
                    sandbox="allow-same-origin"
                  />
                ) : (
                  <div className="document-content-display">
                    {viewingContent.split('\n').map((line, i) => (
                      <p key={i}>{line || <br />}</p>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
