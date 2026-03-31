/**
 * Token Blacklist Service
 *
 * Keeps revoked JWTs in memory so they are rejected by auth-middleware even
 * before their natural expiry.
 *
 * PRODUCTION NOTE: Replace the in-memory Set with Redis using SET with a TTL
 * matching the JWT expiry (currently 1h).  An in-memory store is acceptable
 * for Sprint 1 because it lives within a single process and is wiped on
 * restart — acceptable trade-off until a shared cache layer is provisioned.
 */

const blacklistedTokens = new Set();

/**
 * Add a token to the blacklist.
 * @param {string} token - raw JWT string
 */
export const blacklistToken = (token) => {
  blacklistedTokens.add(token);
};

/**
 * Check whether a token has been revoked.
 * @param {string} token - raw JWT string
 * @returns {boolean}
 */
export const isBlacklisted = (token) => {
  return blacklistedTokens.has(token);
};

/**
 * Clear all blacklisted tokens.
 * Used only in tests to reset state between runs.
 */
export const clearBlacklist = () => {
  blacklistedTokens.clear();
};
