import { Job } from "../models/job-model.js";

export const findJobsByUser = (userId) =>
  Job.find({ userId }).sort({ createdAt: -1 }).lean();

export const findJobById = (id) =>
  Job.findById(id).lean();

export const findJobByIdAndUser = (id, userId) =>
  Job.findOne({ _id: id, userId }).lean();

export const createJob = (data) => Job.create(data);
//Updated - accepts optional history entry for status change
export const updateJobByIdAndUser = (id, userId, updates, historyEntry = null) => {
  const mongoUpdate = {$set: updates };
  if (historyEntry) mongoUpdate.$push = { statusHistory: historyEntry};
  return Job.findOneAndUpdate({ _id: id, userId }, mongoUpdate, { new: true, runValidators: true }).lean();
};

export const deleteJobByIdAndUser = (id, userId) =>
  Job.findOneAndDelete({ _id: id, userId }).lean();