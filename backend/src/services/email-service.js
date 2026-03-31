import crypto from 'crypto';

// Constants
const TOKEN_EXPIRY_HOURS = 1;
const DEFAULT_FRONTEND_PORT = '5173';

/**
 * Email Service for sending password reset emails
 *
 * For development/demo purposes, this logs emails to console.
 * In production, replace with actual email service (SendGrid, AWS SES, etc.)
 */
class EmailService {
  constructor() {
    this.isDevMode = process.env.NODE_ENV !== 'production';
    this.frontendUrl = process.env.FRONTEND_URL || `http://localhost:${DEFAULT_FRONTEND_PORT}`;
  }

  async sendPasswordResetEmail(email, token, userName = '') {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;
    const greeting = userName ? `Hello ${userName},` : 'Hello,';

    const emailContent = {
      to: email,
      subject: 'Password Reset Request - ATS Application',
      text: this._generatePlainTextEmail(resetUrl, greeting),
      html: this._generateHtmlEmail(resetUrl, greeting)
    };

    if (this.isDevMode) {
      return this._logDevModeEmail(email, emailContent.subject, resetUrl);
    }

    // Production: integrate with actual email provider
    return {
      success: false,
      messageId: null,
      error: 'Email service not configured'
    };
  }

  _logDevModeEmail(email, subject, resetUrl) {
    console.log('\n========================================');
    console.log('PASSWORD RESET EMAIL (DEV MODE)');
    console.log('========================================');
    console.log(`To: ${email}`);
    console.log(`Subject: ${subject}`);
    console.log('----------------------------------------');
    console.log('Reset URL:', resetUrl);
    console.log('========================================\n');

    return {
      success: true,
      messageId: `dev-${crypto.randomUUID()}`,
      previewUrl: resetUrl
    };
  }

  _generatePlainTextEmail(resetUrl, greeting) {
    return `${greeting}

You recently requested to reset your password for your ATS Application account.

Click the link below to reset your password:
${resetUrl}

This link will expire in ${TOKEN_EXPIRY_HOURS} hour for security reasons.

If you did not request a password reset, please ignore this email or contact support if you have concerns.

Best regards,
ATS Application Team`;
  }

  _generateHtmlEmail(resetUrl, greeting) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Password Reset</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #007bff;
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 20px 0;
    }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <h2>Password Reset Request</h2>
    <p>${greeting}</p>
    <p>You recently requested to reset your password for your ATS Application account.</p>
    <p>Click the button below to reset your password:</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <p>Or copy and paste this link into your browser:</p>
    <p><a href="${resetUrl}">${resetUrl}</a></p>
    <p><strong>This link will expire in ${TOKEN_EXPIRY_HOURS} hour for security reasons.</strong></p>
    <p>If you did not request a password reset, please ignore this email or contact support if you have concerns.</p>
    <div class="footer">
      <p>Best regards,<br>ATS Application Team</p>
    </div>
  </div>
</body>
</html>`;
  }
}

export default new EmailService();
