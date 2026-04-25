import { useState, useEffect } from "react";
import { getToken } from "../services/auth-service.js";

import { listDocuments, deleteDocument, getDocument, addDocumentVersion, downloadDocx, aiRewriteDocument, uploadDocument } from "../services/documents-api.js";

import { listDocuments, deleteDocument, getDocument, addDocumentVersion, downloadDocx, aiRewriteDocument, duplicateDocument, renameDocument } from "../services/documents-api.js";

import "./DocumentsPage.css";

const ALL = "All";
const DOCUMENT_TYPES_LIST = ["Resume", "Cover Letter"];
const DOCUMENT_STATUSES_LIST = ["Draft", "Ready", "Archived"];

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
  const [filterType, setFilterType] = useState(ALL);
  const [filterStatus, setFilterStatus] = useState(ALL);
  const [filterTag, setFilterTag] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [availableTags, setAvailableTags] = useState([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({ name: "", type: "Resume", category: "General", status: "Draft" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [renamingDocId, setRenamingDocId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [duplicating, setDuplicating] = useState(null);


  const refreshDocuments = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      const token = getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      
      const filters = {};
      if (filterType !== ALL) filters.type = filterType;
      if (filterStatus !== ALL) filters.status = filterStatus;
      if (filterTag) filters.tag = filterTag;
      if (sortBy) filters.sortBy = sortBy;
      if (sortOrder) filters.sortOrder = sortOrder;
      
      const result = await listDocuments(token, filters);
      if (result.success) {
        setDocuments(result.data);
        const tags = [...new Set(result.data.flatMap(d => d.tags || []))];
        setAvailableTags(tags);
      } else {
        setError(result.error?.message || "Failed to load documents");
      }
      setLoading(false);
    };
    
    loadDocuments();
  }, [filterType, filterStatus, filterTag, sortBy, sortOrder, refreshTrigger]);

  useEffect(() => {
    const checkForNewDocuments = () => {
      const timestamp = localStorage.getItem('document-generated');
      if (timestamp) {
        localStorage.removeItem('document-generated');
        refreshDocuments();
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
      refreshDocuments();
    }
  };

  const clearFilters = () => {
    setFilterType(ALL);
    setFilterStatus(ALL);
    setFilterTag("");
  };

  const hasActiveFilters = filterType !== ALL || filterStatus !== ALL || filterTag;

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
      refreshDocuments();
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
      refreshDocuments();
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

  const handleDuplicate = async (docId) => {
    setDuplicating(docId);
    const token = getToken();
    const result = await duplicateDocument(token, docId);
    if (result.success) refreshDocuments();
    setDuplicating(null);
  };

  const handleRenameStart = (doc) => {
    setRenamingDocId(doc._id);
    setRenameValue(doc.name);
  };

  const handleRenameSubmit = async (docId) => {
    if (!renameValue.trim()) { setRenamingDocId(null); return; }
    const token = getToken();
    const result = await renameDocument(token, docId, renameValue.trim());
    if (result.success) {
      setDocuments(prev => prev.map(d => d._id === docId ? { ...d, name: result.data.name } : d));
    }
    setRenamingDocId(null);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) {
      setUploadError("Only PDF and DOCX files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("File must be 5MB or smaller.");
      return;
    }
    setUploadError(null);
    setUploadFile(file);
    if (!uploadMeta.name) {
      setUploadMeta(prev => ({ ...prev, name: file.name.replace(/\.[^/.]+$/, "") }));
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) { setUploadError("Please select a file."); return; }
    setUploading(true);
    setUploadError(null);
    const token = getToken();
    const result = await uploadDocument(token, uploadFile, uploadMeta);
    if (result.success) {
      setDocuments(prev => [result.data, ...prev]);
      setShowUploadForm(false);
      setUploadFile(null);
      setUploadMeta({ name: "", type: "Resume", category: "General", status: "Draft" });
    } else {
      setUploadError(result.error?.message || "Upload failed.");
    }
    setUploading(false);
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
        <button className="btn-upload-document" onClick={() => setShowUploadForm(v => !v)}>
          {showUploadForm ? "Cancel Upload" : "Upload Document"}
        </button>
      </div>

      <div className="doc-filters">
        <div className="doc-filter-group">
          <label className="doc-filter-label">Type</label>
          <select className="doc-filter-select" value={filterType} onChange={e => setFilterType(e.target.value)}>
            <option value={ALL}>All types</option>
            {DOCUMENT_TYPES_LIST.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        <div className="doc-filter-group">
          <label className="doc-filter-label">Status</label>
          <select className="doc-filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value={ALL}>All statuses</option>
            {DOCUMENT_STATUSES_LIST.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div className="doc-filter-group">
          <label className="doc-filter-label">Tag</label>
          <select className="doc-filter-select" value={filterTag} onChange={e => setFilterTag(e.target.value)} disabled={availableTags.length === 0}>
            <option value="">All tags</option>
            {availableTags.map(tag => (
              <option key={tag} value={tag}>{tag}</option>
            ))}
          </select>
        </div>

        <div className="doc-filter-group">
          <label className="doc-filter-label">Sort by</label>
          <select className="doc-filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
            <option value="updatedAt">Last updated</option>
            <option value="createdAt">Created date</option>
            <option value="name">Name</option>
            <option value="type">Type</option>
            <option value="status">Status</option>
          </select>
        </div>

        <div className="doc-filter-group">
          <label className="doc-filter-label">Order</label>
          <select className="doc-filter-select" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {hasActiveFilters && (
          <button className="doc-clear-all" onClick={clearFilters}>✕ Clear filters</button>
        )}
      </div>

      {showUploadForm && (
        <form className="upload-document-form" onSubmit={handleUploadSubmit}>
          <h3>Upload a Document</h3>
          <div className="upload-form-row">
            <label>File <span className="upload-hint">(PDF or DOCX, max 5MB)</span></label>
            <input type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onChange={handleFileChange} required />
          </div>
          <div className="upload-form-row">
            <label>Name</label>
            <input type="text" maxLength={200} value={uploadMeta.name} onChange={e => setUploadMeta(prev => ({ ...prev, name: e.target.value }))} placeholder="Document name" />
          </div>
          <div className="upload-form-row">
            <label>Type</label>
            <select value={uploadMeta.type} onChange={e => setUploadMeta(prev => ({ ...prev, type: e.target.value }))}>
              <option value="Resume">Resume</option>
              <option value="Cover Letter">Cover Letter</option>
            </select>
          </div>
          <div className="upload-form-row">
            <label>Category</label>
            <select value={uploadMeta.category} onChange={e => setUploadMeta(prev => ({ ...prev, category: e.target.value }))}>
              {["General", "Frontend", "Backend", "Data", "DevOps", "Full Stack", "Other"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="upload-form-row">
            <label>Status</label>
            <select value={uploadMeta.status} onChange={e => setUploadMeta(prev => ({ ...prev, status: e.target.value }))}>
              <option value="Draft">Draft</option>
              <option value="Ready">Ready</option>
              <option value="Archived">Archived</option>
            </select>
          </div>
          {uploadError && <p className="upload-error">{uploadError}</p>}
          <button type="submit" className="btn-submit-upload" disabled={uploading}>
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </form>
      )}

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
          <p>Generate AI resumes and cover letters from the Job Board, or upload a PDF/DOCX file above.</p>
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
              {renamingDocId === doc._id ? (
                <div className="rename-inline">
                  <input
                    className="rename-input"
                    value={renameValue}
                    onChange={e => setRenameValue(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleRenameSubmit(doc._id);
                      if (e.key === "Escape") setRenamingDocId(null);
                    }}
                    autoFocus
                    maxLength={200}
                  />
                  <button className="btn-rename-confirm" onClick={() => handleRenameSubmit(doc._id)}>Save</button>
                  <button className="btn-rename-cancel" onClick={() => setRenamingDocId(null)}>✕</button>
                </div>
              ) : (
                <h3 className="document-name" title="Click to rename" onClick={() => handleRenameStart(doc)} style={{ cursor: "pointer" }}>{doc.name}</h3>
              )}
              <p className="document-category">{doc.category}</p>
              {doc.tags && doc.tags.length > 0 && (
                <div className="document-tags">
                  {doc.tags.map((tag, i) => (
                    <span key={i} className="document-tag">{tag}</span>
                  ))}
                </div>
              )}
              <div className="document-meta">
                <span>{formatDate(doc.createdAt)}</span>
                <span>{doc.versions?.length || 0} version(s)</span>
              </div>
              {doc.linkedJobs?.length > 0 && (
                <p className="document-linked">Linked to {doc.linkedJobs.length} job(s)</p>
              )}
              <div className="document-actions">
                <button className="btn-view-document" onClick={() => handleView(doc)}>View</button>
                <button className="btn-rename-document" onClick={() => handleRenameStart(doc)}>Rename</button>
                <button className="btn-duplicate-document" onClick={() => handleDuplicate(doc._id)} disabled={duplicating === doc._id}>
                  {duplicating === doc._id ? "Copying..." : "Duplicate"}
                </button>
                <button className="btn-delete-document" onClick={() => handleDelete(doc._id)}>Delete</button>
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
