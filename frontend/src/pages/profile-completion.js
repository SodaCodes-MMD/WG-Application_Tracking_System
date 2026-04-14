const BASIC_FIELDS = ["firstName", "lastName", "phone", "location", "headline", "summary"];
const TOTAL_FIELDS = 11;

export function calculateProfileCompletion({
  profile = {},
  experienceCount = 0,
  educationCount = 0,
  skillsCount = 0,
  prefs = {},
} = {}) {
  const filledBasic = BASIC_FIELDS.filter((field) => {
    const value = profile[field];
    return typeof value === "string" && value.trim().length > 0;
  }).length;

  const hasPrefs =
    (Array.isArray(prefs.targetRoles) && prefs.targetRoles.length > 0) ||
    (Array.isArray(prefs.targetLocations) && prefs.targetLocations.length > 0) ||
    prefs.workMode !== "Any";

  const filledCount =
    1 +
    filledBasic +
    (experienceCount > 0 ? 1 : 0) +
    (educationCount > 0 ? 1 : 0) +
    (skillsCount > 0 ? 1 : 0) +
    (hasPrefs ? 1 : 0);

  return Math.round((filledCount / TOTAL_FIELDS) * 100);
}
