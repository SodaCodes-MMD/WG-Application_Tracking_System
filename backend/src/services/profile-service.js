import {
  findProfileByUserId, upsertProfile,
  addExperienceEntry, updateExperienceEntry, deleteExperienceEntry, reorderExperienceEntries,
  addEducationEntry, updateEducationEntry, deleteEducationEntry,
  addSkillEntry, updateSkillEntry, deleteSkillEntry, reorderSkillEntries,
  getPreferencesForUser, savePreferencesForUser,
} from "../repositories/profile-repository.js";

const ALLOWED_FIELDS = ["firstName", "lastName", "phone", "location", "headline", "summary"];

const EXP_FIELDS  = ["jobTitle", "company", "location", "startDate", "endDate", "isCurrent", "description", "accomplishments"];
const EDU_FIELDS  = ["institution", "degree", "fieldOfStudy", "startDate", "endDate", "gpa", "honors"];
const SKILL_FIELDS = ["name", "category", "proficiency", "order"];
const PREF_FIELDS  = ["targetRoles", "targetLocations", "workMode", "salaryMin", "salaryMax", "salaryCurrency", "openToRelocation", "notes"];

export const getProfileForUser = async (userId) => {
  const profile = await findProfileByUserId(userId);
  return profile || {};
};

export const saveProfileForUser = async (userId, data) => {
  const filtered = Object.fromEntries(
    Object.entries(data)
      .filter(([k]) => ALLOWED_FIELDS.includes(k))
      .map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
  );
  return upsertProfile(userId, filtered);
};

// ── Experience ──────────────────────────────────────────────────────────────

export const addExperience = async (userId, data) => {
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => EXP_FIELDS.includes(k)));
  if (!filtered.jobTitle || !filtered.company || !filtered.startDate) {
    const err = new Error("jobTitle, company, and startDate are required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  return addExperienceEntry(userId, filtered);
};

export const updateExperience = async (userId, entryId, data) => {
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => EXP_FIELDS.includes(k)));
  return updateExperienceEntry(userId, entryId, filtered);
};

export const deleteExperience = (userId, entryId) =>
  deleteExperienceEntry(userId, entryId);

export const reorderExperience = async (userId, orderedIds) => {
  if (!Array.isArray(orderedIds)) {
    const err = new Error("orderedIds must be an array");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  return reorderExperienceEntries(userId, orderedIds);
};

// ── Education ───────────────────────────────────────────────────────────────

export const addEducation = async (userId, data) => {
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => EDU_FIELDS.includes(k)));
  if (!filtered.institution || !filtered.degree || !filtered.fieldOfStudy || !filtered.startDate) {
    const err = new Error("institution, degree, fieldOfStudy, and startDate are required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  return addEducationEntry(userId, filtered);
};

export const updateEducation = async (userId, entryId, data) => {
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => EDU_FIELDS.includes(k)));
  return updateEducationEntry(userId, entryId, filtered);
};

export const deleteEducation = (userId, entryId) =>
  deleteEducationEntry(userId, entryId);

// ── Skills ───────────────────────────────────────────────────────────────────

export const addSkill = async (userId, data) => {
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => SKILL_FIELDS.includes(k)));
  if (!filtered.name || !filtered.name.toString().trim()) {
    const err = new Error("name is required");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  return addSkillEntry(userId, filtered);
};

export const updateSkill = async (userId, skillId, data) => {
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => SKILL_FIELDS.includes(k)));
  return updateSkillEntry(userId, skillId, filtered);
};

export const deleteSkill = (userId, skillId) =>
  deleteSkillEntry(userId, skillId);

export const reorderSkills = async (userId, orderedIds) => {
  if (!Array.isArray(orderedIds)) {
    const err = new Error("orderedIds must be an array");
    err.code = "VALIDATION_ERROR";
    throw err;
  }
  return reorderSkillEntries(userId, orderedIds);
};

// ── Career Preferences ───────────────────────────────────────────────────────

export const getPreferences = (userId) =>
  getPreferencesForUser(userId);

export const savePreferences = async (userId, data) => {
  const filtered = Object.fromEntries(Object.entries(data).filter(([k]) => PREF_FIELDS.includes(k)));
  return savePreferencesForUser(userId, filtered);
};
