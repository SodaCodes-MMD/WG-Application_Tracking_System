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

// ── Skills ───────────────────────────────────────────────────────────────────

export const addSkillEntry = (userId, data) =>
  Profile.findOneAndUpdate(
    { userId },
    { $push: { skills: data }, $set: { updatedAt: new Date() } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();

export const updateSkillEntry = (userId, skillId, updates) =>
  Profile.findOneAndUpdate(
    { userId, "skills._id": skillId },
    { $set: { ...Object.fromEntries(Object.entries(updates).map(([k, v]) => [`skills.$.${k}`, v])), updatedAt: new Date() } },
    { new: true, runValidators: true }
  ).lean();

export const deleteSkillEntry = (userId, skillId) =>
  Profile.findOneAndUpdate(
    { userId },
    { $pull: { skills: { _id: skillId } }, $set: { updatedAt: new Date() } },
    { new: true }
  ).lean();

export const reorderSkillEntries = async (userId, orderedIds) => {
  const profile = await Profile.findOne({ userId }).lean();
  if (!profile) return null;
  const reordered = orderedIds
    .map((id) => profile.skills.find((s) => s._id.toString() === id))
    .filter(Boolean);
  return Profile.findOneAndUpdate(
    { userId },
    { $set: { skills: reordered, updatedAt: new Date() } },
    { new: true }
  ).lean();
};

// ── Career Preferences ───────────────────────────────────────────────────────

export const getPreferencesForUser = async (userId) => {
  const profile = await Profile.findOne({ userId }).lean();
  return profile ? (profile.careerPreferences || {}) : {};
};

export const savePreferencesForUser = (userId, data) =>
  Profile.findOneAndUpdate(
    { userId },
    { $set: { careerPreferences: data, updatedAt: new Date() } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  ).lean();
