import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import cors from 'cors';
import { sendOrderEmail } from './mail.js';
import { generateOrderPdf } from './pdf.js';
import supabase from './supabaseClient.js';

dotenv.config();
const app = express();
app.use(bodyParser.json({ limit: '1mb' }));

const corsOptions = {
  // Autorise toutes les origines (pour le développement avec Expo/Ngrok)
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

app.post('/generate-order-pdf', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.orderNumber || !payload.clientName) {
      return res.status(400).json({ error: 'Données de commande manquantes (orderNumber, clientName requis)' });
    }

    const pdfData = payload;
    const pdfBuffer = await generateOrderPdf(pdfData);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename=Commande-${payload.orderNumber}.pdf`);
    return res.send(pdfBuffer);

  } catch (err) {
    console.error('Erreur /generate-order-pdf', err);
    return res.status(500).json({ error: String(err) });
  }
});

// --- POST : envoyer le PDF par mail ---
app.post('/send-order-pdf', async (req, res) => {
  try {
    const payload = req.body;
    if (!payload.orderNumber || !payload.toEmail || !payload.clientCode) {
      return res.status(400).json({ error: 'orderNumber, toEmail et clientCode sont requis' });
    }

    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .select('nom, adresse, code_postal, ville')
      .eq('code_client', payload.clientCode)
      .single();
    if (clientError || !clientData) throw clientError || new Error('Client introuvable');

    const pdfData = {
      clientName: clientData.nom,
      clientAddress: clientData.adresse,
      clientCode: clientData.code_postal,
      clientVille: clientData.ville,
      orderNumber: payload.orderNumber,
      cart: payload.cart.map((item: any) => ({
        reference: item.code,
        designation: item.designation,
        internalRef: item.internalRef || '',
        qty: item.quantite,
      })),
      comment: payload.comment || '',
    };

    const pdfBuffer = await generateOrderPdf(pdfData);

    await sendOrderEmail({
      to: payload.toEmail,
      subject: `Commande #${payload.orderNumber}`,
      text: `Bonjour ${clientData.nom},\n\nVeuillez trouver votre bon de commande en pièce jointe.`,
      attachments: [
        {
          filename: `Commande-${payload.orderNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Erreur /send-order-pdf', err);
    return res.status(500).json({ error: String(err) });
  }
});

app.get("/order-pdf/:orderNumber", async (req, res) => {
  try {
    const orderNumber = req.params.orderNumber as string;

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      console.error("Erreur commande:", error);
      return res.status(404).send("Commande non trouvée");
    }

    const { data: client } = await supabase
      .from("clients")
      .select("nom, adresse, code_postal, ville")
      .eq("code_client", order.client_id)
      .single();

    const pdfBuffer = await generateOrderPdf({
      clientName: client?.nom || "",
      clientAddress: client?.adresse || "",
      clientCode: client?.code_postal || "",
      clientVille: client?.ville || "",
      orderNumber,
      cart: order.items.products.map((p: any) => ({
        reference: p.code,
        designation: p.designation,
        qty: p.quantity,
      })),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Commande-${orderNumber}.pdf"`
    );
    res.send(Buffer.from(pdfBuffer));
  } catch (err) {
    console.error("Erreur génération PDF:", err);
    res.status(500).send("Erreur serveur lors de la génération du PDF");
  }
});

// --- MODIFICATION ICI : On génère le PDF directement au lieu de le fetcher ---
app.get("/pdf-proxy/:orderNumber", async (req, res) => {
  try {
    // Exactement la même logique que /order-pdf/ : on génère localement.
    // Plus besoin de fetch vers ngrok, plus d'erreur SSL !
    const orderNumber = req.params.orderNumber as string;

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      return res.status(404).send("Commande non trouvée");
    }

    const { data: client } = await supabase
      .from("clients")
      .select("nom, adresse, code_postal, ville")
      .eq("code_client", order.client_id)
      .single();

    const pdfBuffer = await generateOrderPdf({
      clientName: client?.nom || "",
      clientAddress: client?.adresse || "",
      clientCode: client?.code_postal || "",
      clientVille: client?.ville || "",
      orderNumber,
      cart: order.items.products.map((p: any) => ({
        reference: p.code,
        designation: p.designation,
        qty: p.quantity,
      })),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="Commande-${orderNumber}.pdf"`
    );
    res.send(Buffer.from(pdfBuffer));
    
  } catch (err) {
    console.error("Erreur /pdf-proxy/:orderNumber", err);
    res.status(500).send("Erreur serveur lors de la génération du PDF");
  }
});


// 🚀 Lancement du serveur
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});