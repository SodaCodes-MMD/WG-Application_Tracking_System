import { Document } from "../models/document-model.js";

export const createDocument = (userId, data) => 
    Document.create({ userId, ...data });

export const findDocumentsByUser = (userId) =>
    Document.find({ userId }).sort({ createdAt: -1 }).lean();

export const findDocumentByIdandUser = (id, userId) =>
    Document.findOne({ _id: id, userId }).lean();

export const updateDocumentByIdandUser = (id, userId, updates) =>
    Document.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true, runValidators: true }).lean();

export const deleteDocumentByIdandUser = (id, userId) =>
    Document.findOneAndDelete({ _id: id, userId }).lean();

