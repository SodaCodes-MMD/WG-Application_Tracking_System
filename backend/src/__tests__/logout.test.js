// Set JWT_SECRET before any module that uses it is loaded
process.env.JWT_SECRET = 'test-jwt-secret-for-logout-tests';

const request = require('supertest');
const app = require('../app').default;
const jwt = require('jsonwebtoken');
const tokenService = require('../services/token-service');

describe('Auth - Logout and Session Invalidation (SCRUM-17)', () => {
  let validToken;

  beforeEach(() => {
    // Reset blacklist so tests are fully independent
    tokenService.clearBlacklist();

    // Fresh token for each test
    validToken = jwt.sign(
      { userId: 'user_test_1', email: 'test@example.com' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  describe('POST /api/auth/logout', () => {
    it('should succeed and return a success message with a valid token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.message).toContain('Logged out');
    });

    it('should blacklist the token so subsequent requests are rejected with 401', async () => {
      // Step 1 — log out
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${validToken}`);

      // Step 2 — attempt to use the same token
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 when no token is provided', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });
  });
});
