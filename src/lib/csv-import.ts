import { createHash } from "crypto";
import { prisma } from "@/lib/db";

export interface ParsedTransaction {
  bookingDate: Date;
  valueDate?: Date;
  amount: number;
  counterparty?: string;
  reference?: string;
  externalId?: string;
}

function parseGermanDate(value: string): Date | null {
  const trimmed = value.trim();
  const ddmmyyyy = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddmmyyyy) {
    return new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
  }
  const iso = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(parseInt(iso[1]), parseInt(iso[2]) - 1, parseInt(iso[3]));
  }
  const d = new Date(trimmed);
  return isNaN(d.getTime()) ? null : d;
}

function parseGermanAmount(value: string): number | null {
  const cleaned = value.trim().replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

function stripBom(value: string): string {
  return value.charCodeAt(0) === 0xfeff ? value.slice(1) : value;
}

// German bank exports are usually UTF-8 but sometimes Windows-1252; fall back on decode failure.
export function decodeCsvBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const utf8 = new TextDecoder("utf-8").decode(bytes);
  if (utf8.includes("\uFFFD")) {
    return new TextDecoder("windows-1252").decode(bytes);
  }
  return utf8;
}

function detectDelimiter(headerLine: string): string {
  if (headerLine.includes(";")) return ";";
  if (headerLine.includes("\t")) return "\t";
  return ",";
}

// Split a CSV line while respecting double-quoted fields (which may contain the delimiter).
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      result.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result.map((c) => c.trim());
}

function findColumn(headers: string[], candidates: string[], exclude: string[] = []): number {
  const normalized = headers.map((h) => h.toLowerCase().trim());
  for (const candidate of candidates) {
    const idx = normalized.findIndex(
      (h) => h.includes(candidate) && !exclude.some((ex) => h.includes(ex))
    );
    if (idx >= 0) return idx;
  }
  return -1;
}

const DATE_CANDIDATES = ["buchungstag", "buchung", "datum", "date", "booking"];
const VALUE_DATE_CANDIDATES = ["wertstellung", "valuta", "wert", "value"];
const AMOUNT_CANDIDATES = ["betrag", "amount", "umsatz in", "umsatz("];
const COUNTERPARTY_CANDIDATES = [
  "auftraggeber",
  "empfänger",
  "empfaenger",
  "begünstigter",
  "beguenstigter",
  "zahlungspflichtiger",
  "name",
  "partner",
  "counterparty",
];
const REFERENCE_CANDIDATES = ["verwendungszweck", "reference", "beschreibung", "buchungstext", "text", "info"];

// FYRST / Deutsche Bank exports prepend account metadata lines before the real header row,
// and append balance rows ("Kontostand", "Anfangssaldo") after the data. Detect the header
// dynamically and skip anything that is not an actual booking line.
export function parseCsvContent(content: string): ParsedTransaction[] {
  const lines = stripBom(content)
    .split(/\r?\n/)
    .filter((l) => l.trim());
  if (lines.length < 2) return [];

  let headerIdx = -1;
  let headers: string[] = [];
  let delimiter = ";";

  for (let i = 0; i < Math.min(lines.length, 40); i++) {
    const d = detectDelimiter(lines[i]);
    const cols = splitCsvLine(lines[i], d);
    const hasDate = findColumn(cols, DATE_CANDIDATES) >= 0;
    const hasAmount =
      findColumn(cols, AMOUNT_CANDIDATES, ["art"]) >= 0 || findColumn(cols, ["haben"]) >= 0;
    if (hasDate && hasAmount) {
      headerIdx = i;
      headers = cols;
      delimiter = d;
      break;
    }
  }

  if (headerIdx < 0) {
    throw new Error("CSV-Format nicht erkannt. Erforderliche Spalten: Buchungsdatum und Betrag.");
  }

  const dateCol = findColumn(headers, DATE_CANDIDATES);
  const valueDateCol = findColumn(headers, VALUE_DATE_CANDIDATES);
  const amountCol = findColumn(headers, AMOUNT_CANDIDATES, ["art"]);
  const sollCol = findColumn(headers, ["soll"]);
  const habenCol = findColumn(headers, ["haben"]);
  const signCol = findColumn(headers, ["soll/haben", "s/h", "haben/soll"]);
  const counterpartyCol = findColumn(headers, COUNTERPARTY_CANDIDATES);
  const referenceCol = findColumn(headers, REFERENCE_CANDIDATES);

  const results: ParsedTransaction[] = [];

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const rowLower = lines[i].toLowerCase();
    if (
      rowLower.includes("kontostand") ||
      rowLower.includes("anfangssaldo") ||
      rowLower.includes("endsaldo") ||
      rowLower.includes("alter saldo")
    ) {
      continue;
    }

    const cols = splitCsvLine(lines[i], delimiter);
    const bookingDate = parseGermanDate(cols[dateCol] ?? "");
    if (!bookingDate) continue;

    let amount: number | null = amountCol >= 0 ? parseGermanAmount(cols[amountCol] ?? "") : null;

    // Fall back to separate debit/credit columns (Soll = expense, Haben = income).
    if ((amount == null || amount === 0) && (sollCol >= 0 || habenCol >= 0)) {
      const soll = sollCol >= 0 ? Math.abs(parseGermanAmount(cols[sollCol] ?? "") ?? 0) : 0;
      const haben = habenCol >= 0 ? Math.abs(parseGermanAmount(cols[habenCol] ?? "") ?? 0) : 0;
      amount = haben - soll;
    }

    if (amount == null) continue;

    // Apply an explicit Soll/Haben ("S"/"H") sign column to an unsigned amount.
    if (signCol >= 0 && cols[signCol]) {
      const sign = cols[signCol].trim().toUpperCase().startsWith("S") ? -1 : 1;
      amount = sign * Math.abs(amount);
    }

    if (amount === 0) continue;

    results.push({
      bookingDate,
      valueDate: valueDateCol >= 0 ? parseGermanDate(cols[valueDateCol] ?? "") ?? undefined : undefined,
      amount,
      counterparty: counterpartyCol >= 0 ? cols[counterpartyCol] || undefined : undefined,
      reference: referenceCol >= 0 ? cols[referenceCol] || undefined : undefined,
    });
  }

  return results;
}

export function transactionHash(tx: ParsedTransaction): string {
  const key = [
    tx.bookingDate.toISOString().slice(0, 10),
    tx.amount.toFixed(2),
    tx.counterparty ?? "",
    tx.reference ?? "",
  ].join("|");
  return createHash("sha256").update(key).digest("hex");
}

export async function importTransactions(
  transactions: ParsedTransaction[],
  source: string = "CSV_IMPORT"
) {
  let imported = 0;
  let skipped = 0;

  for (const tx of transactions) {
    const hash = transactionHash(tx);
    const existing = await prisma.bankTransaction.findUnique({ where: { importHash: hash } });
    if (existing) {
      skipped++;
      continue;
    }

    await prisma.bankTransaction.create({
      data: {
        bookingDate: tx.bookingDate,
        valueDate: tx.valueDate,
        amount: tx.amount,
        counterparty: tx.counterparty,
        reference: tx.reference,
        externalId: tx.externalId,
        source,
        importHash: hash,
        reconciliationStatus: "UNMATCHED",
      },
    });
    imported++;
  }

  return { imported, skipped };
}
