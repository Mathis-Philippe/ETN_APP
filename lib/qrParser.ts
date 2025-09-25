// lib/qrParser.ts
export function parseQrData(raw: string) {
  const data = (raw ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\u200B/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  const lines = data.split("\n").map((l) => l.trim());

  // cas client
  const codeClient =
    lines.find((l) => l.toLowerCase().startsWith("code client"))?.replace(/code client\s*:/i, "").trim() ?? "";

  // cas article
  const reference =
    lines.find((l) => l.toLowerCase().startsWith("référence"))?.replace(/référence\s*:/i, "").trim() ?? "";

  const designation =
    lines.find((l) => l.toLowerCase().startsWith("désignation"))?.replace(/désignation\s*:/i, "").trim() ?? "";

  return { codeClient, reference, designation };
}
