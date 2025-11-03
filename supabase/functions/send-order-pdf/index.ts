import { PDFDocument, rgb, StandardFonts } from "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/+esm";
import { Resend } from "https://esm.sh/resend@3.2.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY manquant");

const resend = new Resend(RESEND_API_KEY);

Deno.serve(async (req) => {
  try {
    const body = await req.json();
    const { firstName, lastName, orderNumber, cart, comment } = body;

    console.log("📦 Données reçues :", body);

    // Génération du PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    page.drawText(`Bon de commande #${orderNumber}`, { x: 50, y: 750, size: 20, font, color: rgb(0, 0, 0) });
    page.drawText(`Client : ${firstName} ${lastName}`, { x: 50, y: 720, size: 14, font });
    page.drawText(`Commentaire : ${comment || "-"}`, { x: 50, y: 700, size: 12, font });

    let y = 670;
    cart.forEach((item: any) => {
      page.drawText(`- ${item.designation} (Réf: ${item.code}) x${item.quantite}`, { x: 50, y, size: 12, font });
      y -= 20;
    });

    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = btoa(String.fromCharCode(...pdfBytes));

    // Envoi de l’email
    await resend.emails.send({
      from: "mathis.philippe2005@gmail.com", // doit être un email vérifié ResendA
      to: "mathis.philippe2005@gmail.com",
      subject: `Bon de commande #${orderNumber}`,
      html: `<p>Nouveau bon de commande de ${firstName} ${lastName}</p>`,
      attachments: [
        {
          filename: `Commande-${orderNumber}.pdf`,
          content: pdfBase64,
        },
      ],
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("❌ Erreur send-order-pdf :", err instanceof Error ? err.message : String(err));
    return new Response(JSON.stringify({ error: String(err) }), { status: 200 });

  }
});
