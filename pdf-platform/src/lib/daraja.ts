// M-Pesa Daraja client — production only. There is deliberately no sandbox
// fallback or env-var override for the base URL: this app talks to real
// M-Pesa. See docs/daraja-setup.md for what credentials are required.
const DARAJA_BASE_URL = "https://api.safaricom.co.ke";

let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.token;

  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) {
    throw new Error("MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET are not configured");
  }

  const basicAuth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const res = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${basicAuth}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Daraja OAuth failed: ${res.status} ${await res.text()}`);
  }
  const data = await res.json();
  tokenCache = { token: data.access_token, expiresAt: now + Number(data.expires_in ?? 3599) * 1000 };
  return tokenCache.token;
}

// Safaricom expects the STK password Timestamp in Africa/Nairobi (EAT,
// UTC+3) local time, formatted YYYYMMDDHHmmss. Vercel functions run in UTC,
// so raw local Date components would desync the password hash from what
// Safaricom regenerates server-side to verify it — compute the offset
// explicitly instead of relying on server timezone.
function getDarajaTimestamp(): string {
  const nairobi = new Date(Date.now() + 3 * 60 * 60 * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${nairobi.getUTCFullYear()}${pad(nairobi.getUTCMonth() + 1)}${pad(nairobi.getUTCDate())}` +
    `${pad(nairobi.getUTCHours())}${pad(nairobi.getUTCMinutes())}${pad(nairobi.getUTCSeconds())}`
  );
}

function getPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

function requireCreds() {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) {
    throw new Error("MPESA_SHORTCODE / MPESA_PASSKEY are not configured");
  }
  return { shortcode, passkey };
}

// Normalizes Kenyan MSISDNs to 2547XXXXXXXX / 2541XXXXXXXX (Safaricom's
// number ranges only — M-Pesa STK push only works against Safaricom lines).
// Accepts "0712345678", "254712345678", "+254712345678", and bare
// "712345678", plus the newer 01-prefixed range. Returns null if the input
// doesn't look like a valid Safaricom number.
export function normalizePhoneNumber(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  let normalized: string | null = null;
  if (/^0[71]\d{8}$/.test(digits)) normalized = "254" + digits.slice(1);
  else if (/^254[71]\d{8}$/.test(digits)) normalized = digits;
  else if (/^[71]\d{8}$/.test(digits)) normalized = "254" + digits;
  return normalized && /^254[71]\d{8}$/.test(normalized) ? normalized : null;
}

export interface StkPushParams {
  phoneNumber: string; // already normalized, 2547XXXXXXXX
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  customerMessage: string;
}

export async function initiateStkPush(params: StkPushParams): Promise<StkPushResult> {
  const { shortcode, passkey } = requireCreds();
  const token = await getAccessToken();
  const timestamp = getDarajaTimestamp();
  const password = getPassword(shortcode, passkey, timestamp);

  const res = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      // Till (Buy Goods), not CustomerPayBillOnline — using PayBill's
      // transaction type against a Till number is a common integration
      // bug that causes the STK push to fail or post to the wrong account.
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: Math.round(params.amount),
      PartyA: params.phoneNumber,
      PartyB: shortcode,
      PhoneNumber: params.phoneNumber,
      CallBackURL: params.callbackUrl,
      AccountReference: params.accountReference.slice(0, 12),
      TransactionDesc: params.transactionDesc.slice(0, 13),
    }),
  });

  const data = await res.json();
  if (!res.ok || data.ResponseCode !== "0") {
    throw new Error(data.errorMessage || data.ResponseDescription || `Daraja STK push failed (${res.status})`);
  }

  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    customerMessage: data.CustomerMessage,
  };
}

export interface StkQueryResult {
  resultCode: number | null; // null = Safaricom says the prompt is still pending
  resultDesc: string;
}

export async function queryStkPush(checkoutRequestId: string): Promise<StkQueryResult> {
  const { shortcode, passkey } = requireCreds();
  const token = await getAccessToken();
  const timestamp = getDarajaTimestamp();
  const password = getPassword(shortcode, passkey, timestamp);

  const res = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data = await res.json();
  // While the STK prompt is still awaiting user action, Safaricom returns a
  // top-level errorCode (e.g. 500.001.1001) with no ResultCode — treat any
  // response missing a numeric ResultCode as "still pending" rather than
  // throwing, so an unexpected shape never crashes reconciliation.
  if (data.errorCode || typeof data.ResultCode === "undefined") {
    return { resultCode: null, resultDesc: data.errorMessage ?? "Still processing" };
  }
  return { resultCode: Number(data.ResultCode), resultDesc: data.ResultDesc ?? "" };
}
