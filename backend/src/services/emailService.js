"use strict";

const nodemailer = require("nodemailer");
const env = require("../config/env");

const emailService = {
  /**
   * Resiliently send an OTP code to a recipient email address.
   * If SMTP credentials are not configured in .env, falls back to logging the OTP to the console.
   *
   * @param {string} toEmail
   * @param {string} toName
   * @param {string} otpCode
   * @returns {Promise<void>}
   */
  sendOtpEmail: async (toEmail, toName, otpCode) => {
    const isMock = !env.EMAIL_USER || env.EMAIL_USER.includes("your_gmail") || !env.EMAIL_APP_PASSWORD;

    if (isMock) {
      console.log("┌────────────────────────────────────────────────────────┐");
      WriteMockOtpMessage(toEmail, toName, otpCode);
      console.log("└────────────────────────────────────────────────────────┘");
      return;
    }

    try {
      const transporter = nodemailer.createTransport({
        host: env.EMAIL_HOST || "smtp.gmail.com",
        port: env.EMAIL_PORT || 587,
        secure: env.EMAIL_PORT === 465, // true for 465, false for other ports
        auth: {
          user: env.EMAIL_USER,
          pass: env.EMAIL_APP_PASSWORD,
        },
      });

      const expiryMinutes = env.OTP_EXPIRY_MINUTES || 10;
      const expiryTime = new Date(Date.now() + expiryMinutes * 60 * 1000).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });

      const appName = env.EMAIL_FROM_NAME || "HealthConnect";

      const mailOptions = {
        from: `"${appName}" <${env.EMAIL_USER}>`,
        to: toEmail,
        subject: `[${appName}] Secure Verification Passcode: ${otpCode}`,
        text: `Hello ${toName},\n\nYour secure digital health network OTP pin is ${otpCode}. It is valid for ${expiryMinutes} minutes till ${expiryTime}.\n\nBest Regards,\nHealthConnect Team`,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
            <h2>Secure Verification</h2>
            <p>Hello <strong>${toName}</strong>,</p>
            <p>Your secure digital health network OTP pin is:</p>
            <div style="font-size: 24px; font-weight: bold; background: #f0f7ff; color: #0056b3; padding: 15px; text-align: center; border-radius: 6px; display: inline-block; letter-spacing: 2px;">
              ${otpCode}
            </div>
            <p>It is valid for <strong>${expiryMinutes} minutes</strong> until <strong>${expiryTime}</strong>.</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #777;">This is an automated security transmission from HealthConnect. Please do not share this passcode with anyone.</p>
          </div>
        `,
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Secure OTP email sent successfully to ${toEmail}`);
    } catch (err) {
      console.error("[Email Service] SMTP delivery failed. Falling back to console logger.");
      console.error(err);
      console.log("┌────────────────────────────────────────────────────────┐");
      WriteMockOtpMessage(toEmail, toName, otpCode);
      console.log("└────────────────────────────────────────────────────────┘");
    }
  },
};

/**
 * Utility helper to format a beautiful mock console logger output block.
 */
function WriteMockOtpMessage(toEmail, toName, otpCode) {
  console.log(`  [MOCK EMAIL SERVICE]`);
  console.log(`  Recipient: ${toName} <${toEmail}>`);
  console.log(`  Subject: HealthConnect Verification Code`);
  console.log(`  Message: Your secure OTP pin is: ${otpCode}`);
  console.log(`           Valid for 10 minutes.`);
}

module.exports = emailService;
