import * as XLSX from 'xlsx';

const HEADERS = [
  "FICHE", "TRAITEMENT", "DOSSIER", "ETABLISSEMENT", "REF_PIECE",
  "TYPE_TIERS", "TYPE_PIECE", "LIEN_JOINT", "CODE_TIERS", "CODE_OP",
  "DEPOT", "DATE_PIECE", "PIECE_EXTERNE", "NO_SOUS_LIGNE", "REFERENCE",
  "SREF1", "SREF2", "DESIGNATION", "REF_FOURNISSEUR", "QUANTITE",
  "EMPLACEMENT", "SERIE", "QUANTITE_VTL", "NOTE_ENTETE", "TEXTE_ENTETE",
  "TEXTE_PIED", "NOTE_LIGNE", "TEXTE_LIGNE", "ADRESSE_COMPLEMENT_1",
  "ADRESSE_COMPLEMENT_2", "NOM", "RUE", "LOCALITE", "VILLE", "PAYS",
  "CODE_POSTAL", "CODE_DE_DISTRIBUITION_ETRANGER", "CODE_DE_REGION_ADMINISTRATIVE",
  "CODE_INSEE", "CODE_SERVICE", "ENGAGEMENT", "FICHIER_JOINT_NUMERIQUES_REQUIS_AVANT_ENVOI_DEMATERIALISATION",
  "ENVOI_DEMATERIALISE_AU_TIERS_ADRESSE_OUI_OU_NON", "CODE_TAXE",
  "PRIX_UNITAIRE_ECO_CONTRIBUTION", "UNITE_ECO_CONTRIBUTION", "LIBELLE", "ERREUR"
];

export function generateDivaltoExcel(payload: any): Buffer {
  const rows: any[][] = [];

  const titleRow = new Array(HEADERS.length).fill("");
  titleRow[2] = "Intégration de pièce: Nouvelle création";
  rows.push(titleRow.map(v => ({ v, t: "s" })));

  rows.push(new Array(HEADERS.length).fill({ v: "", t: "s" }));
  rows.push(HEADERS.map(v => ({ v, t: "s" })));

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const buildRow = (data: Record<string, string | number>) => {
    return HEADERS.map(h => {
      const val = data[h] !== undefined ? String(data[h]) : "";
      return { v: val, t: "s" }; 
    });
  };

  rows.push(buildRow({
    FICHE: "IPAR", TRAITEMENT: "CREATION", DOSSIER: "1", ETABLISSEMENT: "",
    TYPE_TIERS: "Client", TYPE_PIECE: "Commande"
  }));

  rows.push(buildRow({
      FICHE: "ENT", TRAITEMENT: "CREATION", DOSSIER: "1", ETABLISSEMENT: "",
      TYPE_TIERS: "C", TYPE_PIECE: "2", 
      DEPOT: "1",
      CODE_OP: "1",
      CODE_TIERS: String(payload.clientCode).trim().toUpperCase(),
      REF_PIECE: String(payload.orderNumber).trim(),
      DATE_PIECE: dateStr
    }));

  if (payload.cart && Array.isArray(payload.cart)) {
      payload.cart.forEach((item: any) => {
        rows.push(buildRow({
          FICHE: "MOUV", TRAITEMENT: "CREATION", DOSSIER: "1", ETABLISSEMENT: "",
          DEPOT: "1",
          CODE_OP: "1",
          REFERENCE: String(item.code).trim().toUpperCase(),
          QUANTITE: item.quantite
        }));
      });
    }

  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Piece");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}