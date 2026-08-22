/**
 * Kobara payment gateway client (server-only).
 * Official documentation: https://kobara.app/docs
 *  - Base URL: https://api.kobara.app
 *  - Create payment: POST /api/v1/payments (Bearer secret key + Idempotency-Key)
 *  - Webhook headers: Kobara-Signature (t=...,v1=hmac-sha256), Kobara-Event, Kobara-Timestamp
 * Secret keys are read from process.env inside functions — never at module scope,
 * and never exposed to the browser.
 */
import { createHmac, timingSafeEqual } from "crypto";

export const KOBARA_BASE_URL = "https://api.kobara.app";

export type KobaraProvider = "kobara" | "moncash" | "natcash";

export interface KobaraPayment {
  id: string;
  kobara_reference?: string | null;
  amount: number;
  currency: string;
  status: string;
  provider?: string | null;
  payment_method?: string | null;
  checkout_url?: string | null;
  paid_at?: string | null;
  metadata?: Record<string, unknown> | null;
  MonCash_transaction_id?: string | null;
  transaction_id?: string | null;
}

/**
 * API key used to authenticate against Kobara.
 * Prefers the secret key, falls back to the public/publishable key when the
 * project is configured with one only.
 */
function apiKey(): string {
  const key = process.env["KOBARA_SECRET_KEY"] || process.env["KOBARA_PUBLIC_KEY"];
  if (!key) {
    throw new Error(
      "Paiements indisponibles : aucune clé Kobara (KOBARA_PUBLIC_KEY ou KOBARA_SECRET_KEY) n'est configurée.",
    );
  }
  return key;
}

/** Kobara wraps some responses in { status, data }. Normalise both shapes. */
function unwrap(json: unknown): KobaraPayment {
  const obj = json as Record<string, unknown>;
  if (obj && typeof obj === "object" && "data" in obj && obj["data"] && typeof obj["data"] === "object") {
    return obj["data"] as KobaraPayment;
  }
  return obj as unknown as KobaraPayment;
}

export interface CreatePaymentInput {
  amount: number;
  description: string;
  provider: KobaraProvider;
  customer: { name?: string; email?: string; phone?: string };
  metadata: Record<string, string>;
  success_url: string;
  error_url: string;
  webhook_url: string;
  idempotencyKey: string;
}

export async function createKobaraPayment(input: CreatePaymentInput): Promise<KobaraPayment> {
  const res = await fetch(`${KOBARA_BASE_URL}/api/v1/payments`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey()}`,
      "Content-Type": "application/json",
      "Idempotency-Key": input.idempotencyKey,
    },
    body: JSON.stringify({
      amount: input.amount,
      currency: "HTG",
      provider: input.provider,
      description: input.description,
      customer: input.customer,
      metadata: input.metadata,
      success_url: input.success_url,
      error_url: input.error_url,
      webhook_url: input.webhook_url,
    }),
  });

  const text = await res.text();
  if (!res.ok) {
    console.error("Kobara create payment failed", res.status, text.slice(0, 500));
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        "Paiement refusé par Kobara : la clé KOBARA_SECRET_KEY est invalide ou expirée. Mets à jour la clé secrète dans les paramètres du projet.",
      );
    }
    throw new Error("Le paiement n'a pas pu être initialisé auprès de Kobara.");
  }
  const payment = unwrap(JSON.parse(text));
  if (!payment?.id || !payment.checkout_url) {
    throw new Error("Réponse Kobara inattendue : aucune URL de paiement reçue.");
  }
  return payment;
}

/** Reads the current state of a payment from Kobara (server-side verification). */
export async function fetchKobaraPayment(paymentId: string): Promise<KobaraPayment | null> {
  const res = await fetch(`${KOBARA_BASE_URL}/api/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: `Bearer ${secretKey()}`, Accept: "application/json" },
  });
  if (!res.ok) {
    console.error("Kobara fetch payment failed", res.status);
    return null;
  }
  return unwrap(await res.json());
}

/** Maps a Kobara status to our internal payment status. */
export function mapKobaraStatus(status: string | null | undefined) {
  switch ((status ?? "").toLowerCase()) {
    case "succeeded":
    case "success":
    case "paid":
    case "completed":
      return "paid" as const;
    case "failed":
    case "error":
      return "failed" as const;
    case "expired":
      return "expired" as const;
    case "cancelled":
    case "canceled":
      return "cancelled" as const;
    default:
      return "pending" as const;
  }
}

export function normalizeMethod(provider: string | null | undefined) {
  const p = (provider ?? "").toLowerCase();
  if (p === "moncash") return "moncash" as const;
  if (p === "natcash") return "natcash" as const;
  return "kobara" as const;
}

/**
 * Verifies a Kobara webhook signature over the RAW request body.
 * Accepts both `v1=<hex>` (with optional `t=<unix>`) and bare hex signatures.
 */
export function verifyKobaraSignature(
  rawBody: string,
  signatureHeader: string | null,
  timestampHeader: string | null,
  toleranceSeconds = 300,
): boolean {
  const secret = process.env["KOBARA_WEBHOOK_SECRET"];
  if (!secret || !signatureHeader) return false;

  const parts = signatureHeader.split(",").map((p) => p.trim());
  let timestamp = timestampHeader;
  let provided: string | null = null;
  for (const part of parts) {
    if (part.startsWith("t=")) timestamp = part.slice(2);
    else if (part.startsWith("v1=")) provided = part.slice(3);
    else if (!part.includes("=")) provided = part;
  }
  if (!provided) return false;

  if (timestamp) {
    const ts = Number(timestamp);
    const seconds = ts > 1e12 ? ts / 1000 : ts;
    if (!Number.isFinite(seconds)) return false;
    if (Math.abs(Date.now() / 1000 - seconds) > toleranceSeconds) return false;
  }

  const candidates = [rawBody];
  if (timestamp) candidates.push(`${timestamp}.${rawBody}`);

  for (const payload of candidates) {
    const expected = createHmac("sha256", secret).update(payload).digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(provided.toLowerCase());
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}
