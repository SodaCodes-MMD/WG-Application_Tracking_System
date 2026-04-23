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

export async function downloadDocx(token, id) {
  try {
    const res = await fetch(`${API}/documents/${id}/download-docx`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return { success: false };
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || "resume.docx";
    a.click();
    URL.revokeObjectURL(url);
    return { success: true };
  } catch {
    return { success: false };
  }
}
