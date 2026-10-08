const nodemailer = require('nodemailer');

/**
 * Creates and returns a Nodemailer transporter based on .env configuration
 */
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const user = process.env.SMTP_USER || process.env.EMAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.EMAIL_PASS;
  const service = process.env.EMAIL_SERVICE; // e.g. 'gmail'

  if (service && user && pass) {
    return nodemailer.createTransport({
      service,
      auth: { user, pass }
    });
  }

  if (host && user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  if (user && pass) {
    // Default to Gmail if only user and pass are provided
    return nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass }
    });
  }

  return null;
}

/**
 * Sends welcome email with auto-generated credentials to newly registered volunteer
 */
async function sendVolunteerWelcomeEmail({ email, fullName, username, password, expertRole, loginUrl }) {
  const portalUrl = loginUrl || process.env.FRONTEND_URL || 'http://localhost:5000/login';
  const roleName = expertRole || 'Volunteer';
  const name = fullName || username || 'Volunteer';

  const transporter = createTransporter();

  const subject = `Welcome to CrewLink! Your Volunteer Account Credentials`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0f172a; margin: 0; padding: 20px; color: #f8fafc; }
        .container { max-width: 580px; margin: 0 auto; background: #1e293b; border-radius: 16px; overflow: hidden; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4); }
        .header { background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%); padding: 32px 24px; text-align: center; border-bottom: 1px solid #4338ca; }
        .logo-title { font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; margin: 0; }
        .logo-sub { color: #a5b4fc; font-size: 13px; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .content { padding: 32px 28px; line-height: 1.6; }
        .greeting { font-size: 18px; font-weight: 700; color: #ffffff; margin-bottom: 12px; }
        .message { font-size: 15px; color: #cbd5e1; margin-bottom: 24px; }
        .credentials-card { background: #0f172a; border: 1px solid #3b82f6; border-radius: 12px; padding: 20px 24px; margin-bottom: 24px; }
        .cred-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #60a5fa; font-weight: 700; margin-bottom: 14px; }
        .cred-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #1e293b; padding-bottom: 8px; }
        .cred-row:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
        .cred-label { color: #94a3b8; font-weight: 500; }
        .cred-value { color: #ffffff; font-weight: 700; font-family: monospace; font-size: 15px; }
        .pwd-highlight { background: rgba(59, 130, 246, 0.15); color: #93c5fd; padding: 3px 8px; border-radius: 6px; border: 1px dashed #3b82f6; font-size: 16px; letter-spacing: 0.5px; }
        .cta-btn { display: block; width: 100%; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); color: #ffffff !important; padding: 14px 20px; border-radius: 10px; font-weight: 700; font-size: 15px; text-decoration: none; margin-bottom: 20px; box-sizing: border-box; }
        .notice { font-size: 12px; color: #94a3b8; background: rgba(255,255,255,0.03); border-left: 3px solid #3b82f6; padding: 10px 14px; border-radius: 0 8px 8px 0; margin-bottom: 20px; }
        .footer { padding: 20px 28px; background: #0f172a; border-top: 1px solid #1e293b; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 class="logo-title">CrewLink</h1>
          <div class="logo-sub">Event Crew & Volunteer Management</div>
        </div>
        <div class="content">
          <div class="greeting">Welcome aboard, ${name}! 👋</div>
          <p class="message">
            An administrator has added you to the <strong>CrewLink</strong> volunteer team. Your volunteer account has been created and verified.
          </p>
          <div class="credentials-card">
            <div class="cred-title">🔐 Your Login Credentials</div>
            <div class="cred-row">
              <span class="cred-label">Email:</span>
              <span class="cred-value">${email}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Username:</span>
              <span class="cred-value">${username}</span>
            </div>
            <div class="cred-row">
              <span class="cred-label">Assigned Role:</span>
              <span class="cred-value" style="color: #a78bfa;">${roleName}</span>
            </div>
            <div class="cred-row" style="margin-top: 6px;">
              <span class="cred-label">Auto-Generated Password:</span>
              <span class="cred-value pwd-highlight">${password}</span>
            </div>
          </div>
          <a href="${portalUrl}" class="cta-btn">Sign In to CrewLink Portal &rarr;</a>
          <div class="notice">
            💡 <strong>Security Tip:</strong> You can sign in using either your Email or Username with the auto-generated password above. You may update your profile details and photo anytime from your dashboard.
          </div>
        </div>
        <div class="footer">
          &copy; ${new Date().getFullYear()} CrewLink. All rights reserved.<br>
          This is an automated notification sent on account creation.
        </div>
      </div>
    </body>
    </html>
  `;

  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`📧 [MOCK EMAIL SERVICE] SMTP credentials not set in server/.env`);
    console.log(`   Recipient: ${email} (${name})`);
    console.log(`   Username:  ${username}`);
    console.log(`   Password:  ${password}`);
    console.log(`   Role:      ${roleName}`);
    console.log(`   Login URL: ${portalUrl}`);
    console.log(`======================================================\n`);
    return {
      success: false,
      isMock: true,
      error: 'SMTP not configured in server/.env (Credentials logged to server console & admin report)'
    };
  }

  try {
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USER || 'no-reply@crewlink.com';
    const info = await transporter.sendMail({
      from: `"CrewLink Administration" <${fromAddress}>`,
      to: email,
      subject,
      html
    });
    console.log(`✅ [EMAIL SENT] Welcome credentials delivered to ${email} (MessageId: ${info.messageId})`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [EMAIL ERROR] Failed sending to ${email}:`, error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  createTransporter,
  sendVolunteerWelcomeEmail
};
