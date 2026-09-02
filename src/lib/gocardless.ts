const GOCARDLESS_BASE = "https://bankaccountdata.gocardless.com/api/v2";

function getCredentials() {
  const secretId = process.env.GOCARDLESS_SECRET_ID;
  const secretKey = process.env.GOCARDLESS_SECRET_KEY;
  if (!secretId || !secretKey) {
    throw new Error("GoCardless credentials not configured");
  }
  return { secretId, secretKey };
}

async function gcFetch(path: string, options: RequestInit = {}) {
  const { secretId, secretKey } = getCredentials();
  const token = Buffer.from(`${secretId}:${secretKey}`).toString("base64");

  const res = await fetch(`${GOCARDLESS_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Basic ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GoCardless API error ${res.status}: ${text}`);
  }

  return res.json();
}

export async function getAccessToken(): Promise<string> {
  const data = await gcFetch("/token/new/", { method: "POST" });
  return data.access;
}

export async function getInstitutions(country = "DE") {
  const token = await getAccessToken();
  const res = await fetch(`${GOCARDLESS_BASE}/institutions/?country=${country}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to fetch institutions");
  return res.json();
}

export async function createRequisition(institutionId: string, redirectUrl: string) {
  const token = await getAccessToken();
  const res = await fetch(`${GOCARDLESS_BASE}/requisitions/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      redirect: redirectUrl,
      institution_id: institutionId,
      reference: `igbs-${Date.now()}`,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create requisition: ${text}`);
  }
  return res.json();
}

export async function getRequisition(requisitionId: string) {
  const token = await getAccessToken();
  const res = await fetch(`${GOCARDLESS_BASE}/requisitions/${requisitionId}/`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Failed to get requisition");
  return res.json();
}

export async function getAccountTransactions(accountId: string, dateFrom?: string) {
  const token = await getAccessToken();
  const params = new URLSearchParams();
  if (dateFrom) params.set("date_from", dateFrom);

  const res = await fetch(
    `${GOCARDLESS_BASE}/accounts/${accountId}/transactions/?${params.toString()}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch transactions: ${text}`);
  }
  return res.json();
}

export interface GoCardlessTransaction {
  transactionId?: string;
  bookingDate: string;
  valueDate?: string;
  transactionAmount: { amount: string; currency: string };
  remittanceInformationUnstructured?: string;
  debtorName?: string;
  creditorName?: string;
}

export function mapGoCardlessTransactions(
  data: { transactions?: { booked?: GoCardlessTransaction[]; pending?: GoCardlessTransaction[] } }
) {
  const booked = data.transactions?.booked ?? [];
  return booked.map((tx) => ({
    bookingDate: new Date(tx.bookingDate),
    valueDate: tx.valueDate ? new Date(tx.valueDate) : undefined,
    amount: parseFloat(tx.transactionAmount.amount),
    counterparty: tx.debtorName || tx.creditorName,
    reference: tx.remittanceInformationUnstructured,
    externalId: tx.transactionId,
  }));
}
