const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Validation constants
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
const SPECIAL_CHARACTERS = '@$!%*?&';

// Validation rules
const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: PASSWORD_MIN_LENGTH })
    .withMessage(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long`)
    .matches(PASSWORD_REGEX)
    .withMessage(`Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (${SPECIAL_CHARACTERS})`)
];

// Routes
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.get('/validate-reset-token/:token', authController.validateResetToken);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);

module.exports = router;