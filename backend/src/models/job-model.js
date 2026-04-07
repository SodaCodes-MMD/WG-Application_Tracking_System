import mongoose from "mongoose";

const JOB_STATUSES = [
  "Wishlist", "Applied", "Phone Screen", "Interview",
  "Offer", "Rejected", "Withdrawn",
];

const JOB_OUTCOMES = ["Accepted", "Declined Offer", "Rejected", "Ghosted", "Withdrawn"];

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
    outcome: { type: String, enum: [...JOB_OUTCOMES, ""], default: "" },
    outcomeNotes: { type: String, trim: true, maxlength: 2000, default: "" },
  },
  { collection: "jobs", timestamps: true }
);

export const JOB_STATUSES_LIST = JOB_STATUSES;
export const JOB_OUTCOMES_LIST = JOB_OUTCOMES;
export const Job = mongoose.model("Job", jobSchema);