import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT || 1025),
  secure: process.env.MAIL_SECURE === 'true',
  auth: process.env.MAIL_USER
    ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASS }
    : undefined,
  tls: { rejectUnauthorized: false },
});

export async function sendOrderEmail(opts: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}) {
  const from = `${process.env.FROM_NAME || 'ETN'} <${
    process.env.FROM_EMAIL || 'no-reply@example.com'
  }>`;
  const info = await transporter.sendMail({
    from,
    to: opts.to,
    subject: opts.subject,
    text: opts.text,
    html: opts.html,
    attachments: opts.attachments,
  });
  console.log('Email envoyé:', info.messageId);
  return info;
}
