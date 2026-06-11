export function parseQrData(raw: string) {
  const data = (raw ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\u200B/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const codeClientMatch = data.match(/code client\s*:\s*(.*?)(?=(?:référence|désignation|$))/i);
  const referenceMatch = data.match(/référence\s*:\s*(.*?)(?=(?:code client|désignation|$))/i);
  const designationMatch = data.match(/désignation\s*:\s*(.*?)(?=(?:code client|référence|$))/i);

  const codeClient = codeClientMatch ? codeClientMatch[1].trim() : "";
  const reference = referenceMatch ? referenceMatch[1].trim() : "";
  const designation = designationMatch ? designationMatch[1].trim() : "";

  return { codeClient, reference, designation };
}