import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

export async function sendEmailConfirmation(to: string, confirmUrl: string) {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #333; line-height: 1.5;">
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="/fynflo-logo.png" alt="Fynflo" width="100" style="display: block; margin: auto;" />
    </div>

    <h2 style="color: #1E40AF; text-align: center;">Welcome to Fynflo!</h2>

    <p>Hello,</p>

    <p>Thank you for signing up for <strong>Fynflo</strong>. Please confirm your email address by clicking the button below:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${confirmUrl}" style="
        background-color: #1E40AF;
        color: #ffffff;
        padding: 14px 28px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        display: inline-block;
        font-size: 16px;
      ">Confirm Email</a>
    </div>

    <p>If the button doesn’t work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all;"><a href="${confirmUrl}" style="color: #1E40AF;">${confirmUrl}</a></p>

    <p>If you didn’t create an account, you can safely ignore this email.</p>

    <p>Thanks,<br/><strong>The Fynflo Team</strong></p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

    <p style="font-size: 12px; color: #888; text-align: center;">
      Fynflo | <a href="mailto:support@fynflo.com" style="color: #888;">support@fynflo.com</a><br/>
      © ${new Date().getFullYear()} Fynflo. All rights reserved.
    </p>
  </div>
  `;

  const text = `
Welcome to Fynflo!

Hello,

Thank you for signing up for Fynflo. Please confirm your email address by visiting this link:

${confirmUrl}

If you didn’t create an account, you can safely ignore this email.

Thanks,
The Fynflo Team
support@fynflo.com
`;

  await transporter.sendMail({
    from: `"Fynflo Team" <${config.smtp.user}>`,
    to,
    subject: 'Confirm your Fynflo account',
    html,
    text,
  });
}

// Remember to add a logo to the email.
export async function sendPasswordReset(to: string, resetUrl: string) {
  const html = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; color: #333; line-height: 1.5;">
    <div style="text-align: center; margin-bottom: 30px;">
      <img src="/fynflo-logo.png" alt="Fynflo" width="100" style="display: block; margin: auto;" />
    </div>

    <h2 style="color: #1E40AF; text-align: center;">Reset Your Password</h2>

    <p>Hello,</p>

    <p>We received a request to reset the password for your <strong>Fynflo</strong> account. Click the button below to set a new password:</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${resetUrl}" style="
        background-color: #1E40AF;
        color: #ffffff;
        padding: 14px 28px;
        text-decoration: none;
        border-radius: 6px;
        font-weight: bold;
        display: inline-block;
        font-size: 16px;
      ">Reset Password</a>
    </div>

    <p>If the button doesn’t work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all;"><a href="${resetUrl}" style="color: #1E40AF;">${resetUrl}</a></p>

    <p>If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>

    <p>Thanks,<br/><strong>The Fynflo Team</strong></p>

    <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />

    <p style="font-size: 12px; color: #888; text-align: center;">
      Fynflo | <a href="mailto:support@fynflo.com" style="color: #888;">support@fynflo.com</a><br/>
      © ${new Date().getFullYear()} Fynflo. All rights reserved.
    </p>
  </div>
  `;

  const text = `
Reset Your Password

Hello,

We received a request to reset the password for your Fynflo account. Use this link to set a new password:

${resetUrl}

If you did not request a password reset, you can safely ignore this email. Your account remains secure.

Thanks,
The Fynflo Team
support@fynflo.com
`;

  await transporter.sendMail({
    from: `"Fynflo Team" <${config.smtp.user}>`,
    to,
    subject: 'Reset your Fynflo password',
    html,
    text,
  });
}
