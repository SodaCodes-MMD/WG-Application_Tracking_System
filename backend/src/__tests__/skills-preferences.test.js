// Set JWT_SECRET before any module is loaded
process.env.JWT_SECRET = 'test-jwt-secret-skills-prefs';

const request = require('supertest');
const app = require('../app').default;
const jwt = require('jsonwebtoken');
const tokenService = require('../services/token-service');

jest.mock('../repositories/profile-repository');
const profileRepo = require('../repositories/profile-repository');

describe('Skills & Career Preferences CRUD (SCRUM-51 / SCRUM-52)', () => {
  const userAId  = 'aaaa00000000000000000011';
  const userBId  = 'bbbb00000000000000000022';
  const skillId  = 'dddd00000000000000000044';

  let tokenA, tokenB;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.clearBlacklist();
    tokenA = jwt.sign({ userId: userAId, email: 'usera@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign({ userId: userBId, email: 'userb@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  const skillEntry = {
    _id: skillId,
    name: 'TypeScript',
    category: 'Frontend',
    proficiency: 'Advanced',
    order: 0,
  };

  const mockProfileWithSkill = { _id: 'p1', userId: userAId, skills: [skillEntry], education: [], experience: [] };
  const mockProfileNoSkills  = { _id: 'p1', userId: userAId, skills: [], education: [], experience: [] };

  const mockPreferences = {
    targetRoles: ['Frontend Engineer'],
    targetLocations: ['Remote'],
    workMode: 'Remote',
    salaryMin: 80000,
    salaryMax: 120000,
    salaryCurrency: 'USD',
    openToRelocation: false,
    notes: 'Looking for fully remote roles',
  };

  // ── Skills ─────────────────────────────────────────────────────────────────

  describe('POST /api/profile/skills', () => {
    it('adds skill to own profile → 201', async () => {
      profileRepo.addSkillEntry.mockResolvedValue(mockProfileWithSkill);

      const res = await request(app)
        .post('/api/profile/skills')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'TypeScript', category: 'Frontend', proficiency: 'Advanced' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(profileRepo.addSkillEntry).toHaveBeenCalledWith(
        userAId,
        expect.objectContaining({ name: 'TypeScript' })
      );
    });

    it('only writes to the authenticated user — not to any other user', async () => {
      profileRepo.addSkillEntry.mockResolvedValue(mockProfileWithSkill);

      await request(app)
        .post('/api/profile/skills')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ name: 'TypeScript' });

      expect(profileRepo.addSkillEntry).toHaveBeenCalledWith(userAId, expect.any(Object));
      expect(profileRepo.addSkillEntry).not.toHaveBeenCalledWith(userBId, expect.any(Object));
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/profile/skills')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ category: 'Frontend' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(profileRepo.addSkillEntry).not.toHaveBeenCalled();
    });

    it('returns 401 with no token', async () => {
      const res = await request(app)
        .post('/api/profile/skills')
        .send({ name: 'TypeScript' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/profile/skills/:skillId', () => {
    it('deletes skill from own profile → 200', async () => {
      profileRepo.deleteSkillEntry.mockResolvedValue(mockProfileNoSkills);

      const res = await request(app)
        .delete(`/api/profile/skills/${skillId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(profileRepo.deleteSkillEntry).toHaveBeenCalledWith(userAId, skillId);
    });

    it('returns 404 when profile not found', async () => {
      profileRepo.deleteSkillEntry.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/profile/skills/${skillId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PATCH /api/profile/skills/reorder', () => {
    it('reorders skills and persists new order → 200', async () => {
      profileRepo.reorderSkillEntries.mockResolvedValue({
        ...mockProfileWithSkill,
        skills: [skillEntry],
      });

      const res = await request(app)
        .patch('/api/profile/skills/reorder')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ orderedIds: [skillId] });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(profileRepo.reorderSkillEntries).toHaveBeenCalledWith(userAId, [skillId]);
    });

    it('returns 400 when orderedIds is not an array', async () => {
      const res = await request(app)
        .patch('/api/profile/skills/reorder')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ orderedIds: 'not-an-array' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // ── Career Preferences ─────────────────────────────────────────────────────

  describe('PUT /api/profile/preferences', () => {
    it('saves preferences for own profile → 200', async () => {
      profileRepo.savePreferencesForUser.mockResolvedValue({
        ...mockProfileWithSkill,
        careerPreferences: mockPreferences,
      });

      const res = await request(app)
        .put('/api/profile/preferences')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(mockPreferences);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(profileRepo.savePreferencesForUser).toHaveBeenCalledWith(
        userAId,
        expect.objectContaining({ workMode: 'Remote' })
      );
    });

    it('only writes to the authenticated user — enforces ownership', async () => {
      profileRepo.savePreferencesForUser.mockResolvedValue({
        ...mockProfileWithSkill,
        careerPreferences: mockPreferences,
      });

      await request(app)
        .put('/api/profile/preferences')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(mockPreferences);

      expect(profileRepo.savePreferencesForUser).toHaveBeenCalledWith(userAId, expect.any(Object));
      expect(profileRepo.savePreferencesForUser).not.toHaveBeenCalledWith(userBId, expect.any(Object));
    });

    it('returns 401 with no token', async () => {
      const res = await request(app)
        .put('/api/profile/preferences')
        .send(mockPreferences);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/profile/preferences', () => {
    it('returns saved preferences for own profile → 200', async () => {
      profileRepo.getPreferencesForUser.mockResolvedValue(mockPreferences);

      const res = await request(app)
        .get('/api/profile/preferences')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workMode).toBe('Remote');
      expect(res.body.data.targetRoles).toContain('Frontend Engineer');
    });

    it('returns 401 with no token', async () => {
      const res = await request(app)
        .get('/api/profile/preferences');

      expect(res.status).toBe(401);
    });
  });
});
