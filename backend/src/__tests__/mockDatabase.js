// In-memory mock database for testing

const users = new Map();
const passwordResetTokens = new Map();
let userIdCounter = 1;

function createUser(userData) {
  const id = userIdCounter++;
  const user = {
    _id: `user_${id}`,
    id: id,
    email: userData.email.toLowerCase(),
    passwordHash: userData.passwordHash || userData.password,
    passwordUpdatedAt: null,
    save: async function () {
      users.set(id, this);
      return this;
    }
  };
  users.set(id, user);
  return user;
}

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

function getUserById(userId) {
  const id = typeof userId === 'string' ? parseInt(userId.replace('user_', '')) : userId;
  return users.get(id);
}

function clearAll() {
  users.clear();
  passwordResetTokens.clear();
  userIdCounter = 1;
}

module.exports = {
  users,
  passwordResetTokens,
  createUser,
  createPasswordResetToken,
  getUserById,
  clear: clearAll
};
