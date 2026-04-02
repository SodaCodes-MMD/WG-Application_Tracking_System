import { Profile } from "../models/profile-model.js";

export const findProfileByUserId = (userId) =>
  Profile.findOne({ userId }).lean();

export const upsertProfile = (userId, data) =>
  Profile.findOneAndUpdate(
    { userId },
    { $set: { ...data, updatedAt: new Date() } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
