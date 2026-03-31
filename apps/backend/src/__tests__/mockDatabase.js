// In-memory mock database for testing
// This provides the same interface as the tests expect

const bcrypt = require('bcrypt');

// In-memory storage
const users = new Map();
const passwordResetTokens = new Map();
let userIdCounter = 1;

/**
 * Create a new user with save method
 * @param {Object} userData - User data { email, password, name }
 * @returns {Object} - Created user with id and save method
 */
function createUser(userData) {
  const id = userIdCounter++;
  const user = {
    _id: `user_${id}`,
    id: id,
    email: userData.email.toLowerCase(),
    password: userData.password,
    name: userData.name || userData.firstName || 'User',
    firstName: userData.firstName || userData.name || 'User',
    createdAt: new Date(),
    passwordUpdatedAt: null,
    // Mock save method for Mongoose compatibility
    save: async function() {
      // Update the stored user with any changes
      users.set(id, this);
      return this;
    }
  };
  users.set(id, user);
  return user;
}

/**
 * Create a password reset token
 * @param {Object} tokenData - Token data { token, userId, email, expiresAt, ipAddress }
 */
function createPasswordResetToken(tokenData) {
  const tokenHash = tokenData.token;
  passwordResetTokens.set(tokenHash, {
    token: tokenHash,
    userId: tokenData.userId,
    email: tokenData.email,
    expiresAt: new Date(tokenData.expiresAt),
    ipAddress: tokenData.ipAddress || null,
    createdAt: new Date()
  });
}

/**
 * Get user by ID
 * @param {number|string} userId - User ID
 * @returns {Object|undefined} - User object
 */
function getUserById(userId) {
  // Handle both numeric id and _id format
  const id = typeof userId === 'string' ? parseInt(userId.replace('user_', '')) : userId;
  return users.get(id);
}

/**
 * Clear all data
 */
function clearAll() {
  users.clear();
  passwordResetTokens.clear();
  userIdCounter = 1;
}

// Export the mock database interface
module.exports = {
  users,
  passwordResetTokens,
  userIdCounter,
  createUser,
  createPasswordResetToken,
  getUserById,
  clear: clearAll
};
