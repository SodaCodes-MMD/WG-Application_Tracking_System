/**
 * Common Utilities for Frontend Authentication Forms
 * Contains shared validation logic, constants, and UI helpers
 */

// Constants
const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD_MIN_LENGTH: 8,
  UPPERCASE_REGEX: /[A-Z]/,
  LOWERCASE_REGEX: /[a-z]/,
  NUMBER_REGEX: /\d/,
  SPECIAL_REGEX: /[@$!%*?&]/,
  SPECIAL_CHARACTERS: '@$!%*?&'
};

const UI = {
  ERROR_DISPLAY_DURATION: 5000 // milliseconds
};

/**
 * Email validation
 * @param {string} email - Email to validate
 * @returns {{ valid: boolean, error?: string }}
 */
function validateEmail(email) {
  const trimmedEmail = email?.trim?.() ?? email;
  
  if (!trimmedEmail) {
    return { valid: false, error: 'Email is required' };
  }
  
  if (!VALIDATION.EMAIL_REGEX.test(trimmedEmail)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }
  
  return { valid: true };
}

/**
 * Password validation
 * @param {string} password - Password to validate
 * @returns {{ valid: boolean, error?: string }}
 */
function validatePassword(password) {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }
  
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return { valid: false, error: `Password must be at least ${VALIDATION.PASSWORD_MIN_LENGTH} characters` };
  }
  
  if (!VALIDATION.UPPERCASE_REGEX.test(password)) {
    return { valid: false, error: 'Password must contain an uppercase letter' };
  }
  
  if (!VALIDATION.LOWERCASE_REGEX.test(password)) {
    return { valid: false, error: 'Password must contain a lowercase letter' };
  }
  
  if (!VALIDATION.NUMBER_REGEX.test(password)) {
    return { valid: false, error: 'Password must contain a number' };
  }
  
  if (!VALIDATION.SPECIAL_REGEX.test(password)) {
    return { valid: false, error: `Password must contain a special character (${VALIDATION.SPECIAL_CHARACTERS})` };
  }
  
  return { valid: true };
}

/**
 * Confirm password validation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {{ valid: boolean, error?: string }}
 */
function validateConfirmPassword(password, confirmPassword) {
  if (!confirmPassword) {
    return { valid: false, error: 'Please confirm your password' };
  }
  
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  
  return { valid: true };
}

/**
 * Check individual password requirements
 * @param {string} password - Password to check
 * @returns {Object} - Object with requirement results
 */
function checkPasswordRequirements(password) {
  return {
    length: password.length >= VALIDATION.PASSWORD_MIN_LENGTH,
    uppercase: VALIDATION.UPPERCASE_REGEX.test(password),
    lowercase: VALIDATION.LOWERCASE_REGEX.test(password),
    number: VALIDATION.NUMBER_REGEX.test(password),
    special: VALIDATION.SPECIAL_REGEX.test(password)
  };
}

/**
 * Get all unmet password requirements
 * @param {string} password - Password to check
 * @returns {string[]} - Array of unmet requirement messages
 */
function getUnmetPasswordRequirements(password) {
  const requirements = checkPasswordRequirements(password);
  const unmet = [];
  
  if (!requirements.length) {
    unmet.push(`At least ${VALIDATION.PASSWORD_MIN_LENGTH} characters`);
  }
  if (!requirements.uppercase) {
    unmet.push('At least one uppercase letter');
  }
  if (!requirements.lowercase) {
    unmet.push('At least one lowercase letter');
  }
  if (!requirements.number) {
    unmet.push('At least one number');
  }
  if (!requirements.special) {
    unmet.push(`At least one special character (${VALIDATION.SPECIAL_CHARACTERS})`);
  }
  
  return unmet;
}

/**
 * Apply error state to an input element
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} errorElement - Error display element
 * @param {string} message - Error message
 */
function showInputError(input, errorElement, message) {
  input.classList.add('error');
  errorElement.textContent = message;
}

/**
 * Clear error state from an input element
 * @param {HTMLElement} input - Input element
 * @param {HTMLElement} errorElement - Error display element
 */
function clearInputError(input, errorElement) {
  input.classList.remove('error');
  errorElement.textContent = '';
}

/**
 * Show error alert message
 * @param {HTMLElement} errorMessage - Error message container
 * @param {HTMLElement} errorText - Error text element
 * @param {string} message - Error message
 */
function showErrorAlert(errorMessage, errorText, message) {
  errorText.textContent = message;
  errorMessage.classList.remove('hidden');
  
  // Auto-hide after duration
  setTimeout(() => {
    errorMessage.classList.add('hidden');
  }, UI.ERROR_DISPLAY_DURATION);
}

/**
 * Hide error alert message
 * @param {HTMLElement} errorMessage - Error message container
 */
function hideErrorAlert(errorMessage) {
  errorMessage.classList.add('hidden');
}

/**
 * Set loading state on a submit button
 * @param {HTMLElement} button - Submit button
 * @param {HTMLElement} btnText - Button text element
 * @param {HTMLElement} spinner - Loading spinner element
 * @param {boolean} isLoading - Loading state
 */
function setButtonLoading(button, btnText, spinner, isLoading) {
  button.disabled = isLoading;
  btnText.classList.toggle('hidden', isLoading);
  spinner.classList.toggle('hidden', !isLoading);
}

/**
 * Extract token from URL query parameters
 * @returns {string|null} - Token or null if not found
 */
function getTokenFromUrl() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get('token');
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    VALIDATION,
    UI,
    validateEmail,
    validatePassword,
    validateConfirmPassword,
    checkPasswordRequirements,
    getUnmetPasswordRequirements,
    showInputError,
    clearInputError,
    showErrorAlert,
    hideErrorAlert,
    setButtonLoading,
    getTokenFromUrl
  };
}
