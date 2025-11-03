import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export type CartItem = {
  reference: string;
  designation: string;
  internalRef?: string;
  qty: number;
};

const companyName = "EQUIPEMENT TECHNIQUE DU NORD";
const companyAddress = "Z.A. - 1, chemin de Messines II";
const companyPostal = "59871 - Saint André CEDEX";
const companyPhone = "03 20 92 27 51";
const companyEmail = "etn@equipement-technique-du-nord.fr";

export async function generateOrderPdf(data: {
  clientName: string;
  clientAddress: string;
  clientCode: string;
  clientVille: string;
  orderNumber: string;
  cart: CartItem[];
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  let page = doc.addPage([595, 842]);
  const { width, height } = page.getSize();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const primaryColor = rgb(0.1, 0.2, 0.4);
  const accentColor = rgb(0.2, 0.4, 0.7);
  const lightGray = rgb(0.95, 0.95, 0.95);
  const darkGray = rgb(0.3, 0.3, 0.3);

  const margin = 50;
  let y = height - margin;

  // Bandeau supérieur coloré
  page.drawRectangle({
    x: 0,
    y: height - 120,
    width: width,
    height: 150,
    color: primaryColor,
  });

  // En-tête entreprise (en blanc sur fond coloré)
  page.drawText(companyName, {
    x: margin,
    y: height - 40,
    size: 18,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(companyAddress, {
    x: margin,
    y: height - 58,
    size: 9,
    font,
    color: rgb(1, 1, 1),
  });

  page.drawText(companyPostal, {
    x: margin,
    y: height - 72,
    size: 9,
    font,
    color: rgb(1, 1, 1),
  });

  page.drawText(`Tél: ${companyPhone}  |  Email: ${companyEmail}`, {
    x: margin,
    y: height - 86,
    size: 9,
    font,
    color: rgb(1, 1, 1),
  });

  y = height - 150;

  // Titre du document
  page.drawText("COMMANDE", {
    x: margin,
    y,
    size: 20,
    font: fontBold,
    color: accentColor,
  });

  page.drawText(`N° ${data.orderNumber}`, {
    x: width - margin - 120,
    y,
    size: 14,
    font: fontBold,
    color: darkGray,
  });

  y -= 40;

  // Encadré client
  const clientBoxY = y - 80;
  page.drawRectangle({
    x: margin,
    y: clientBoxY,
    width: 250,
    height: 80,
    color: lightGray,
    borderColor: primaryColor,
    borderWidth: 1,
  });

  y -= 22;
  page.drawText(data.clientName, {
    x: margin + 10,
    y,
    size: 11,
    font: fontBold,
    color: rgb(0, 0, 0),
  });

  y -= 16;
  page.drawText(data.clientAddress, {
    x: margin + 10,
    y,
    size: 10,
    font,
    color: darkGray,
  });

  y -= 16;
  page.drawText(`${data.clientCode} - ${data.clientVille}`, {
    x: margin + 10,
    y,
    size: 10,
    font,
    color: darkGray,
  });

  y -= 45;

  // En-tête du tableau
  const tableTop = y;
  const colWidths = [180, 240, 50];
  const headers = ["Référence", "Désignation", "Qté"];

  page.drawRectangle({
    x: margin,
    y: tableTop - 20,
    width: width - 2 * margin,
    height: 20,
    color: accentColor,
  });

  let x = margin + 8;
  headers.forEach((h, i) => {
    page.drawText(h, {
      x,
      y: tableTop - 14,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    x += colWidths[i];
  });

  y = tableTop - 35;

  // Lignes du panier
  let rowIndex = 0;
  for (const item of data.cart) {
    if (y < 80) {
      page = doc.addPage([595, 842]);
      y = height - margin;
      rowIndex = 0;
    }

    // Alternance de couleur de fond
    if (rowIndex % 2 === 0) {
      page.drawRectangle({
        x: margin,
        y: y - 3,
        width: width - 2 * margin,
        height: 18,
        color: rgb(0.98, 0.98, 0.98),
      });
    }

    x = margin + 8;
    page.drawText(item.reference || "", {
      x,
      y,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });

    x += colWidths[0];
    const designation = item.designation.length > 45 
      ? item.designation.substring(0, 42) + "..." 
      : item.designation;
    page.drawText(designation, {
      x,
      y,
      size: 9,
      font,
      color: rgb(0, 0, 0),
    });

    x += colWidths[1];
    page.drawText(item.internalRef || "", {
      x,
      y,
      size: 9,
      font,
      color: darkGray,
    });

    x += colWidths[2];
    page.drawText(item.qty.toString(), {
      x,
      y,
      size: 9,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    y -= 18;
    rowIndex++;
  }

  // Ligne de fin de tableau
  page.drawLine({
    start: { x: margin, y: y + 5 },
    end: { x: width - margin, y: y + 5 },
    thickness: 1.5,
    color: primaryColor,
  });

  // Pied de page
  const footerY = 40;
  page.drawText(`${companyName} - ${companyPhone}`, {
    x: margin,
    y: footerY,
    size: 8,
    font,
    color: darkGray,
  });

  page.drawText(`Document généré le ${new Date().toLocaleDateString('fr-FR')}`, {
    x: width - margin - 150,
    y: footerY,
    size: 8,
    font,
    color: darkGray,
  });

  return await doc.save();
}