const crypto = require('crypto');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');
const { User, PasswordResetToken } = require('../models/database');
const emailService = require('../services/email.service');

// Constants
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_HOURS = 1;
const TOKEN_BYTE_LENGTH = 32;
const TOKEN_HASH_ALGORITHM = 'sha256';

// Error messages as constants for consistency
const ERROR_MESSAGES = {
  VALIDATION_FAILED: 'Validation failed',
  TOKEN_REQUIRED: 'Token is required',
  INVALID_TOKEN: 'Invalid or expired reset token',
  TOKEN_EXPIRED: 'Reset token has expired. Please request a new password reset.',
  USER_NOT_FOUND: 'User not found',
  PASSWORD_REQUIRED: 'Token and password are required',
  PASSWORD_REUSE: 'New password cannot be the same as your current password',
  PROCESSING_ERROR: 'An error occurred while processing your request',
  VALIDATION_ERROR: 'An error occurred while validating the token',
  RESET_ERROR: 'An error occurred while resetting your password'
};

/**
 * Hash a token using SHA-256
 * @param {string} token - The plain text token
 * @returns {string} - The hashed token
 */
function hashToken(token) {
  return crypto.createHash(TOKEN_HASH_ALGORITHM).update(token).digest('hex');
}

/**
 * Get client IP address from request
 * @param {Request} req - Express request object
 * @returns {string} - Client IP address
 */
function getClientIp(req) {
  return req.ip || req.connection.remoteAddress;
}

/**
 * Validate a password reset token
 * @param {string} token - The plain text token to validate
 * @param {Request} req - Express request object for IP validation
 * @returns {Object} - { valid: boolean, tokenData?: object, error?: string }
 */
async function validatePasswordResetToken(token, req) {
  // Early return for missing token
  if (!token) {
    return { valid: false, error: ERROR_MESSAGES.TOKEN_REQUIRED };
  }

  const tokenHash = hashToken(token);
  const resetToken = await PasswordResetToken.findOne({ token: tokenHash });

  // Token not found
  if (!resetToken) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_TOKEN };
  }

  // Check expiration
  const now = new Date();
  if (now > resetToken.expiresAt) {
    await PasswordResetToken.deleteOne({ token: tokenHash });
    return { valid: false, error: ERROR_MESSAGES.TOKEN_EXPIRED };
  }

  // Check IP binding
  const requestIp = getClientIp(req);
  if (resetToken.ipAddress && resetToken.ipAddress !== requestIp) {
    console.log(`IP mismatch: token IP ${resetToken.ipAddress} vs request IP ${requestIp}`);
    return { valid: false, error: ERROR_MESSAGES.INVALID_TOKEN };
  }

  return { valid: true, tokenData: resetToken };
}

/**
 * Request password reset
 * POST /api/auth/forgot-password
 */
const forgotPassword = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // IMPORTANT: Always return success even if user not found
    // This prevents email enumeration attacks
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    // Delete any existing tokens for this user
    await PasswordResetToken.deleteMany({ userId: user._id });

    // Generate secure random token
    const resetToken = crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('hex');
    
    // Hash token for storage (security best practice)
    const tokenHash = hashToken(resetToken);

    // Store token in database
    await PasswordResetToken.create({
      token: tokenHash,
      userId: user._id,
      email: user.email,
      ipAddress: req.ip || req.connection.remoteAddress,
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
    });

    // Send reset email (use unhashed token in email)
    await emailService.sendPasswordResetEmail(
      user.email,
      resetToken,
      user.firstName || user.name
    );

    res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.PROCESSING_ERROR
    });
  }
};

/**
 * Validate reset token
 * GET /api/auth/validate-reset-token/:token
 */
const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    // Use helper function for token validation
    const validation = await validatePasswordResetToken(token, req);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    // Token is valid
    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        email: validation.tokenData.email
      }
    });

  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.VALIDATION_ERROR
    });
  }
};

/**
 * Reset password
 * POST /api/auth/reset-password
 */
const resetPassword = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        errors: errors.array()
      });
    }

    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.PASSWORD_REQUIRED
      });
    }

    // Use helper function for token validation
    const validation = await validatePasswordResetToken(token, req);
    
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const resetToken = validation.tokenData;

    // Get user
    const user = await User.findById(resetToken.userId);
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }

    // Check if new password is the same as current password (password reuse prevention)
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.PASSWORD_REUSE
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Update user's password
    user.password = hashedPassword;
    user.passwordUpdatedAt = new Date();
    await user.save();

    // Delete the used token
    await PasswordResetToken.deleteOne({ token: hashToken(token) });

    // Delete all other tokens for this user (security measure)
    await PasswordResetToken.deleteMany({ userId: user._id });

    res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: ERROR_MESSAGES.RESET_ERROR
    });
  }
};

module.exports = {
  forgotPassword,
  validateResetToken,
  resetPassword,
  // Export for testing
  validatePasswordResetToken,
  hashToken,
  ERROR_MESSAGES
};