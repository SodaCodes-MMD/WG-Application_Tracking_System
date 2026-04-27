/*
 * S3-019: wrapped with React.memo to skip re-renders when props are unchanged;
 * added aria-label on close button and role="alert"/"status" on error/success messages.
 */
import { useCallback, useEffect, useMemo, useState, memo } from "react";
import { jobsApi, JOB_STATUSES, STATUS_COLORS, OUTCOME_COLORS, JOB_OUTCOMES } from "../services/jobs-api.js";
import { getToken } from "../services/auth-service.js";
import { getProfile } from "../services/profile-api.js";
import { getDocumentsByJob, generateAiCoverLetter, generateAiResume, addDocumentVersion, deleteDocument, listDocuments, linkDocumentToJob, unlinkDocumentFromJob } from "../services/documents-api.js";
import "./JobDetail.css";

function formatSalary(raw) {
  if (!raw) return null;
  const num = Number(raw);
  if (!isNaN(num) && raw !== "") return "$" + num.toLocaleString();
  return raw;
}

function toDateInput(d) {
  if (!d) return "";
  const dt = new Date(d); 
  return isNaN(dt) ? "" : dt.toISOString().split("T")[0];
}

function JobDetail({ job, onClose, onEdit, onDelete, onArchive, onStatusChange, onJobUpdated }) {
  const [localJob, setLocalJob] = useState(job);
  const [docs, setDocs] = useState([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docError, setDocError] = useState("");
  const [docSuccess, setDocSuccess] = useState("");
  const [editingDocId, setEditingDocId] = useState(null);
  const [docDraft, setDocDraft] = useState("");

  // S3-009: library picker state
  const [showLibrary, setShowLibrary] = useState(false);
  const [libraryDocs, setLibraryDocs] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const [timelineTitle, setTimelineTitle] = useState("");
  const [timelineNotes, setTimelineNotes] = useState("");
  const [timelineDate, setTimelineDate] = useState("");
  const [timelineError, setTimelineError] = useState("");

  const [interviewForm, setInterviewForm] = useState({ roundType: "Phone Screen", date: "", interviewer: "", notes: "" });
  const [interviewError, setInterviewError] = useState("");

  const [saving, setSaving] = useState(false);

  // S2-006: inline field editing
  const [inlineField, setInlineField] = useState(null);
  const [inlineDraft, setInlineDraft] = useState("");
  const [inlineSaving, setInlineSaving] = useState(false);

  // S2-012: follow-up tracking
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpError, setFollowUpError] = useState("");

  useEffect(() => {
    setLocalJob(job);
  }, [job]);

  const loadDocs = useCallback(async () => {
    setDocsLoading(true);
    setDocError("");
    const token = getToken();
    const res = await getDocumentsByJob(token, job._id);
    if (res.success) setDocs(res.data || []);
    else setDocError(res.error?.message || "Failed to load documents");
    setDocsLoading(false);
  }, [job._id]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const colors = STATUS_COLORS[localJob.status] || STATUS_COLORS.Wishlist;
  const outcomeColors = localJob.outcome ? OUTCOME_COLORS[localJob.outcome] : null;

  // General timeline events — follow-ups are handled separately
  const sortedTimeline = useMemo(() => {
    return [...(localJob.timelineEvents || [])]
      .filter((e) => e.type !== "follow-up")
      .sort((a, b) => new Date(b.eventDate) - new Date(a.eventDate));
  }, [localJob.timelineEvents]);

  // Follow-up timeline events only
  const followUps = useMemo(() => {
    return [...(localJob.timelineEvents || [])]
      .filter((e) => e.type === "follow-up")
      .sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
  }, [localJob.timelineEvents]);

  const updateJobState = (nextJob) => {
    setLocalJob(nextJob);
    if (onJobUpdated) onJobUpdated(nextJob);
  };

  const handleStatus = async (status) => {
    await onStatusChange(localJob._id, status);
    updateJobState({ ...localJob, status });
  };

  const handleOutcomePatch = async (patch) => {
    setSaving(true);
    try {
      const res = await jobsApi.update(localJob._id, patch);
      updateJobState(res.data);
    } finally {
      setSaving(false);
    }
  };


  const handleGenerateResume = async () => {
    setSaving(true);
    setDocError("");
    setDocSuccess("");
    const token = getToken();
    const profile = await getProfile(token);
    if (!profile.success || !profile.data) {
      setDocError("Complete your profile before generating a resume.");
      setSaving(false);
      return;
    }
    const res = await generateAiResume(token, localJob._id);
    if (res.success) {
      await loadDocs();
      setDocSuccess("Resume generated successfully.");
      localStorage.setItem("document-generated", Date.now().toString());
    } else {
      setDocError(res.error?.message || "Failed to generate resume");
    }
    setSaving(false);
  };

  // S2-006: inline editing handlers
  const startInline = (field) => {
    setInlineField(field);
    setInlineDraft(localJob[field] || "");
  };

  const commitInline = async (field, value) => {
    setInlineField(null);
    const trimmed = value.trim();
    const prev = (localJob[field] || "").trim();
    if (trimmed === prev) return;
    if ((field === "title" || field === "company") && !trimmed) return;
    setInlineSaving(true);
    try {
      const res = await jobsApi.update(localJob._id, { [field]: trimmed });
      updateJobState(res.data);
    } finally {
      setInlineSaving(false);
    }
  };

  const handleInlineKey = (e, field) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      commitInline(field, inlineDraft);
    } else if (e.key === "Escape") {
      setInlineField(null);
      setInlineDraft("");
    }
  };

  const handleGenerateCoverLetter = async () => {
    setSaving(true);
    setDocError("");
    setDocSuccess("");
    const token = getToken();
    const profile = await getProfile(token);
    if (!profile.success || !profile.data) {
      setDocError("Complete your profile before generating a cover letter.");
      setSaving(false);
      return;
    }
    const res = await generateAiCoverLetter(token, localJob._id);
    if (res.success) {
      await loadDocs();
      setDocSuccess("Cover letter generated successfully.");
      window.alert("Cover letter generated successfully.");
      localStorage.setItem("document-generated", Date.now().toString());
    } else {
      setDocError(res.error?.message || "Failed to generate cover letter");
    }
    setSaving(false);
  };

  const beginEditDoc = (doc) => {
    const latest = doc.versions?.[doc.versions.length - 1];
    setEditingDocId(doc._id);
    setDocDraft(latest?.content || "");
  };

  const saveDocVersion = async () => {
    if (!editingDocId || !docDraft.trim()) return;
    setSaving(true);
    const token = getToken();
    const res = await addDocumentVersion(token, editingDocId, docDraft);
    if (res.success) {
      setDocs((prev) => prev.map((d) => (d._id === editingDocId ? res.data : d)));
      setEditingDocId(null);
      setDocDraft("");
    } else {
      setDocError(res.error?.message || "Failed to save document version");
    }
    setSaving(false);
  };

  const handleDeleteDocument = async (docId) => {
    if (!window.confirm("Delete this document?")) return;
    setSaving(true);
    const token = getToken();
    const res = await deleteDocument(token, docId);
    if (res.success) {
      setDocs((prev) => prev.filter((d) => d._id !== docId));
      if (editingDocId === docId) {
        setEditingDocId(null);
        setDocDraft("");
      }
      setDocSuccess("Document deleted.");
      setDocError("");
    } else {
      setDocError(res.error?.message || "Failed to delete document");
    }
    setSaving(false);
  };

  // S3-009: open library picker and load unlinked documents
  const openLibraryPicker = async () => {
    setShowLibrary(true);
    setLibraryLoading(true);
    setDocError("");
    const token = getToken();
    const res = await listDocuments(token);
    if (res.success) {
      const linkedIds = new Set(docs.map((d) => d._id));
      setLibraryDocs((res.data || []).filter((d) => !linkedIds.has(d._id) && d.status !== "Archived"));
    } else {
      setDocError(res.error?.message || "Failed to load library");
    }
    setLibraryLoading(false);
  };

  // S3-009: link selected document to job
  const handleLinkDocument = async (docId) => {
    setSaving(true);
    const token = getToken();
    const res = await linkDocumentToJob(token, docId, localJob._id);
    if (res.success) {
      await loadDocs();
      setLibraryDocs((prev) => prev.filter((d) => d._id !== docId));
      setDocSuccess("Document linked.");
      setDocError("");
    } else {
      setDocError(res.error?.message || "Failed to link document");
    }
    setSaving(false);
  };

  // S3-009: unlink document from job
  const handleUnlinkDocument = async (docId) => {
    if (!window.confirm("Unlink this document from the job? The document remains in your library.")) return;
    setSaving(true);
    const token = getToken();
    const res = await unlinkDocumentFromJob(token, docId, localJob._id);
    if (res.success) {
      setDocs((prev) => prev.filter((d) => d._id !== docId));
      setDocSuccess("Document unlinked.");
      setDocError("");
    } else {
      setDocError(res.error?.message || "Failed to unlink document");
    }
    setSaving(false);
  };

  const addTimeline = async () => {
    if (!timelineTitle.trim()) {
      setTimelineError("Timeline event title is required");
      return;
    }
    setSaving(true);
    setTimelineError("");
    const res = await jobsApi.addTimelineEvent(localJob._id, {
      title: timelineTitle.trim(),
      notes: timelineNotes.trim(),
      eventDate: timelineDate || null,
    });
    if (res.success) {
      updateJobState(res.data);
      setTimelineTitle("");
      setTimelineNotes("");
      setTimelineDate("");
    } else {
      setTimelineError(res.error?.message || "Failed to add timeline event");
    }
    setSaving(false);
  };

  const removeTimeline = async (eventId) => {
    setSaving(true);
    const res = await jobsApi.removeTimelineEvent(localJob._id, eventId);
    if (res.success) updateJobState(res.data);
    setSaving(false);
  };

  const addInterview = async () => {
    if (!interviewForm.roundType) {
      setInterviewError("Round type is required");
      return;
    }
    setSaving(true);
    setInterviewError("");
    const res = await jobsApi.addInterview(localJob._id, {
      ...interviewForm,
      date: interviewForm.date || null,
    });
    if (res.success) {
      updateJobState(res.data);
      setInterviewForm({ roundType: "Phone Screen", date: "", interviewer: "", notes: "" });
    } else {
      setInterviewError(res.error?.message || "Failed to add interview");
    }
    setSaving(false);
  };

  const deleteInterview = async (interviewId) => {
    setSaving(true);
    const res = await jobsApi.removeInterview(localJob._id, interviewId);
    if (res.success) updateJobState(res.data);
    setSaving(false);
  };

  // S2-012: follow-up handlers
  const addFollowUp = async () => {
    if (!followUpDate) {
      setFollowUpError("Date is required");
      return;
    }
    setSaving(true);
    setFollowUpError("");
    const res = await jobsApi.addTimelineEvent(localJob._id, {
      title: "Follow-up",
      notes: followUpNote.trim(),
      eventDate: followUpDate,
      type: "follow-up",
    });
    if (res.success) {
      updateJobState(res.data);
      setFollowUpDate("");
      setFollowUpNote("");
      setShowFollowUpForm(false);
    } else {
      setFollowUpError(res.error?.message || "Failed to add follow-up");
    }
    setSaving(false);
  };

  const archiveFromDetail = () => {
    if (!onArchive) return;
    onArchive(localJob._id);
    onClose();
  };

  return (
    <div className="jd-overlay" onClick={onClose}>
      <div className="jd-modal jd-modal-wide" onClick={(e) => e.stopPropagation()}>
        <div className="jd-header">
          <div className="jd-header-info">
            {inlineField === "title" ? (
              <input
                className="jd-inline-input jd-inline-title"
                value={inlineDraft}
                autoFocus
                onChange={(e) => setInlineDraft(e.target.value)}
                onBlur={() => commitInline("title", inlineDraft)}
                onKeyDown={(e) => handleInlineKey(e, "title")}
              />
            ) : (
              <h2 className="jd-title jd-editable" title="Click to edit" onClick={() => startInline("title")}>{localJob.title}</h2>
            )}
            {inlineField === "company" ? (
              <input
                className="jd-inline-input jd-inline-company"
                value={inlineDraft}
                autoFocus
                onChange={(e) => setInlineDraft(e.target.value)}
                onBlur={() => commitInline("company", inlineDraft)}
                onKeyDown={(e) => handleInlineKey(e, "company")}
              />
            ) : (
              <p className="jd-company jd-editable" title="Click to edit" onClick={() => startInline("company")}>{localJob.company}</p>
            )}
          </div>
          <div className="jd-header-right">
            {inlineSaving && <span className="jd-save-indicator">Saving…</span>}
            <button className="jd-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="jd-stage-row">
          <label className="jd-label">Stage</label>
          <select className="jd-stage-select" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }} value={localJob.status} onChange={(e) => handleStatus(e.target.value)}>
            {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <label className="jd-label">Outcome</label>
          <select className="jd-stage-select" value={localJob.outcome || ""} disabled={saving} onChange={(e) => handleOutcomePatch({ outcome: e.target.value || null })}>
            <option value="">None</option>
            {JOB_OUTCOMES.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {outcomeColors && <span className="jd-outcome-badge" style={{ background: outcomeColors.bg, color: outcomeColors.text, border: `1px solid ${outcomeColors.border}` }}>{localJob.outcome}</span>}
        </div>

        <div className="jd-body">
          <div className="jd-field">
            <span className="jd-field-label">Location</span>
            {inlineField === "location" ? (
              <input
                className="jd-inline-input"
                value={inlineDraft}
                autoFocus
                onChange={(e) => setInlineDraft(e.target.value)}
                onBlur={() => commitInline("location", inlineDraft)}
                onKeyDown={(e) => handleInlineKey(e, "location")}
              />
            ) : (
              <span className="jd-field-value jd-editable" title="Click to edit" onClick={() => startInline("location")}>{localJob.location || "-"}</span>
            )}
          </div>
          <div className="jd-field">
            <span className="jd-field-label">Salary</span>
            {inlineField === "salary" ? (
              <input
                className="jd-inline-input"
                value={inlineDraft}
                autoFocus
                onChange={(e) => setInlineDraft(e.target.value)}
                onBlur={() => commitInline("salary", inlineDraft)}
                onKeyDown={(e) => handleInlineKey(e, "salary")}
              />
            ) : (
              <span className="jd-field-value jd-editable" title="Click to edit" onClick={() => startInline("salary")}>{formatSalary(localJob.salary) || "-"}</span>
            )}
          </div>
          <div className="jd-field"><span className="jd-field-label">Responded</span><input type="date" value={toDateInput(localJob.respondedAt)} onChange={(e) => handleOutcomePatch({ respondedAt: e.target.value || null })} /></div>
          <div className="jd-field jd-field-block">
            <span className="jd-field-label">Outcome notes</span>
            <textarea className="jd-note-input" rows={2} defaultValue={localJob.outcomeNotes || ""} onBlur={(e) => handleOutcomePatch({ outcomeNotes: e.target.value })} />
          </div>
          <div className="jd-field jd-field-block">
            <span className="jd-field-label">Notes</span>
            {inlineField === "notes" ? (
              <textarea
                className="jd-note-input"
                rows={3}
                value={inlineDraft}
                autoFocus
                onChange={(e) => setInlineDraft(e.target.value)}
                onBlur={() => commitInline("notes", inlineDraft)}
              />
            ) : (
              <span className="jd-field-value jd-editable jd-notes-display" title="Click to edit" onClick={() => startInline("notes")}>
                {localJob.notes || <em className="jd-empty-hint">Click to add notes…</em>}
              </span>
            )}
          </div>

          <section className="jd-section">
            <div className="jd-section-head">
              <h3>Follow-ups</h3>
              <button className="btn-jd-edit" onClick={() => { setShowFollowUpForm((v) => !v); setFollowUpError(""); }}>
                {showFollowUpForm ? "Cancel" : "Add Follow-up"}
              </button>
            </div>
            {showFollowUpForm && (
              <div className="jd-followup-form">
                <div className="jd-grid-row">
                  <input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                  <input value={followUpNote} onChange={(e) => setFollowUpNote(e.target.value)} placeholder="Note (optional)" />
                </div>
                <button className="btn-jd-edit" onClick={addFollowUp} disabled={saving}>Save Follow-up</button>
                {followUpError && <p className="jd-error" role="alert">{followUpError}</p>}
              </div>
            )}
            <div className="jd-list">
              {followUps.map((fu) => (
                <div className="jd-list-item" key={fu._id}>
                  <div>
                    <strong>{fu.notes || "Follow-up"}</strong>
                    <small>{new Date(fu.eventDate).toLocaleDateString()}</small>
                  </div>
                  <button className="btn-jd-delete" onClick={() => removeTimeline(fu._id)} disabled={saving}>Delete</button>
                </div>
              ))}
              {followUps.length === 0 && !showFollowUpForm && <p className="jd-empty">No follow-ups scheduled.</p>}
            </div>
          </section>

          <section className="jd-section">
            <h3>Timeline</h3>
            <div className="jd-grid-row">
              <input value={timelineTitle} onChange={(e) => setTimelineTitle(e.target.value)} placeholder="Event title" />
              <input type="date" value={timelineDate} onChange={(e) => setTimelineDate(e.target.value)} />
            </div>
            <textarea rows={2} value={timelineNotes} onChange={(e) => setTimelineNotes(e.target.value)} placeholder="Event notes" />
            <button className="btn-jd-edit" onClick={addTimeline} disabled={saving}>Add event</button>
            {timelineError && <p className="jd-error" role="alert">{timelineError}</p>}
            <div className="jd-list">
              {sortedTimeline.map((event) => (
                <div className="jd-list-item" key={event._id}>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.notes || ""}</p>
                    <small>{new Date(event.eventDate).toLocaleDateString()}</small>
                  </div>
                  <button className="btn-jd-delete" onClick={() => removeTimeline(event._id)} disabled={saving}>Delete</button>
                </div>
              ))}
              {sortedTimeline.length === 0 && <p className="jd-empty">No timeline events yet.</p>}
            </div>
          </section>

          <section className="jd-section">
            <h3>Interviews</h3>
            <div className="jd-grid-row">
              <select value={interviewForm.roundType} onChange={(e) => setInterviewForm((p) => ({ ...p, roundType: e.target.value }))}>
                <option>Phone Screen</option><option>Technical</option><option>Behavioral</option><option>System Design</option><option>Final Round</option><option>Other</option>
              </select>
              <input type="date" value={interviewForm.date} onChange={(e) => setInterviewForm((p) => ({ ...p, date: e.target.value }))} />
            </div>
            <input value={interviewForm.interviewer} onChange={(e) => setInterviewForm((p) => ({ ...p, interviewer: e.target.value }))} placeholder="Interviewer" />
            <textarea rows={2} value={interviewForm.notes} onChange={(e) => setInterviewForm((p) => ({ ...p, notes: e.target.value }))} placeholder="Notes" />
            <button className="btn-jd-edit" onClick={addInterview} disabled={saving}>Add interview</button>
            {interviewError && <p className="jd-error" role="alert">{interviewError}</p>}
            <div className="jd-list">
              {(localJob.interviews || []).map((iv) => (
                <div className="jd-list-item" key={iv._id}>
                  <div>
                    <strong>{iv.roundType}</strong>
                    <p>{iv.interviewer || ""}</p>
                    <small>{iv.date ? new Date(iv.date).toLocaleDateString() : "No date"}</small>
                  </div>
                  <button className="btn-jd-delete" onClick={() => deleteInterview(iv._id)} disabled={saving}>Delete</button>
                </div>
              ))}
              {(localJob.interviews || []).length === 0 && <p className="jd-empty">No interviews logged.</p>}
            </div>
          </section>

          <section className="jd-section">
            <div className="jd-section-head">
              <h3>Documents</h3>
              {/* S3-009: wrap action buttons so "Link from Library" sits beside Refresh */}
              <div>
                {/* S3-009: new button — opens library picker */}
                <button className="btn-jd-edit" onClick={openLibraryPicker} disabled={saving}>Link from Library</button>
                <button className="btn-jd-edit" onClick={loadDocs} disabled={docsLoading}>Refresh</button>
              </div>
            </div>
            <button className="btn-jd-edit" onClick={handleGenerateResume} disabled={saving}>Generate AI Resume</button>
            <button className="btn-jd-edit" onClick={handleGenerateCoverLetter} disabled={saving}>Generate AI Cover Letter</button>
            {docSuccess && <p className="jd-success" role="status">{docSuccess}</p>}
            {docError && <p className="jd-error" role="alert">{docError}</p>}

            {/* S3-009: library picker panel — shows user's unlinked, non-archived docs */}
            {showLibrary && (
              <div className="jd-library-picker">
                <div className="jd-section-head">
                  <strong>Your Library</strong>
                  <button className="btn-jd-delete" onClick={() => setShowLibrary(false)}>Close</button>
                </div>
                {libraryLoading ? <p className="jd-empty">Loading...</p> : (
                  <div className="jd-list">
                    {libraryDocs.map((doc) => (
                      <div className="jd-list-item" key={doc._id}>
                        <div>
                          <strong>{doc.name}</strong>
                          <small>{doc.type}{doc.category ? ` · ${doc.category}` : ""} · {doc.status}</small>
                        </div>
                        {/* S3-009: link a library document to this job */}
                        <button className="btn-jd-edit" onClick={() => handleLinkDocument(doc._id)} disabled={saving}>Link</button>
                      </div>
                    ))}
                    {libraryDocs.length === 0 && <p className="jd-empty">No available library documents to link.</p>}
                  </div>
                )}
              </div>
            )}
            {/* S3-009: end library picker panel */}

            {docsLoading ? <p className="jd-empty">Loading documents...</p> : (
              <div className="jd-list">
                {docs.map((doc) => (
                  <div className="jd-list-item jd-list-item-stack" key={doc._id}>
                    <div>
                      <strong>{doc.name}</strong>
                      <small>{doc.type} - {doc.versions?.length || 0} versions</small>
                    </div>
                    <div className="jd-doc-actions">
                      <button className="btn-jd-edit" onClick={() => beginEditDoc(doc)}>Edit</button>
                      {/* S3-009: unlink button — removes job association without deleting the document */}
                      <button className="btn-jd-edit" onClick={() => handleUnlinkDocument(doc._id)} disabled={saving}>Unlink</button>
                      <button className="btn-jd-delete" onClick={() => handleDeleteDocument(doc._id)} disabled={saving}>Delete</button>
                    </div>
                    {editingDocId === doc._id && (
                      <div className="jd-doc-edit">
                        <textarea rows={6} value={docDraft} onChange={(e) => setDocDraft(e.target.value)} />
                        <div className="jd-grid-row">
                          <button className="btn-jd-edit" onClick={saveDocVersion} disabled={saving}>Save version</button>
                          <button className="btn-jd-delete" onClick={() => setEditingDocId(null)} disabled={saving}>Cancel</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                {docs.length === 0 && <p className="jd-empty">No job-linked documents yet.</p>}
              </div>
            )}
          </section>
        </div>

        <div className="jd-footer">
          <button className="btn-jd-edit" onClick={() => { onClose(); onEdit(localJob); }}>Edit Job</button>
          {onArchive && <button className="btn-jd-archive" onClick={archiveFromDetail}>Archive Job</button>}
          <button className="btn-jd-delete" onClick={() => { onClose(); onDelete(localJob._id); }}>Delete Job</button>
        </div>
      </div>
    </div>
  );
}

export default memo(JobDetail);
