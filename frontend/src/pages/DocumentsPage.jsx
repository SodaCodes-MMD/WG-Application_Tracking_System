/*
 * S3-019: memoized displayedDocuments and availableTags with useMemo to avoid
 * recomputation on unrelated state changes; added role="alert" on error messages.
 */
import { useState, useEffect, useMemo, useRef } from "react";
import { getToken } from "../services/auth-service.js";

import { listDocuments, deleteDocument, getDocument, addDocumentVersion, downloadDocx, aiRewriteDocument, uploadDocument, duplicateDocument, renameDocument, archiveDocument, restoreDocument } from "../services/documents-api.js";

import "./DocumentsPage.css";

const ALL = "All";
const DOCUMENT_TYPES_LIST = ["Resume", "Cover Letter", "Notes", "Other"];
const DOCUMENT_STATUSES_LIST = ["Draft", "Ready", "Archived"];

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [viewingContent, setViewingContent] = useState("");
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const editorRef = useRef(null);
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
  // availableTags is derived from documents — no separate state needed
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadMeta, setUploadMeta] = useState({ name: "", type: "Resume", category: "General", status: "Draft" });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [renamingDocId, setRenamingDocId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [duplicating, setDuplicating] = useState(null);
  const [showArchivedDocs, setShowArchivedDocs] = useState(false);


  const availableTags = useMemo(
    () => [...new Set(documents.flatMap(d => d.tags || []))],
    [documents]
  );

  const activeDocs = useMemo(() => documents.filter(d => d.status !== "Archived"), [documents]);
  const archivedDocs = useMemo(() => documents.filter(d => d.status === "Archived"), [documents]);
  const displayedDocuments = useMemo(() => activeDocs, [activeDocs]);

  const refreshDocuments = () => setRefreshTrigger(prev => prev + 1);

  useEffect(() => {
    const loadDocuments = async () => {
      setLoading(true);
      setError(null);
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
      } else {
        setError(result.error?.message || "Failed to load documents");
      }
      setLoading(false);
    };

    loadDocuments();
  }, [filterType, filterStatus, filterTag, sortBy, sortOrder, refreshTrigger]);

  useEffect(() => {
    const checkForUpdates = () => {
      const ts = localStorage.getItem("document-generated");
      if (ts) {
        localStorage.removeItem("document-generated");
        refreshDocuments();
      }
    };

    const interval = setInterval(checkForUpdates, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = viewingContent || "";
      if (isEditing) editorRef.current.focus();
    }
  }, [isEditing, viewingContent]);

  const handleDelete = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    const token = getToken();
    const result = await deleteDocument(token, docId);
    if (result.success) {
      refreshDocuments();
    }
  };

  const handleArchive = async (docId) => {
    const token = getToken();
    const result = await archiveDocument(token, docId);
    if (result.success) {
      setDocuments(prev => prev.map(d => d._id === docId ? result.data : d));
    }
  };

  const handleRestore = async (docId) => {
    const token = getToken();
    const result = await restoreDocument(token, docId);
    if (result.success) {
      setDocuments(prev => prev.map(d => d._id === docId ? result.data : d));
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
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const content = editorRef.current?.innerHTML;
    if (!selectedDoc || !content?.trim()) return;
    setSaving(true);
    const token = getToken();
    const result = await addDocumentVersion(token, selectedDoc._id, content);
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

  const getLinkedJobNames = (linkedJobs) => {
    if (!linkedJobs?.length) return null;
    return linkedJobs
      .filter(j => j && typeof j === "object" && j.title)
      .map(j => j.title + (j.company ? ` at ${j.company}` : ""));
  };

  const getTypeBadgeClass = (type) =>
    "document-type-badge " + (type || "").toLowerCase().replace(/\s+/g, "-");

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
          {uploadError && <p className="upload-error" role="alert">{uploadError}</p>}
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
          <p className="error-message" role="alert">{error}</p>
          <button className="btn-primary" onClick={refreshDocuments}>Try Again</button>
        </div>
      ) : displayedDocuments.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📄</div>
          <h3>No documents yet</h3>

        </div>
      ) : (
        <div className="documents-grid">
          {displayedDocuments.map(doc => {
            const linkedNames = getLinkedJobNames(doc.linkedJobs);
            const versionCount = doc.versions?.length || 0;
            return (
              <div
                key={doc._id}
                className="document-card document-card-clickable"
                onClick={() => handleView(doc)}
              >
                <div className="document-card-header">
                  <span className={getTypeBadgeClass(doc.type)}>
                    {doc.type}
                  </span>
                  <span className={`document-status-badge ${doc.status.toLowerCase()}`}>
                    {doc.status}
                  </span>
                </div>
                {renamingDocId === doc._id ? (
                  <div className="rename-inline" onClick={e => e.stopPropagation()}>
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
                  <h3 className="document-name" title="Click to rename" onClick={e => { e.stopPropagation(); handleRenameStart(doc); }}>{doc.name}</h3>
                )}
                {doc.category && doc.category !== "General" && (
                  <p className="document-category">{doc.category}</p>
                )}
                {doc.tags && doc.tags.length > 0 && (
                  <div className="document-tags">
                    {doc.tags.map((tag, i) => (
                      <span key={i} className="document-tag">{tag}</span>
                    ))}
                  </div>
                )}
                <div className="document-meta">
                  <span>Updated {formatDate(doc.updatedAt)}</span>
                  <span>{versionCount} version{versionCount !== 1 ? "s" : ""}</span>
                </div>
                {linkedNames && linkedNames.length > 0 && (
                  <p className="document-linked-jobs">
                    {linkedNames.length === 1
                      ? linkedNames[0]
                      : `${linkedNames[0]} +${linkedNames.length - 1} more`}
                  </p>
                )}
                <div className="document-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-view-document" onClick={() => handleView(doc)}>View</button>
                  <button className="btn-rename-document" onClick={() => handleRenameStart(doc)}>Rename</button>
                  <button className="btn-duplicate-document" onClick={() => handleDuplicate(doc._id)} disabled={duplicating === doc._id}>
                    {duplicating === doc._id ? "Copying..." : "Duplicate"}
                  </button>
                  <button className="btn-archive-document" onClick={() => handleArchive(doc._id)}>Archive</button>
                  <button className="btn-delete-document" onClick={() => handleDelete(doc._id)}>Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {archivedDocs.length > 0 && (
        <div className="doc-archived-section">
          <button className="doc-archived-toggle" onClick={() => setShowArchivedDocs(o => !o)}>
            Archived Documents ({archivedDocs.length}) {showArchivedDocs ? "▲" : "▼"}
          </button>
          {showArchivedDocs && (
            <div className="documents-grid">
              {archivedDocs.map(doc => (
                <div key={doc._id} className="document-card document-card-archived">
                  <div className="document-card-header">
                    <span className={getTypeBadgeClass(doc.type)}>{doc.type}</span>
                    <span className="document-status-badge archived">Archived</span>
                  </div>
                  <h3 className="document-name">{doc.name}</h3>
                  {doc.category && doc.category !== "General" && (
                    <p className="document-category">{doc.category}</p>
                  )}
                  <div className="document-meta">
                    <span>Updated {formatDate(doc.updatedAt)}</span>
                  </div>
                  <div className="document-actions">
                    <button className="btn-restore-document" onClick={() => handleRestore(doc._id)}>Restore</button>
                    <button className="btn-delete-document" onClick={() => handleDelete(doc._id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {selectedDoc && (
        <div className="document-view-overlay" onClick={handleCloseView}>
          <div className="document-view-modal" onClick={e => e.stopPropagation()}>
            <div className="document-view-header">
              <div className="document-view-title-section">
                <h3>{selectedDoc.name}</h3>
                <span className={getTypeBadgeClass(selectedDoc.type)}>
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
                <div
                  ref={editorRef}
                  className="document-editor-page"
                  contentEditable={isEditing}
                  suppressContentEditableWarning={true}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
