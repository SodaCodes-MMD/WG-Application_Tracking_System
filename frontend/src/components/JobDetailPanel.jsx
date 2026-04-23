import { useState, useEffect } from "react";
import { getToken } from "../services/auth-service.js";
import { getProfile } from "../services/profile-api.js";
import { getDocumentsByJob, generateAiCoverLetter, generateAiResume, addDocumentVersion } from "../services/documents-api.js";
import "./JobDetailPanel.css";

export default function JobDetailPanel({ job, onClose }) {
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [error, setError] = useState(null);
  const [editingDoc, setEditingDoc] = useState(null);
  const [docContent, setDocContent] = useState("");

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
    } else {
      setError(result.error?.message || "Failed to generate cover letter");
    }
    setGenerating(false);
  };

  const handleGenerateResume = async () => {
    setGeneratingResume(true);
    setError(null);

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
    } else {
      setError(result.error?.message || "Failed to generate resume");
    }
    setGeneratingResume(false);
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
            <h3 className="jdp-section-title">Documents</h3>
            
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
            
            {loadingDocs ? (
              <p className="jdp-loading">Loading documents...</p>
            ) : documents.length === 0 ? (
              <p className="jdp-empty">No documents yet. Generate an AI cover letter to get started.</p>
            ) : (
              <div className="jdp-doc-list">
                {documents.map(doc => (
                  <div key={doc._id} className="jdp-doc-item">
                    <div className="jdp-doc-info">
                      <span className="jdp-doc-name">{doc.name}</span>
                      <span className="jdp-doc-type">{doc.type}</span>
                    </div>
                    <div className="jdp-doc-actions">
                      <button 
                        className="jdp-doc-btn"
                        onClick={() => handleEditDocument(doc)}
                      >
                        Edit
                      </button>
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
