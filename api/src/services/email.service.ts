import nodemailer from 'nodemailer';
import config from '../config';

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  auth: { user: config.smtp.user, pass: config.smtp.pass },
});

export async function sendEmailConfirmation(to: string, confirmUrl: string) {
  const html = `<p>Confirm your email by clicking <a href="${confirmUrl}">here</a></p>`;
  await transporter.sendMail({
    from: config.smtp.user,
    to,
    subject: 'Confirm your email',
    html,
  });
}

export async function sendPasswordReset(to: string, resetUrl: string) {
  const html = `<p>Reset your password: <a href="${resetUrl}">Reset password</a></p>`;
  await transporter.sendMail({
    from: config.smtp.user,
    to,
    subject: 'Reset your password',
    html,
  });
}
