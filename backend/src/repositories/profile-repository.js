import { Profile } from "../models/profile-model.js";

export const findProfileByUserId = (userId) =>
  Profile.findOne({ userId }).lean();

export const upsertProfile = (userId, data) =>
  Profile.findOneAndUpdate(
    { userId },
    { $set: { ...data, updatedAt: new Date() } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

// ── Experience ──────────────────────────────────────────────────────────────

export const addExperienceEntry = (userId, data) =>
  Profile.findOneAndUpdate(
    { userId },
    { $push: { experience: data }, $set: { updatedAt: new Date() } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

export const updateExperienceEntry = (userId, entryId, updates) =>
  Profile.findOneAndUpdate(
    { userId, "experience._id": entryId },
    { $set: { ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [`experience.$.${k}`, v])), updatedAt: new Date() } },
    { new: true, runValidators: true }
  ).lean();

export const deleteExperienceEntry = (userId, entryId) =>
  Profile.findOneAndUpdate(
    { userId },
    { $pull: { experience: { _id: entryId } }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean();

export const reorderExperienceEntries = async (userId, orderedIds) => {
  const profile = await Profile.findOne({ userId }).lean();
  if (!profile) return null;
  const reordered = orderedIds
    .map((id) => profile.experience.find((e) => e._id.toString() === id))
    .filter(Boolean);
  return Profile.findOneAndUpdate(
    { userId },
    { $set: { experience: reordered, updatedAt: new Date() } },
    { new: true }
  ).lean();
};

// ── Education ───────────────────────────────────────────────────────────────

export const addEducationEntry = (userId, data) =>
  Profile.findOneAndUpdate(
    { userId },
    { $push: { education: data }, $set: { updatedAt: new Date() } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

export const updateEducationEntry = (userId, entryId, updates) =>
  Profile.findOneAndUpdate(
    { userId, "education._id": entryId },
    { $set: { ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [`education.$.${k}`, v])), updatedAt: new Date() } },
    { new: true, runValidators: true }
  ).lean();

export const deleteEducationEntry = (userId, entryId) =>
  Profile.findOneAndUpdate(
    { userId },
    { $pull: { education: { _id: entryId } }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean();
