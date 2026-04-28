import mongoose from "mongoose";

const migrationSchema = new mongoose.Schema(
  {
    version: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    status: { type: String, enum: ["pending", "running", "completed", "rolled_back"], default: "pending" },
    appliedAt: { type: Date, default: null },
    rolledBackAt: { type: Date, default: null },
    duration: { type: Number, default: null },
    error: { type: String, default: null },
  },
  { collection: "migrations", timestamps: true }
);

migrationSchema.index({ status: 1 });
migrationSchema.index({ appliedAt: -1 });

export const Migration = mongoose.model("Migration", migrationSchema);
