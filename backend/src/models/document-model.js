import mongoose from "mongoose";

const DOCUMENT_TYPES = ["Resume", "Cover Letter"];
const DOCUMENT_CATEGORIES = ["General", "Frontend", "Backend", "Data", "DevOps", "Full Stack", "Other"];
const DOCUMENT_STATUSES = ["Draft", "Ready", "Archived"];

const documentVersionSchema = new mongoose.Schema({
  versionNumber: { type: Number, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
}, { _id: true });

const documentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 200 },
  type: { type: String, enum: DOCUMENT_TYPES, required: true },
  category: { type: String, enum: DOCUMENT_CATEGORIES, default: "General" },
  status: { type: String, enum: DOCUMENT_STATUSES, default: "Draft" },
  versions: { type: [documentVersionSchema], default: [] },
  linkedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Job" }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { collection: "documents" });

export const DOCUMENT_TYPES_LIST = DOCUMENT_TYPES;
export const DOCUMENT_CATEGORIES_LIST = DOCUMENT_CATEGORIES;
export const DOCUMENT_STATUSES_LIST = DOCUMENT_STATUSES;
export const Document = mongoose.model("Document", documentSchema);
