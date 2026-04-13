import { describe, it, expect } from "vitest";
import { calculateProfileCompletion } from "./profile-completion.js";

describe("calculateProfileCompletion", () => {
  it("returns 9% for empty profile baseline", () => {
    const result = calculateProfileCompletion({
      profile: {},
      experienceCount: 0,
      educationCount: 0,
      skillsCount: 0,
      prefs: { targetRoles: [], targetLocations: [], workMode: "Any" },
    });

    expect(result).toBe(9);
  });

  it("trims basic fields before counting", () => {
    const result = calculateProfileCompletion({
      profile: {
        firstName: " Jane ",
        lastName: "",
        phone: "   ",
        location: "New York",
        headline: "Engineer",
        summary: "",
      },
      experienceCount: 0,
      educationCount: 0,
      skillsCount: 0,
      prefs: { targetRoles: [], targetLocations: [], workMode: "Any" },
    });

    expect(result).toBe(36);
  });

  it("counts section completion and preferences", () => {
    const result = calculateProfileCompletion({
      profile: {
        firstName: "Jane",
        lastName: "Smith",
        phone: "555-0100",
        location: "NYC",
        headline: "Software Engineer",
        summary: "Experienced developer.",
      },
      experienceCount: 2,
      educationCount: 1,
      skillsCount: 4,
      prefs: { targetRoles: ["Frontend Engineer"], targetLocations: [], workMode: "Any" },
    });

    expect(result).toBe(100);
  });

  it("does not count preferences when work mode is Any and no tags", () => {
    const result = calculateProfileCompletion({
      profile: {
        firstName: "Jane",
        lastName: "Smith",
      },
      experienceCount: 1,
      educationCount: 0,
      skillsCount: 0,
      prefs: { targetRoles: [], targetLocations: [], workMode: "Any" },
    });

    expect(result).toBe(36);
  });

  it("counts preferences when work mode is not Any", () => {
    const result = calculateProfileCompletion({
      profile: {
        firstName: "Jane",
      },
      experienceCount: 0,
      educationCount: 0,
      skillsCount: 0,
      prefs: { targetRoles: [], targetLocations: [], workMode: "Remote" },
    });

    expect(result).toBe(27);
  });
});
