import { Document } from "../models/document-model.js";

export const findDocumentsByUser = (userId) =>
  Document.find({ userId }).sort({ updatedAt: -1 });

export const findDocumentsByUserAndJob = (userId, jobId) =>
  Document.find({ userId, jobId }).sort({ updatedAt: -1 });

export const createDocument = (payload) =>
  Document.create(payload);

export const deleteDocumentByIdAndUser = (id, userId) =>
  Document.findOneAndDelete({ _id: id, userId });