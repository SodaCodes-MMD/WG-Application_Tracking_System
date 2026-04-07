// Set JWT_SECRET before any module is loaded
process.env.JWT_SECRET = 'test-jwt-secret-exp-edu';

const request = require('supertest');
const app = require('../app').default;
const jwt = require('jsonwebtoken');
const tokenService = require('../services/token-service');

jest.mock('../repositories/profile-repository');
const profileRepo = require('../repositories/profile-repository');

describe('Experience & Education CRUD (SCRUM-49 / SCRUM-50)', () => {
  const userAId  = 'aaaa00000000000000000011';
  const userBId  = 'bbbb00000000000000000022';
  const entryId  = 'cccc00000000000000000033';

  let tokenA, tokenB;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.clearBlacklist();
    tokenA = jwt.sign({ userId: userAId, email: 'usera@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    tokenB = jwt.sign({ userId: userBId, email: 'userb@example.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
  });

  const expEntry = {
    _id: entryId,
    jobTitle: 'Software Engineer',
    company: 'Acme Corp',
    location: 'Remote',
    startDate: new Date('2022-01-01'),
    endDate: null,
    isCurrent: true,
    description: 'Built things.',
    accomplishments: ['Shipped feature X'],
  };

  const eduEntry = {
    _id: entryId,
    institution: 'State University',
    degree: 'Bachelor of Science',
    fieldOfStudy: 'Computer Science',
    startDate: new Date('2018-09-01'),
    endDate: new Date('2022-05-01'),
    gpa: '3.8',
    honors: 'Cum Laude',
  };

  const mockProfileWithExp = { _id: 'p1', userId: userAId, experience: [expEntry], education: [] };
  const mockProfileWithEdu = { _id: 'p1', userId: userAId, experience: [], education: [eduEntry] };

  // ── Experience ─────────────────────────────────────────────────────────────

  describe('POST /api/profile/experience', () => {
    it('adds experience to own profile → 201', async () => {
      profileRepo.addExperienceEntry.mockResolvedValue(mockProfileWithExp);

      const res = await request(app)
        .post('/api/profile/experience')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ jobTitle: 'Software Engineer', company: 'Acme Corp', startDate: '2022-01-01' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(profileRepo.addExperienceEntry).toHaveBeenCalledWith(
        userAId,
        expect.objectContaining({ jobTitle: 'Software Engineer', company: 'Acme Corp' })
      );
    });

    it('only writes to the authenticated user — not to any other user', async () => {
      profileRepo.addExperienceEntry.mockResolvedValue(mockProfileWithExp);

      await request(app)
        .post('/api/profile/experience')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ jobTitle: 'Engineer', company: 'Acme', startDate: '2022-01-01' });

      expect(profileRepo.addExperienceEntry).toHaveBeenCalledWith(userAId, expect.any(Object));
      expect(profileRepo.addExperienceEntry).not.toHaveBeenCalledWith(userBId, expect.any(Object));
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/profile/experience')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ jobTitle: 'Engineer' }); // missing company and startDate

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(profileRepo.addExperienceEntry).not.toHaveBeenCalled();
    });

    it('returns 401 with no token', async () => {
      const res = await request(app)
        .post('/api/profile/experience')
        .send({ jobTitle: 'Engineer', company: 'Acme', startDate: '2022-01-01' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/profile/experience/:entryId', () => {
    it('deletes experience from own profile → 200', async () => {
      profileRepo.deleteExperienceEntry.mockResolvedValue({ ...mockProfileWithExp, experience: [] });

      const res = await request(app)
        .delete(`/api/profile/experience/${entryId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(profileRepo.deleteExperienceEntry).toHaveBeenCalledWith(userAId, entryId);
    });

    it('returns 404 when entry does not exist in the authenticated user\'s profile', async () => {
      profileRepo.deleteExperienceEntry.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/profile/experience/${entryId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── Education ──────────────────────────────────────────────────────────────

  describe('POST /api/profile/education', () => {
    it('adds education to own profile → 201', async () => {
      profileRepo.addEducationEntry.mockResolvedValue(mockProfileWithEdu);

      const res = await request(app)
        .post('/api/profile/education')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ institution: 'State University', degree: 'B.S.', fieldOfStudy: 'CS', startDate: '2018-09-01' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(profileRepo.addEducationEntry).toHaveBeenCalledWith(
        userAId,
        expect.objectContaining({ institution: 'State University', degree: 'B.S.' })
      );
    });

    it('returns 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/profile/education')
        .set('Authorization', `Bearer ${tokenA}`)
        .send({ institution: 'State University' }); // missing degree, fieldOfStudy, startDate

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 401 with no token', async () => {
      const res = await request(app)
        .post('/api/profile/education')
        .send({ institution: 'State U', degree: 'B.S.', fieldOfStudy: 'CS', startDate: '2018-09-01' });

      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/profile/education/:entryId', () => {
    it('deletes education from own profile → 200', async () => {
      profileRepo.deleteEducationEntry.mockResolvedValue({ ...mockProfileWithEdu, education: [] });

      const res = await request(app)
        .delete(`/api/profile/education/${entryId}`)
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(profileRepo.deleteEducationEntry).toHaveBeenCalledWith(userAId, entryId);
    });

    it('returns 404 when entry does not belong to the requesting user', async () => {
      // User B's token + an entryId from user A's profile → repository returns null
      profileRepo.deleteEducationEntry.mockResolvedValue(null);

      const res = await request(app)
        .delete(`/api/profile/education/${entryId}`)
        .set('Authorization', `Bearer ${tokenB}`);

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });
  });

  // ── Persistence via GET ────────────────────────────────────────────────────

  describe('GET /api/profile — experience and education persist', () => {
    it('returns experience and education arrays in the profile response', async () => {
      profileRepo.findProfileByUserId.mockResolvedValue({
        userId: userAId,
        firstName: 'Jane',
        experience: [expEntry],
        education: [eduEntry],
      });

      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.experience).toHaveLength(1);
      expect(res.body.data.experience[0].jobTitle).toBe('Software Engineer');
      expect(res.body.data.education).toHaveLength(1);
      expect(res.body.data.education[0].institution).toBe('State University');
    });
  });
});
