import { Job } from "../models/job-model.js";

export const findJobsByUser = (userId) =>
  Job.find({ userId, archivedAt: null }).sort({ createdAt: -1 }).lean();

export const findActiveJobsByUser = (userId) =>
  Job.find({ userId, archivedAt: null }).sort({ createdAt: -1 }).lean();

export const findArchivedJobsByUser = (userId) =>
  Job.find({ userId, archivedAt: { $ne: null } }).sort({ archivedAt: -1 }).lean();

export const findJobById = (id) =>
  Job.findById(id).lean();

export const findJobByIdAndUser = (id, userId) =>
  Job.findOne({ _id: id, userId }).lean();

export const findJobByIdAndUserInclusive = (id, userId) =>
  Job.findOne({ _id: id, userId }).lean();

export const createJob = (data) => Job.create(data);
//Updated - accepts optional history entry for status change
export const updateJobByIdAndUser = (id, userId, updates, historyEntry = null) => {
  const mongoUpdate = {$set: updates };
  if (historyEntry) mongoUpdate.$push = { statusHistory: historyEntry};
  return Job.findOneAndUpdate({ _id: id, userId }, mongoUpdate, { new: true, runValidators: true }).lean();
};

export const archiveJobByIdAndUser = (id, userId) =>
  Job.findOneAndUpdate(
    { _id: id, userId, archivedAt: null },
    { $set: { archivedAt: new Date() } },
    { new: true, runValidators: true }
  ).lean();

export const restoreJobByIdAndUser = (id, userId) =>
  Job.findOneAndUpdate(
    { _id: id, userId, archivedAt: { $ne: null } },
    { $set: { archivedAt: null } },
    { new: true, runValidators: true }
  ).lean();

export const deleteJobByIdAndUser = (id, userId) =>
  Job.findOneAndDelete({ _id: id, userId }).lean();

export const addInterview = (jobId, userId, data) =>
  Job.findOneAndUpdate({ _id: jobId, userId }, { $push: { interviews: data } }, { new: true, runValidators: true }).lean();

export const updateInterview = (jobId, userId, interviewId, updates) =>
  Job.findOneAndUpdate(
    { _id: jobId, userId, "interviews._id": interviewId },
    { $set: Object.fromEntries(Object.entries(updates).map(([k, v]) => [`interviews.$.${k}`, v])) },
    { new: true, runValidators: true }
  ).lean();

export const removeInterview = (jobId, userId, interviewId) =>
  Job.findOneAndUpdate(
    { _id: jobId, userId },
    { $pull: { interviews: { _id: interviewId } } },
    { new: true }
  ).lean();