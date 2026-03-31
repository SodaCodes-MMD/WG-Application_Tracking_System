const request = require('supertest');
const app = require('../app').default;
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const db = require('./mockDatabase');

// Mock User model
jest.mock('../models/user-model', () => {
  const mockDb = require('./mockDatabase');

  const extractId = (userId) => {
    if (typeof userId === 'string' && userId.startsWith('user_')) {
      return parseInt(userId.replace('user_', ''));
    }
    return parseInt(userId);
  };

  return {
    User: {
      findOne: jest.fn(({ email }) => {
        const user = Array.from(mockDb.users.values()).find(
          (u) => u.email === email.toLowerCase()
        );
        return Promise.resolve(user || null);
      }),
      findById: jest.fn((id) => {
        const user = mockDb.getUserById(id);
        return Promise.resolve(user || null);
      })
    }
  };
});

// Mock PasswordResetToken model
jest.mock('../models/password-reset-model', () => {
  const mockDb = require('./mockDatabase');

  const extractId = (userId) => {
    if (typeof userId === 'string' && userId.startsWith('user_')) {
      return parseInt(userId.replace('user_', ''));
    }
    return parseInt(userId);
  };

  return {
    PasswordResetToken: {
      findOne: jest.fn(({ token }) => {
        const resetToken = mockDb.passwordResetTokens.get(token);
        return Promise.resolve(resetToken || null);
      }),
      create: jest.fn((data) => {
        mockDb.createPasswordResetToken(data);
        return Promise.resolve({ ...data });
      }),
      deleteOne: jest.fn(({ token }) => {
        mockDb.passwordResetTokens.delete(token);
        return Promise.resolve({ deletedCount: 1 });
      }),
      deleteMany: jest.fn((query) => {
        let deletedCount = 0;
        if (query.userId) {
          const targetId = extractId(query.userId);
          const keysToDelete = [];
          mockDb.passwordResetTokens.forEach((t, key) => {
            if (extractId(t.userId) === targetId) keysToDelete.push(key);
          });
          keysToDelete.forEach((key) => mockDb.passwordResetTokens.delete(key));
          deletedCount = keysToDelete.length;
        }
        return Promise.resolve({ deletedCount });
      })
    }
  };
});

// Mock email service
jest.mock('../services/email-service', () => ({
  __esModule: true,
  default: {
    sendPasswordResetEmail: jest.fn().mockResolvedValue({
      success: true,
      messageId: 'test-message-id'
    })
  }
}));

describe('Auth Controller - Password Reset', () => {
  beforeEach(() => {
    db.clear();
    jest.clearAllMocks();
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset email for existing user', async () => {
      db.createUser({ email: 'test@example.com', passwordHash: 'hashed', name: 'Test User' });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account with that email exists');
      expect(db.passwordResetTokens.size).toBe(1);
    });

    it('should return same message for non-existent user (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account with that email exists');
      expect(db.passwordResetTokens.size).toBe(0);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'invalid-email' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should delete existing tokens for user before creating new one', async () => {
      const user = db.createUser({ email: 'test@example.com', passwordHash: 'hashed' });

      db.createPasswordResetToken({
        token: 'old-token-hash',
        userId: user._id,
        email: user.email,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(db.passwordResetTokens.size).toBe(1);
    });
  });

  describe('GET /api/auth/validate-reset-token/:token', () => {
    it('should validate a valid token', async () => {
      const user = db.createUser({ email: 'test@example.com', passwordHash: 'hashed' });

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      db.createPasswordResetToken({
        token: tokenHash,
        userId: user._id,
        email: user.email,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      const response = await request(app).get(
        `/api/auth/validate-reset-token/${token}`
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should reject invalid token', async () => {
      const response = await request(app).get(
        '/api/auth/validate-reset-token/invalid-token'
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject expired token', async () => {
      const user = db.createUser({ email: 'test@example.com', passwordHash: 'hashed' });

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      db.createPasswordResetToken({
        token: tokenHash,
        userId: user._id,
        email: user.email,
        expiresAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      });

      const response = await request(app).get(
        `/api/auth/validate-reset-token/${token}`
      );

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      const hashedPassword = await bcrypt.hash('oldpassword', 10);
      const user = db.createUser({ email: 'test@example.com', passwordHash: hashedPassword });

      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      db.createPasswordResetToken({
        token: tokenHash,
        userId: user._id,
        email: user.email,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token, password: 'NewPassword123!' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('successfully');
      expect(db.passwordResetTokens.size).toBe(0);

      const updatedUser = db.getUserById(user.id);
      expect(updatedUser.passwordHash).not.toBe(hashedPassword);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token', password: 'NewPassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'some-token', password: 'weak' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject password without uppercase', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'some-token', password: 'lowercase123!' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject password without special character', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'some-token', password: 'Password123' });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ password: 'NewPassword123!' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'some-token' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  /**
   * ROUTE PROTECTION TESTS
   * Tests for the /auth/me endpoint and authentication middleware
   */
  describe('Route Protection - GET /api/auth/me', () => {
    it('should return 401 for request without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    it('should return 401 for request with invalid token format', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'InvalidFormat');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 for request with expired/invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token-123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_TOKEN');
    });
  });
});
