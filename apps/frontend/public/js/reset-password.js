/**
 * Reset Password Page Logic
 * Handles token validation, form validation, and password reset
 */

document.addEventListener('DOMContentLoaded', async () => {
  // DOM Elements
  const loadingState = document.getElementById('loading-state');
  const invalidTokenState = document.getElementById('invalid-token-state');
  const resetFormState = document.getElementById('reset-form-state');
  const successState = document.getElementById('success-state');
  const errorMessage = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');
  
  const form = document.getElementById('reset-password-form');
  const tokenInput = document.getElementById('token');
  const emailDisplay = document.getElementById('email-display');
  const passwordInput = document.getElementById('password');
  const confirmPasswordInput = document.getElementById('confirm-password');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner');

  // Error elements
  const passwordError = document.getElementById('password-error');
  const confirmPasswordError = document.getElementById('confirm-password-error');

  // Password requirement elements
  const reqLength = document.getElementById('req-length');
  const reqUppercase = document.getElementById('req-uppercase');
  const reqLowercase = document.getElementById('req-lowercase');
  const reqNumber = document.getElementById('req-number');
  const reqSpecial = document.getElementById('req-special');

  // Get token from URL using common utility
  const token = getTokenFromUrl();

  /**
   * Show specific state
   * @param {string} stateName - State to show
   */
  function showState(stateName) {
    loadingState.classList.add('hidden');
    invalidTokenState.classList.add('hidden');
    resetFormState.classList.add('hidden');
    successState.classList.add('hidden');
    errorMessage.classList.add('hidden');

    switch (stateName) {
      case 'loading':
        loadingState.classList.remove('hidden');
        break;
      case 'invalid':
        invalidTokenState.classList.remove('hidden');
        break;
      case 'form':
        resetFormState.classList.remove('hidden');
        break;
      case 'success':
        successState.classList.remove('hidden');
        break;
    }
  }

  /**
   * Update password requirement indicators using common utility
   */
  function updatePasswordRequirements() {
    const password = passwordInput.value;
    const requirements = checkPasswordRequirements(password);
    
    reqLength.classList.toggle('valid', requirements.length);
    reqUppercase.classList.toggle('valid', requirements.uppercase);
    reqLowercase.classList.toggle('valid', requirements.lowercase);
    reqNumber.classList.toggle('valid', requirements.number);
    reqSpecial.classList.toggle('valid', requirements.special);
  }

  /**
   * Validate password using common utility
   * @returns {boolean} - Is valid
   */
  function validatePasswordField() {
    const result = validatePassword(passwordInput.value);
    
    if (!result.valid) {
      showInputError(passwordInput, passwordError, result.error);
      return false;
    }
    
    clearInputError(passwordInput, passwordError);
    return true;
  }

  /**
   * Validate confirm password using common utility
   * @returns {boolean} - Is valid
   */
  function validateConfirmPasswordField() {
    const result = validateConfirmPassword(passwordInput.value, confirmPasswordInput.value);
    
    if (!result.valid) {
      showInputError(confirmPasswordInput, confirmPasswordError, result.error);
      return false;
    }
    
    clearInputError(confirmPasswordInput, confirmPasswordError);
    return true;
  }

  /**
   * Validate entire form
   * @returns {boolean} - Is valid
   */
  function validateForm() {
    const isPasswordValid = validatePasswordField();
    const isConfirmValid = validateConfirmPasswordField();
    return isPasswordValid && isConfirmValid;
  }

  // Password toggle functionality
  document.querySelectorAll('.toggle-password').forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.dataset.target;
      const input = document.getElementById(targetId);
      
      if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
      } else {
        input.type = 'password';
        button.textContent = '👁️';
      }
    });
  });

  // Real-time password validation
  passwordInput.addEventListener('input', () => {
    updatePasswordRequirements();
    if (passwordInput.classList.contains('error')) {
      validatePasswordField();
    }
    if (confirmPasswordInput.value) {
      validateConfirmPasswordField();
    }
  });

  passwordInput.addEventListener('blur', validatePasswordField);

  confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.classList.contains('error')) {
      validateConfirmPasswordField();
    }
  });

  confirmPasswordInput.addEventListener('blur', validateConfirmPasswordField);

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      if (passwordInput.classList.contains('error')) {
        passwordInput.focus();
      } else {
        confirmPasswordInput.focus();
      }
      return;
    }

    setButtonLoading(submitBtn, btnText, spinner, true);
    hideErrorAlert(errorMessage);

    try {
      const password = passwordInput.value;
      const response = await api.resetPassword(token, password);

      if (response.success) {
        showState('success');
      } else {
        showErrorAlert(errorMessage, errorText, response.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      
      if (error.status === 400) {
        showState('invalid');
      } else {
        showErrorAlert(errorMessage, errorText, error.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setButtonLoading(submitBtn, btnText, spinner, false);
    }
  });

  // Initialize: Validate token
  async function init() {
    if (!token) {
      showState('invalid');
      return;
    }

    showState('loading');

    try {
      const response = await api.validateResetToken(token);

      if (response.success) {
        tokenInput.value = token;
        emailDisplay.value = response.data.email || 'your email';
        showState('form');
      } else {
        showState('invalid');
      }
    } catch (error) {
      console.error('Token validation error:', error);
      showState('invalid');
    }
  }

  // Start initialization
  init();
});