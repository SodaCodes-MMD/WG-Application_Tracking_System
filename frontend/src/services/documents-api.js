const API = "http://localhost:5000/api";

async function send(token, method, path, body) {
  try {
    const opts = {
      method,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const res = await fetch(`${API}${path}`, opts);
    return await res.json();
  } catch {
    return { success: false, error: { code: "NETWORK_ERROR", message: "Unable to connect to server" } };
  }
}

export const listDocuments = (token, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.type) params.append("type", filters.type);
  if (filters.status) params.append("status", filters.status);
  if (filters.tag) params.append("tag", filters.tag);
  if (filters.jobId) params.append("jobId", filters.jobId);
  if (filters.sortBy) params.append("sortBy", filters.sortBy);
  if (filters.sortOrder) params.append("sortOrder", filters.sortOrder);
  
  const queryString = params.toString();
  const path = queryString ? `/documents?${queryString}` : "/documents";
  return send(token, "GET", path);
};
export const getDocument = (token, id) => send(token, "GET", `/documents/${id}`);
export const createDocument = (token, data) => send(token, "POST", "/documents", data);
export const updateDocument = (token, id, data) => send(token, "PATCH", `/documents/${id}`, data);
export const deleteDocument = (token, id) => send(token, "DELETE", `/documents/${id}`);
export const addDocumentVersion = (token, id, content) => send(token, "POST", `/documents/${id}/versions`, { content });
export const linkDocumentToJob = (token, id, jobId) => send(token, "POST", `/documents/${id}/link-job`, { jobId });
export const unlinkDocumentFromJob = (token, id, jobId) => send(token, "POST", `/documents/${id}/unlink-job`, { jobId });
export const getDocumentsByJob = (token, jobId) => send(token, "GET", `/documents/job/${jobId}`);
export const generateAiCoverLetter = (token, jobId) => send(token, "POST", "/documents/generate-cover-letter", { jobId });
export const generateAiResume = (token, jobId) => send(token, "POST", "/documents/generate-resume", { jobId });
export const aiRewriteDocument = (token, id, instruction) => send(token, "POST", `/documents/${id}/ai-rewrite`, { instruction });
export const duplicateDocument = (token, id) => send(token, "POST", `/documents/${id}/duplicate`);
export const renameDocument = (token, id, name) => send(token, "PATCH", `/documents/${id}/rename`, { name });

export async function uploadDocument(token, file, metadata) {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("name", metadata.name || "");
    formData.append("type", metadata.type);
    formData.append("category", metadata.category || "General");
    formData.append("status", metadata.status || "Draft");
    const res = await fetch(`${API}/documents/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    return await res.json();
  } catch {
    return { success: false, error: { code: "NETWORK_ERROR", message: "Unable to connect to server" } };
  }
}

function sanitizeFilenamePart(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_-]/g, "")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function buildFallbackFilename({ type, name, versionNumber }) {
  const safeType = sanitizeFilenamePart(type || "document") || "document";
  const safeName = sanitizeFilenamePart(name || "file") || "file";
  const versionSuffix = versionNumber ? `_v${versionNumber}` : "";
  return `${safeType}_${safeName}${versionSuffix}.docx`;
}

function parseFilenameFromDisposition(headerValue) {
  if (!headerValue) return null;

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      // fall through to regular filename parsing
    }
  }

  const quotedMatch = headerValue.match(/filename="([^"]+)"/i);
  if (quotedMatch?.[1]) return quotedMatch[1];

  const bareMatch = headerValue.match(/filename=([^;]+)/i);
  return bareMatch?.[1]?.trim() || null;
}

export async function downloadDocx(token, id, versionId, fallbackMeta) {
  try {
    const query = versionId ? `?versionId=${encodeURIComponent(versionId)}` : "";
    const res = await fetch(`${API}/documents/${id}/download-docx${query}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { success: false };

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const headerFilename = parseFilenameFromDisposition(res.headers.get("Content-Disposition"));
    a.download = headerFilename || buildFallbackFilename(fallbackMeta || {});

    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    return { success: true };
  } catch {
    return { success: false };
  }
}
