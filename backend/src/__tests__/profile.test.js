// Set JWT_SECRET before any module is loaded
process.env.JWT_SECRET = 'test-jwt-secret-profile';

const request = require('supertest');
const app = require('../app').default;
const jwt = require('jsonwebtoken');
const tokenService = require('../services/token-service');

// Auto-mock the profile repository — all exports become jest.fn()
jest.mock('../repositories/profile-repository');
const profileRepo = require('../repositories/profile-repository');

describe('Profile API', () => {
  const userAId = 'aaaa00000000000000000011';
  const userBId = 'bbbb00000000000000000022';

  let tokenA, tokenB;

  beforeEach(() => {
    jest.clearAllMocks();
    tokenService.clearBlacklist();
    tokenA = jwt.sign(
      { userId: userAId, email: 'usera@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    tokenB = jwt.sign(
      { userId: userBId, email: 'userb@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('GET /api/profile', () => {
    it('should return empty object for a new user with no profile', async () => {
      profileRepo.findProfileByUserId.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({});
    });

    it('should return the saved profile for an existing user', async () => {
      profileRepo.findProfileByUserId.mockResolvedValue({
        userId: userAId,
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '555-0100',
        location: 'New York, NY',
        headline: 'Software Engineer',
        summary: 'Experienced developer.',
      });

      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Jane');
      expect(res.body.data.headline).toBe('Software Engineer');
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app).get('/api/profile');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/profile', () => {
    it('should create a profile and return it', async () => {
      const profileData = {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '555-0100',
        location: 'New York, NY',
        headline: 'Software Engineer',
        summary: 'Experienced developer.',
      };

      profileRepo.upsertProfile.mockResolvedValue({
        _id: 'profile_001',
        userId: userAId,
        ...profileData,
      });

      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${tokenA}`)
        .send(profileData);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.firstName).toBe('Jane');
      expect(res.body.data.lastName).toBe('Smith');
      // Repository must be called with the token's userId, not anything from the body
      expect(profileRepo.upsertProfile).toHaveBeenCalledWith(
        userAId,
        expect.objectContaining({ firstName: 'Jane', lastName: 'Smith' })
      );
    });

    it('should return 403 when body userId does not match the authenticated user', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ userId: userAId, firstName: 'Impersonator' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('FORBIDDEN');
      expect(profileRepo.upsertProfile).not.toHaveBeenCalled();
    });

    it('should only write to the authenticated user — not to any other user', async () => {
      profileRepo.upsertProfile.mockResolvedValue({
        userId: userBId,
        firstName: 'Bob',
      });

      await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${tokenB}`)
        .send({ firstName: 'Bob' });

      expect(profileRepo.upsertProfile).toHaveBeenCalledWith(
        userBId,
        expect.any(Object)
      );
      expect(profileRepo.upsertProfile).not.toHaveBeenCalledWith(
        userAId,
        expect.any(Object)
      );
    });

    it('should return 401 when no token is provided', async () => {
      const res = await request(app)
        .put('/api/profile')
        .send({ firstName: 'Hacker' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
