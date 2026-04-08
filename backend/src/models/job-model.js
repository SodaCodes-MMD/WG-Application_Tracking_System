import mongoose from "mongoose";

const JOB_STATUSES = [
  "Wishlist", "Applied", "Phone Screen", "Interview",
  "Offer", "Rejected", "Withdrawn",
];

const jobSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    company: { type: String, required: true, trim: true, maxlength: 200 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    status: { type: String, enum: JOB_STATUSES, default: "Wishlist" },
    location: { type: String, trim: true, maxlength: 200, default: "" },
    url: { type: String, trim: true, maxlength: 2000, default: "" },
    salary: { type: String, trim: true, maxlength: 100, default: "" },
    notes: { type: String, trim: true, maxlength: 5000, default: "" },
    appliedAt: { type: Date, default: null },
    archivedAt: { type: Date, default: null, index: true },
  },
  { collection: "jobs", timestamps: true }
);

export const JOB_STATUSES_LIST = JOB_STATUSES;
export const Job = mongoose.model("Job", jobSchema);