import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const transporter = nodemailer.createTransport({
  host: 'smtp.resend.com', 
  port: 465,                
  secure: true,             
  auth: {
    user: 'resend',
    pass: process.env.RESEND_API_KEY 
  },
  tls: { rejectUnauthorized: false },
});

export async function sendOrderEmail(opts: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}) {
const from = 'onboarding@resend.dev'; 
  
  console.log(`Tentative d'envoi à ${opts.to} via Resend...`);

  try {
    const info = await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
      attachments: opts.attachments,
    });
    console.log('Email envoyé avec succès:', info.messageId);
    return info;
  } catch (error) {
    console.error("ERREUR CRITIQUE ENVOI MAIL:", error);
    throw error;
  }
}