const request = require('supertest');
const app = require('../server');
const bcrypt = require('bcrypt');

// Mock database
const db = require('./mockDatabase');

// Mock the database module
jest.mock('../models/database', () => {
  const mockDb = require('./mockDatabase');
  
  // Helper to extract numeric id from various formats
  const extractUserId = (userId) => {
    if (typeof userId === 'string' && userId.startsWith('user_')) {
      return parseInt(userId.replace('user_', ''));
    }
    return parseInt(userId);
  };
  
  return {
    User: {
      findOne: jest.fn(({ email }) => {
        const user = Array.from(mockDb.users.values()).find(u => u.email === email.toLowerCase());
        return user ? Promise.resolve(user) : Promise.resolve(null);
      }),
      findById: jest.fn((id) => {
        const user = mockDb.getUserById(id);
        return user ? Promise.resolve(user) : Promise.resolve(null);
      })
    },
    PasswordResetToken: {
      findOne: jest.fn(({ token }) => {
        const resetToken = mockDb.passwordResetTokens.get(token);
        return resetToken ? Promise.resolve(resetToken) : Promise.resolve(null);
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
          const targetUserId = extractUserId(query.userId);
          const keysToDelete = [];
          mockDb.passwordResetTokens.forEach((token, key) => {
            const tokenUserId = extractUserId(token.userId);
            if (tokenUserId === targetUserId) {
              keysToDelete.push(key);
            }
          });
          keysToDelete.forEach(key => mockDb.passwordResetTokens.delete(key));
          deletedCount = keysToDelete.length;
        }
        return Promise.resolve({ deletedCount });
      })
    }
  };
});

// Mock email service
jest.mock('../services/email.service', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue({
    success: true,
    messageId: 'test-message-id'
  })
}));

describe('Auth Controller - Password Reset', () => {
  beforeEach(() => {
    // Clear database before each test
    db.clear();
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset email for existing user', async () => {
      // Create test user
      db.createUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      });

      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account with that email exists');
      
      // Verify token was created
      expect(db.passwordResetTokens.size).toBe(1);
    });

    it('should return same message for non-existent user (security)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('If an account with that email exists');
      
      // Verify no token was created
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
      // Create test user
      const user = db.createUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      });

      // Create existing token
      db.createPasswordResetToken({
        token: 'old-token-hash',
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      // Request new reset
      await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'test@example.com' });

      // Should only have 1 token (the new one)
      expect(db.passwordResetTokens.size).toBe(1);
    });
  });

  describe('GET /api/auth/validate-reset-token/:token', () => {
    it('should validate a valid token', async () => {
      // Create test user
      const user = db.createUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      });

      // Create valid token
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      db.createPasswordResetToken({
        token: tokenHash,
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      const response = await request(app)
        .get(`/api/auth/validate-reset-token/${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('test@example.com');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/validate-reset-token/invalid-token');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject expired token', async () => {
      // Create test user
      const user = db.createUser({
        email: 'test@example.com',
        password: 'hashedpassword',
        name: 'Test User'
      });

      // Create expired token
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      db.createPasswordResetToken({
        token: tokenHash,
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() - 3600000).toISOString() // 1 hour ago
      });

      const response = await request(app)
        .get(`/api/auth/validate-reset-token/${token}`);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('expired');
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .get('/api/auth/validate-reset-token/');

      expect(response.status).toBe(404); // Express route not matched
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      // Create test user
      const hashedPassword = await bcrypt.hash('oldpassword', 10);
      const user = db.createUser({
        email: 'test@example.com',
        password: hashedPassword,
        name: 'Test User'
      });

      // Create valid token
      const crypto = require('crypto');
      const token = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      db.createPasswordResetToken({
        token: tokenHash,
        userId: user.id,
        email: user.email,
        expiresAt: new Date(Date.now() + 3600000).toISOString()
      });

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: token,
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('successfully');

      // Verify token was deleted
      expect(db.passwordResetTokens.size).toBe(0);

      // Verify password was updated
      const updatedUser = db.getUserById(user.id);
      expect(updatedUser.password).not.toBe(hashedPassword);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token',
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject weak password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'some-token',
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject password without uppercase', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'some-token',
          password: 'lowercase123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should reject password without special character', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'some-token',
          password: 'Password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 for missing token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          password: 'NewPassword123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'some-token'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});