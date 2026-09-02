// Central IGBS organization + bank payment details.
// Included in every invoice, enrollment email, and further communication.

export const ORG = {
  name: "IGBS e.V. Hamburg",
  register: "VR 25109",
} as const;

export const BANK_DETAILS = {
  bankName: "FYRST BASE",
  accountHolder: "Julfiqur Haider",
  iban: "DE22 1001 0010 0013 1601 46",
  bic: "PBNKDEFFXXX",
  accountNumber: "404 8856775 00",
} as const;

/** Plain-text block for PDFs, CSVs, and text emails. */
export function bankDetailsText(): string {
  return [
    `${ORG.name} (${ORG.register})`,
    `Bank: ${BANK_DETAILS.bankName}`,
    `Kontoinhaber: ${BANK_DETAILS.accountHolder}`,
    `IBAN: ${BANK_DETAILS.iban}`,
    `BIC: ${BANK_DETAILS.bic}`,
  ].join("\n");
}

/** HTML block for email bodies. `reference` is an optional payment purpose line. */
export function bankDetailsHtml(reference?: string): string {
  const rows: [string, string][] = [
    ["Empfänger", `${BANK_DETAILS.accountHolder} (${ORG.name})`],
    ["Bank", BANK_DETAILS.bankName],
    ["IBAN", BANK_DETAILS.iban],
    ["BIC", BANK_DETAILS.bic],
  ];
  if (reference) rows.push(["Verwendungszweck", reference]);

  const cells = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#64748b;">${k}</td><td style="padding:4px 0;font-weight:600;color:#0f172a;">${v}</td></tr>`
    )
    .join("");

  return `
    <div style="margin-top:16px;padding:16px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;">
      <div style="font-weight:700;color:#0f172a;margin-bottom:8px;">Zahlungsinformationen</div>
      <table style="border-collapse:collapse;font-size:14px;">${cells}</table>
    </div>`;
}
