import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.RESEND_API_KEY) {
  throw new Error("RESEND_API_KEY est manquant dans les variables d'environnement");
}

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendOrderEmail(opts: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: any[];
}) {
  console.log(`Tentative d'envoi à ${opts.to} via Resend API...`);

  try {

    const data = await resend.emails.send({
      from: 'ETN <commandes@etn-app.fr>',
      to: [opts.to],
      subject: opts.subject,
      text: opts.text || '',
      html: opts.html,
      attachments: opts.attachments,
    });

    if (data.error) {
      console.error("Erreur retournée par Resend:", data.error);
      throw data.error;
    }

    console.log('Email envoyé avec succès, ID:', data.data?.id);
    return data;
  } catch (error) {
    console.error("ERREUR CRITIQUE ENVOI MAIL (API):", error);
    throw error;
  }
}