import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProfile,
  saveProfile,
  addExperience,
  updateExperience,
  deleteExperience,
  reorderExperience,
  addEducation,
  updateEducation,
  deleteEducation,
  addSkill,
  updateSkill,
  deleteSkill,
  reorderSkills,
  getPreferences,
  savePreferences,
} from "./profile-api.js";

describe("profile-api", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("getProfile", () => {
    it("fetches user profile", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: { firstName: "Jane" } }),
      });

      const result = await getProfile("test-token");

      expect(result.success).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile",
        expect.objectContaining({
          headers: { Authorization: "Bearer test-token" },
        })
      );
    });

    it("returns error on network failure", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));

      const result = await getProfile("test-token");

      expect(result.success).toBe(false);
      expect(result.error.code).toBe("NETWORK_ERROR");
    });
  });

  describe("saveProfile", () => {
    it("saves profile data", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const profileData = { firstName: "Jane", lastName: "Smith" };
      await saveProfile("test-token", profileData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(profileData),
        })
      );
    });
  });

  describe("experience endpoints", () => {
    it("addExperience posts new experience", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const expData = { jobTitle: "Developer", company: "Test Corp" };
      await addExperience("test-token", expData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/experience",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(expData),
        })
      );
    });

    it("updateExperience patches existing experience", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const updateData = { jobTitle: "Senior Developer" };
      await updateExperience("test-token", "exp-123", updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/experience/exp-123",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(updateData),
        })
      );
    });

    it("deleteExperience removes experience", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      await deleteExperience("test-token", "exp-123");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/experience/exp-123",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("reorderExperience sends ordered IDs", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const orderedIds = ["exp-1", "exp-2", "exp-3"];
      await reorderExperience("test-token", orderedIds);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/experience/reorder",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ orderedIds }),
        })
      );
    });
  });

  describe("education endpoints", () => {
    it("addEducation posts new education", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const eduData = { institution: "University", degree: "Bachelor" };
      await addEducation("test-token", eduData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/education",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(eduData),
        })
      );
    });

    it("updateEducation patches existing education", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const updateData = { gpa: "3.8" };
      await updateEducation("test-token", "edu-123", updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/education/edu-123",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(updateData),
        })
      );
    });

    it("deleteEducation removes education", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      await deleteEducation("test-token", "edu-123");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/education/edu-123",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  describe("skills endpoints", () => {
    it("addSkill posts new skill", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const skillData = { name: "JavaScript", proficiency: "Advanced" };
      await addSkill("test-token", skillData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/skills",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify(skillData),
        })
      );
    });

    it("updateSkill patches existing skill", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const updateData = { proficiency: "Expert" };
      await updateSkill("test-token", "skill-123", updateData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/skills/skill-123",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(updateData),
        })
      );
    });

    it("deleteSkill removes skill", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      await deleteSkill("test-token", "skill-123");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/skills/skill-123",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("reorderSkills sends ordered IDs", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const orderedIds = ["skill-1", "skill-2", "skill-3"];
      await reorderSkills("test-token", orderedIds);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/skills/reorder",
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ orderedIds }),
        })
      );
    });
  });

  describe("preferences endpoints", () => {
    it("getPreferences fetches career preferences", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true, data: {} }),
      });

      await getPreferences("test-token");

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/preferences",
        expect.objectContaining({
          method: "GET",
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        })
      );
    });

    it("savePreferences updates career preferences", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        json: () => Promise.resolve({ success: true }),
      });

      const prefsData = { targetRoles: ["Developer"], workMode: "Remote" };
      await savePreferences("test-token", prefsData);

      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/profile/preferences",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify(prefsData),
        })
      );
    });
  });
});
