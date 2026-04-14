import mongoose from "mongoose";

const DOCUMENT_TYPES = ["Resume", "Cover Letter", "Notes", "Other"];

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    type: {
      type: String,
      enum: DOCUMENT_TYPES,
      default: "Other",
    },
    content: {
      type: String,
      trim: true,
      maxlength: 20000,
      default: "",
    },
  },
  {
    collection: "documents",
    timestamps: true,
  }
);

export const DOCUMENT_TYPES_LIST = DOCUMENT_TYPES;
export const Document = mongoose.model("Document", documentSchema);