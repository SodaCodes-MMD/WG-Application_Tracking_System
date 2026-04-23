import mongoose from "mongoose";

const DOCUMENT_TYPES = ["Resume", "Cover Letter"];
const DOCUMENT_STATUSES = ["Draft", "Ready", "Archived"];

const documentSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        name: { type: String, required: true, trim: true, maxlength: 200 },
        type: { type: String, enum: DOCUMENT_TYPES, required: true },
        status: { type: String, enum: DOCUMENT_STATUSES, default: "Draft" },
        tags: { type: [String], default: [] },
    },
    { collection: "documents", timestamps: true }    
);

export const DOCUMENT_TYPES_LIST = DOCUMENT_TYPES;
export const DOCUMENT_STATUSES_LIST = DOCUMENT_STATUSES;
export const Document = mongoose.model("Document", documentSchema);
