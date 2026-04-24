import { Document } from "../models/document-model.js";

export async function createDocument(userId, data) {
  const doc = new Document({
    userId,
    name: data.name,
    type: data.type,
    category: data.category || "General",
    status: data.status || "Draft",
    versions: data.versions || [],
    linkedJobs: data.linkedJobs || [],
  });
  return await doc.save();
}

export async function findDocumentsByUser(userId) {
  return await Document.find({ userId }).sort({ updatedAt: -1 });
}

export async function findDocumentsByUserWithFilter(userId, filter, sortOptions) {
  return await Document.find(filter).sort(sortOptions);
}

export async function findDocumentById(docId) {
  return await Document.findById(docId);
}

export async function findDocumentByIdAndUser(docId, userId) {
  return await Document.findOne({ _id: docId, userId });
}

export async function updateDocumentByIdAndUser(docId, userId, updates) {
  return await Document.findOneAndUpdate(
    { _id: docId, userId },
    { ...updates, updatedAt: new Date() },
    { new: true }
  );
}

export async function deleteDocumentByIdAndUser(docId, userId) {
  return await Document.findOneAndDelete({ _id: docId, userId });
}

export async function addDocumentVersion(docId, userId, content) {
  const doc = await Document.findOne({ _id: docId, userId });
  if (!doc) return null;

  const versionNumber = doc.versions.length + 1;
  doc.versions.push({ versionNumber, content });
  doc.updatedAt = new Date();
  return await doc.save();
}

export async function linkDocumentToJob(docId, userId, jobId) {
  return await Document.findOneAndUpdate(
    { _id: docId, userId, linkedJobs: { $ne: jobId } },
    { $push: { linkedJobs: jobId }, updatedAt: new Date() },
    { new: true }
  );
}

export async function unlinkDocumentFromJob(docId, userId, jobId) {
  return await Document.findOneAndUpdate(
    { _id: docId, userId },
    { $pull: { linkedJobs: jobId }, updatedAt: new Date() },
    { new: true }
  );
}

export async function findDocumentsByJob(userId, jobId) {
  return await Document.find({ userId, linkedJobs: jobId });
}

export async function duplicateDocument(docId, userId) {
  const original = await Document.findOne({ _id: docId, userId });
  if (!original) return null;

  const copy = new Document({
    userId,
    name: `${original.name} (Copy)`,
    type: original.type,
    category: original.category,
    status: original.status,
    tags: original.tags,
    versions: original.versions.map((v, i) => ({
      versionNumber: i + 1,
      content: v.content,
    })),
    linkedJobs: [],
  });
  return await copy.save();
}

export async function renameDocument(docId, userId, name) {
  return await Document.findOneAndUpdate(
    { _id: docId, userId },
    { name, updatedAt: new Date() },
    { new: true }
  );
}
