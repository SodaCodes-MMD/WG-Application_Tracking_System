/**
 * Forgot Password Page Logic
 * Handles form validation and API communication
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('forgot-password-form');
  const emailInput = document.getElementById('email');
  const emailError = document.getElementById('email-error');
  const submitBtn = document.getElementById('submit-btn');
  const btnText = submitBtn.querySelector('.btn-text');
  const spinner = submitBtn.querySelector('.spinner');
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');
  const errorText = document.getElementById('error-text');

  /**
   * Validate email field using common utilities
   * @returns {boolean} - Is valid
   */
  function validateEmailField() {
    const result = validateEmail(emailInput.value);
    
    if (!result.valid) {
      showInputError(emailInput, emailError, result.error);
      return false;
    }
    
    clearInputError(emailInput, emailError);
    return true;
  }

  /**
   * Show success message
   */
  function showSuccess() {
    form.classList.add('hidden');
    successMessage.classList.remove('hidden');
  }

  // Real-time validation
  emailInput.addEventListener('input', () => {
    if (emailInput.classList.contains('error')) {
      validateEmailField();
    }
  });

  emailInput.addEventListener('blur', validateEmailField);

  // Form submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validate
    if (!validateEmailField()) {
      emailInput.focus();
      return;
    }

    // Hide any existing messages
    successMessage.classList.add('hidden');
    errorMessage.classList.add('hidden');

    // Set loading state
    setButtonLoading(submitBtn, btnText, spinner, true);

    try {
      const email = emailInput.value.trim();
      const response = await api.forgotPassword(email);

      if (response.success) {
        showSuccess();
      } else {
        showErrorAlert(errorMessage, errorText, response.message || 'Failed to send reset link');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Show generic error (don't leak user existence)
      showSuccess();
    } finally {
      setButtonLoading(submitBtn, btnText, spinner, false);
    }
  });
});