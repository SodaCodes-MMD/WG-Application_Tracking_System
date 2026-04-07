import { findProfileByUserId, upsertProfile } from "../repositories/profile-repository.js";

const ALLOWED_FIELDS = ["firstName", "lastName", "phone", "location", "headline", "summary"];

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
