import { Job } from "../models/job-model.js";

export const findJobsByUser = (userId) =>
  Job.find({ userId }).sort({ createdAt: -1 }).lean();

export const findJobById = (id) =>
  Job.findById(id).lean();

export const findJobByIdAndUser = (id, userId) =>
  Job.findOne({ _id: id, userId }).lean();

export const createJob = (data) => Job.create(data);

export const updateJobByIdAndUser = (id, userId, updates) =>
  Job.findOneAndUpdate({ _id: id, userId }, { $set: updates }, { new: true, runValidators: true }).lean();

export const deleteJobByIdAndUser = (id, userId) =>
  Job.findOneAndDelete({ _id: id, userId }).lean();