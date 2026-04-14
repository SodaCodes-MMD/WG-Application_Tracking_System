import mongoose from "mongoose";

const JOB_STATUSES = [
  "Wishlist", "Applied", "Phone Screen", "Interview",
  "Offer", "Rejected", "Withdrawn",
];

const JOB_OUTCOMES = ["Pending", "Accepted", "Rejected", "Withdrawn", "Ghosted"];

const INTERVIEW_ROUND_TYPES = [
  "Phone Screen", "Technical", "Behavioral", "System Design", "Final Round", "Other",
];

const interviewSchema = new mongoose.Schema(
  {
    roundType: { type: String, enum: INTERVIEW_ROUND_TYPES, required: true },
    date: { type: Date, default: null },
    interviewer: { type: String, trim: true, maxlength: 200, default: "" },
    notes: { type: String, trim: true, maxlength: 5000, default: "" },
  },
  { timestamps: true }
);

const timelineEventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    notes: { type: String, trim: true, maxlength: 5000, default: "" },
    eventDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

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
    deadline: { type: Date, default: null },
    recruiterNotes: { type: String, trim: true, maxlength: 5000, default: "" },
    outcome: { type: String, enum: JOB_OUTCOMES, default: null },
    outcomeNotes: { type: String, trim: true, maxlength: 5000, default: "" },
    respondedAt: { type: Date, default: null },
    interviews: { type: [interviewSchema], default: [] },
    timelineEvents: { type: [timelineEventSchema], default: [] },
    statusHistory: [
        {
          status: { type: String, enum: JOB_STATUSES, required: true },
          changedAt: { type: Date, default: Date.now },
        }
      ],
    },
    { collection: "jobs", timestamps: true }
  );

  export const JOB_STATUSES_LIST = JOB_STATUSES;
  export const JOB_OUTCOMES_LIST = JOB_OUTCOMES;
  export const Job = mongoose.model("Job", jobSchema);
