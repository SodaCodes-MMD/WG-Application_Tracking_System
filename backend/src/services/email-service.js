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

  async sendDeadlineDigestEmail(email, jobs, notifications) {
    const overdueJobs = jobs.filter((j) => new Date(j.deadline) < new Date()).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    const upcomingJobs = jobs.filter((j) => new Date(j.deadline) >= new Date()).sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    const emailContent = {
      to: email,
      subject: "Job Application Deadline Reminder - Hirify",
      text: this._generatePlainTextDigest(overdueJobs, upcomingJobs),
      html: this._generateHtmlDigest(overdueJobs, upcomingJobs),
    };

    if (this.isDevMode) {
      return this._logDevModeEmail(email, emailContent.subject, emailContent.text);
    }

    return { success: false, messageId: null, error: "Email service not configured" };
  }

  _generatePlainTextDigest(overdueJobs, upcomingJobs) {
    let text = "Hirify - Job Application Deadline Reminder\n";
    text += "==============================================\n\n";

    if (overdueJobs.length > 0) {
      text += "OVERDUE:\n";
      text += "--------\n";
      for (const job of overdueJobs) {
        text += `- ${job.title} at ${job.company} (Deadline: ${new Date(job.deadline).toLocaleDateString()})\n`;
      }
      text += "\n";
    }

    if (upcomingJobs.length > 0) {
      text += "UPCOMING:\n";
      text += "---------\n";
      for (const job of upcomingJobs) {
        const daysUntil = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        text += `- ${job.title} at ${job.company} (Deadline: ${new Date(job.deadline).toLocaleDateString()} - ${daysUntil} day${daysUntil !== 1 ? "s" : ""} away)\n`;
      }
      text += "\n";
    }

    text += "---\nManage your notifications in Hirify settings.\n";
    return text;
  }

  _generateHtmlDigest(overdueJobs, upcomingJobs) {
    const formatDate = (d) => new Date(d).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

    let jobsHtml = "";

    if (overdueJobs.length > 0) {
      jobsHtml += '<h3 style="color: #cf222e; margin-bottom: 8px;">Overdue</h3><ul style="margin: 0 0 20px; padding-left: 20px;">';
      for (const job of overdueJobs) {
        jobsHtml += `<li><strong>${job.title}</strong> at ${job.company} - Due: ${formatDate(job.deadline)}</li>`;
      }
      jobsHtml += "</ul>";
    }

    if (upcomingJobs.length > 0) {
      jobsHtml += '<h3 style="color: #0969da; margin-bottom: 8px;">Upcoming Deadlines</h3><ul style="margin: 0 0 20px; padding-left: 20px;">';
      for (const job of upcomingJobs) {
        const daysUntil = Math.ceil((new Date(job.deadline) - new Date()) / (1000 * 60 * 60 * 24));
        const urgencyColor = daysUntil <= 1 ? "#cf222e" : daysUntil <= 3 ? "#d29922" : "#0969da";
        jobsHtml += `<li><strong>${job.title}</strong> at ${job.company} - Due: ${formatDate(job.deadline)} <span style="color: ${urgencyColor};">(${daysUntil} day${daysUntil !== 1 ? "s" : ""} away)</span></li>`;
      }
      jobsHtml += "</ul>";
    }

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Deadline Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #009B3A 60%, #007a2e 100%); padding: 24px; border-radius: 8px 8px 0 0;">
    <h1 style="color: #f0c800; margin: 0; font-size: 1.5rem;">Hirify</h1>
    <p style="color: white; margin: 8px 0 0;">Job Application Deadline Reminder</p>
  </div>
  <div style="background: white; padding: 24px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 8px 8px;">
    <p>Hello,</p>
    <p>You have <strong>${overdueJobs.length + upcomingJobs.length}</strong> job application deadline${overdueJobs.length + upcomingJobs.length !== 1 ? "s" : ""} to review:</p>
    ${jobsHtml}
    <p style="margin-top: 24px; font-size: 12px; color: #666;">Manage your notification preferences in Hirify Settings.</p>
  </div>
  <div style="text-align: center; margin-top: 16px;">
    <p style="font-size: 11px; color: #999;">You received this email because deadline notifications are enabled.</p>
  </div>
</body>
</html>`;
  }
}

export default new EmailService();
