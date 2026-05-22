export function parseQrData(raw: string) {
  const data = (raw ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\u200B/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .trim();

  const lines = data.split("\n").map((l) => l.trim());

  const codeClient =
    lines.find((l) => l.toLowerCase().startsWith("code client"))?.replace(/code client\s*:/i, "").trim() ?? "";

  let reference =
    lines.find((l) => l.toLowerCase().startsWith("référence"))?.replace(/référence\s*:/i, "").trim() ?? "";

  reference = reference.replace(/\u00A0/g, " ").replace(/\s+/g, " ").trim();

  const designation =
    lines.find((l) => l.toLowerCase().startsWith("désignation"))?.replace(/désignation\s*:/i, "").trim() ?? "";

  return { codeClient, reference, designation };
}