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
  origin: '*',
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
app.use(cors(corsOptions));

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

    const contactName = `${payload.firstName || ''} ${payload.lastName || ''}`.trim();

    const pdfData = {
      clientName: clientData.nom,
      clientContact: contactName,
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

    const pdfUint8Array = await generateOrderPdf(pdfData);
    const pdfBuffer = Buffer.from(pdfUint8Array);

    await sendOrderEmail({
      to: "etn@equipement-technique-du-nord.fr",
      subject: `Nouvelle Commande #${payload.orderNumber} - ${clientData.nom}`,
      text: `Bonjour Admin,\n\nUne nouvelle commande a été passée par ${clientData.nom} (Contact : ${contactName}).\n\nVous trouverez le bon de commande en pièce jointe.`,
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

app.get("/pdf-proxy/:orderNumber", async (req, res) => {
  try {
    const orderNumber = decodeURIComponent(req.params.orderNumber as string);

    const { data: order, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_number", orderNumber)
      .single();

    if (error || !order) {
      console.error("Commande non trouvée pour :", orderNumber);
      return res.status(404).send("Commande non trouvée");
    }

    const { data: client } = await supabase
      .from("clients")
      .select("nom, adresse, code_postal, ville")
      .eq("code_client", order.client_id)
      .single();

    const contactName = `${order.first_name || ''} ${order.last_name || ''}`.trim();

    const pdfBuffer = await generateOrderPdf({
      clientName: client?.nom || "",
      clientContact: contactName,
      clientAddress: client?.adresse || "",
      clientCode: client?.code_postal || "",
      clientVille: client?.ville || "",
      orderNumber: orderNumber,
      comment: order.comment || "",
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

app.get("/order-pdf/:orderNumber", async (req, res) => {
    try {
      const orderNumber = decodeURIComponent(req.params.orderNumber as string);
      const { data: order, error } = await supabase.from("orders").select("*").eq("order_number", orderNumber).single();
  
      if (error || !order) return res.status(404).send("Commande non trouvée");
  
      const { data: client } = await supabase.from("clients").select("nom, adresse, code_postal, ville").eq("code_client", order.client_id).single();
  
      const pdfBuffer = await generateOrderPdf({
        clientName: client?.nom || "",
        clientContact: `${order.first_name || ''} ${order.last_name || ''}`.trim(),
        clientAddress: client?.adresse || "",
        clientCode: client?.code_postal || "",
        clientVille: client?.ville || "",
        orderNumber,
        comment: order.comment || "",
        cart: order.items.products.map((p: any) => ({ reference: p.code, designation: p.designation, qty: p.quantity })),
      });
  
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="Commande-${orderNumber}.pdf"`);
      res.send(Buffer.from(pdfBuffer));
    } catch (err) {
      console.error("Erreur génération PDF:", err);
      res.status(500).send("Erreur serveur");
    }
  });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`);
});