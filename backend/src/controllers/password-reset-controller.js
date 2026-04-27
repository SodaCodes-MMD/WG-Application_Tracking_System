import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import { User } from '../models/user-model.js';
import { PasswordResetToken } from '../models/password-reset-model.js';
import emailService from '../services/email-service.js';

// Constants
const SALT_ROUNDS = 10;
const TOKEN_EXPIRY_HOURS = 1;
const TOKEN_BYTE_LENGTH = 32;
const TOKEN_HASH_ALGORITHM = 'sha256';

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

function hashToken(token) {
  return crypto.createHash(TOKEN_HASH_ALGORITHM).update(token).digest('hex');
}

function getClientIp(req) {
  return req.ip || req.socket?.remoteAddress || '0.0.0.0';
}

async function validatePasswordResetToken(token, req) {
  if (!token) {
    return { valid: false, error: ERROR_MESSAGES.TOKEN_REQUIRED };
  }

  const tokenHash = hashToken(token);
  const resetToken = await PasswordResetToken.findOne({ token: tokenHash });

  if (!resetToken) {
    return { valid: false, error: ERROR_MESSAGES.INVALID_TOKEN };
  }

  const now = new Date();
  if (now > resetToken.expiresAt) {
    await PasswordResetToken.deleteOne({ token: tokenHash });
    return { valid: false, error: ERROR_MESSAGES.TOKEN_EXPIRED };
  }

  const requestIp = getClientIp(req);
  if (resetToken.ipAddress && resetToken.ipAddress !== requestIp) {
    console.log(`IP mismatch: token IP ${resetToken.ipAddress} vs request IP ${requestIp}`);
    return { valid: false, error: ERROR_MESSAGES.INVALID_TOKEN };
  }

  return { valid: true, tokenData: resetToken };
}

/**
 * POST /api/auth/forgot-password
 */
export const forgotPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.VALIDATION_FAILED,
        errors: errors.array()
      });
    }

    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return res.json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.'
      });
    }

    await PasswordResetToken.deleteMany({ userId: user._id });

    const resetToken = crypto.randomBytes(TOKEN_BYTE_LENGTH).toString('hex');
    const tokenHash = hashToken(resetToken);

    await PasswordResetToken.create({
      token: tokenHash,
      userId: user._id,
      email: user.email,
      ipAddress: getClientIp(req),
      expiresAt: new Date(Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)
    });

    await emailService.sendPasswordResetEmail(user.email, resetToken);

    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: ERROR_MESSAGES.PROCESSING_ERROR }
    });
  }
};

/**
 * GET /api/auth/validate-reset-token/:token
 */
export const validateResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    const validation = await validatePasswordResetToken(token, req);

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    return res.json({
      success: true,
      message: 'Token is valid',
      data: { email: validation.tokenData.email }
    });
  } catch (error) {
    console.error('Validate token error:', error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: ERROR_MESSAGES.VALIDATION_ERROR }
    });
  }
};

/**
 * POST /api/auth/reset-password
 */
export const resetPassword = async (req, res) => {
  try {
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

    const validation = await validatePasswordResetToken(token, req);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        message: validation.error
      });
    }

    const resetToken = validation.tokenData;
    const user = await User.findById(resetToken.userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.USER_NOT_FOUND
      });
    }

    // Prevent password reuse
    const isSamePassword = await bcrypt.compare(password, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: ERROR_MESSAGES.PASSWORD_REUSE
      });
    }

    user.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    user.passwordUpdatedAt = new Date();
    await user.save();

    // Delete used token and any remaining tokens for this user
    await PasswordResetToken.deleteOne({ token: hashToken(token) });
    await PasswordResetToken.deleteMany({ userId: user._id });

    return res.json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      success: false,
      error: { code: "SERVER_ERROR", message: ERROR_MESSAGES.RESET_ERROR }
    });
  }
};

export { validatePasswordResetToken, hashToken, ERROR_MESSAGES };
