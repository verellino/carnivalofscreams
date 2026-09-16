import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import {
  formatIdr,
  getNight,
  getTablePackage,
  type NightId,
  type TablePackageId,
} from "./tables";

export type ReservationPayload = {
  name: string;
  nik: string;
  email: string;
  phone: string;
  nightId: NightId;
  packageId: TablePackageId;
};

export type DokuCheckout = {
  tokenId: string;
  paymentUrl: string;
  expiredDate?: string;
};

export type DokuOrderStatus = {
  invoiceNumber?: string;
  amount?: number;
  orderStatus?: string;
  transactionStatus?: string;
  channelId?: string;
  transactionDate?: string;
  originalRequestId?: string;
};

/** Methods and display order on the Jokul page. API list wins over the dashboard selection. */
export const CHECKOUT_PAYMENT_METHOD_TYPES = [
  "VIRTUAL_ACCOUNT_BCA",
  "VIRTUAL_ACCOUNT_BANK_MANDIRI",
  "VIRTUAL_ACCOUNT_BANK_SYARIAH_MANDIRI",
  "VIRTUAL_ACCOUNT_DOKU",
  "VIRTUAL_ACCOUNT_BRI",
  "VIRTUAL_ACCOUNT_BNI",
  "VIRTUAL_ACCOUNT_BANK_PERMATA",
  "VIRTUAL_ACCOUNT_BANK_CIMB",
  "VIRTUAL_ACCOUNT_BANK_DANAMON",
  "ONLINE_TO_OFFLINE_ALFA",
  "CREDIT_CARD",
  "DIRECT_DEBIT_BRI",
  "EMONEY_SHOPEE_PAY",
  "EMONEY_OVO",
  "QRIS",
  "PEER_TO_PEER_AKULAKU",
  "PEER_TO_PEER_KREDIVO",
  "PEER_TO_PEER_INDODANA",
] as const;

export const CHECKOUT_PAYMENT_DUE_MINUTES = 60;
export const CHECKOUT_RECOVERY_MINUTES = 10_080;

type JsonRecord = Record<string, unknown>;

function getClientId() {
  const id = process.env.DOKU_CLIENT_ID;
  if (!id) {
    throw new Error("DOKU_CLIENT_ID is not configured");
  }
  return id;
}

function getSecretKey() {
  const key = process.env.DOKU_SECRET_KEY;
  if (!key) {
    throw new Error("DOKU_SECRET_KEY is not configured");
  }
  return key;
}

export function isDokuConfigured() {
  return Boolean(process.env.DOKU_CLIENT_ID && process.env.DOKU_SECRET_KEY);
}

export function isDokuProduction() {
  return process.env.DOKU_IS_PRODUCTION === "true";
}

export function getCheckoutJsUrl() {
  return isDokuProduction()
    ? "https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js"
    : "https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js";
}

function apiBase() {
  return isDokuProduction()
    ? "https://api.doku.com"
    : "https://api-sandbox.doku.com";
}

export function utcTimestamp() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function digestBody(body: string) {
  return createHash("sha256").update(body).digest("base64");
}

export function signatureComponent(parts: {
  clientId: string;
  requestId: string;
  timestamp: string;
  requestTarget: string;
  digest?: string;
}) {
  const lines = [
    `Client-Id:${parts.clientId}`,
    `Request-Id:${parts.requestId}`,
    `Request-Timestamp:${parts.timestamp}`,
    `Request-Target:${parts.requestTarget}`,
  ];
  if (parts.digest) {
    lines.push(`Digest:${parts.digest}`);
  }
  return lines.join("\n");
}

export function hmacSignature(component: string, secret = getSecretKey()) {
  const digest = createHmac("sha256", secret).update(component).digest("base64");
  return `HMACSHA256=${digest}`;
}

export function dokuRequestHeaders(options: {
  method: "GET" | "POST";
  requestTarget: string;
  body?: string;
  timestamp?: string;
}) {
  const clientId = getClientId();
  const requestId = crypto.randomUUID();
  const timestamp = options.timestamp ?? utcTimestamp();
  const digest =
    options.method === "POST" && options.body !== undefined
      ? digestBody(options.body)
      : undefined;
  const signature = hmacSignature(
    signatureComponent({
      clientId,
      requestId,
      timestamp,
      requestTarget: options.requestTarget,
      digest,
    }),
  );

  return {
    "Client-Id": clientId,
    "Request-Id": requestId,
    "Request-Timestamp": timestamp,
    Signature: signature,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export function verifyNotificationSignature(options: {
  clientId: string;
  requestId: string;
  timestamp: string;
  requestTarget: string;
  rawBody: string;
  signature: string;
}) {
  const expected = hmacSignature(
    signatureComponent({
      clientId: options.clientId,
      requestId: options.requestId,
      timestamp: options.timestamp,
      requestTarget: options.requestTarget,
      digest: digestBody(options.rawBody),
    }),
  );

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(options.signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? fullName;
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

export function newOrderId(packageId: string, nightId: string) {
  const night = nightId === "oct-31" ? "31" : "30";
  const pack = packageId.slice(0, 3).toUpperCase();
  const rand = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  return `COS-${night}-${pack}-${rand}`;
}

export function parseOrderId(orderId: string) {
  const match = /^COS-(30|31)-([A-Z]{3})-/.exec(orderId);
  if (!match) return undefined;

  const nightId: NightId = match[1] === "31" ? "oct-31" : "oct-30";
  const packCode = match[2];
  const packageId: TablePackageId | undefined =
    packCode === "STA"
      ? "standard"
      : packCode === "PRE"
        ? "premiere"
        : packCode === "VIP"
          ? "vip"
          : undefined;

  return { nightId, packageId };
}

export function toDokuPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return `62${digits.slice(1)}`;
  return `62${digits}`;
}

export function toWhatsAppPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("62")) return `0${digits.slice(2)}`;
  if (digits.startsWith("0")) return digits;
  return `0${digits}`;
}

export function isPaidStatus(status?: string) {
  return status === "SUCCESS";
}

export function isPendingStatus(status?: string, orderStatus?: string) {
  if (status === "PENDING" || status === "REDIRECT" || status === "TIMEOUT") {
    return true;
  }
  if (!status && orderStatus === "ORDER_GENERATED") return true;
  return false;
}

export function isFailedStatus(status?: string, orderStatus?: string) {
  return (
    status === "FAILED" ||
    status === "EXPIRED" ||
    status === "REFUNDED" ||
    orderStatus === "ORDER_EXPIRED"
  );
}

function asRecord(value: unknown): JsonRecord | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as JsonRecord;
}

function stringField(record: JsonRecord | undefined, key: string) {
  const value = record?.[key];
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

function numberField(record: JsonRecord | undefined, key: string) {
  const value = record?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function errorMessage(data: unknown, fallback: string) {
  const record = asRecord(data);
  const error = asRecord(record?.error);
  if (typeof error?.message === "string" && error.message) return error.message;
  const message = record?.message;
  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === "string").join(", ") || fallback;
  }
  if (typeof message === "string" && message) return message;
  return fallback;
}

export async function createCheckoutPayment(
  orderId: string,
  reservation: ReservationPayload,
  urls: { callbackUrl: string; notificationUrl: string },
): Promise<DokuCheckout> {
  const table = getTablePackage(reservation.packageId);
  const night = getNight(reservation.nightId);
  if (!table || !night) {
    throw new Error("Unknown table or night");
  }

  const { firstName, lastName } = splitName(reservation.name);
  const requestTarget = "/checkout/v1/payment";
  const body = JSON.stringify({
    order: {
      amount: table.priceIdr,
      invoice_number: orderId,
      currency: "IDR",
      callback_url: urls.callbackUrl,
      callback_url_result: urls.callbackUrl,
      language: "EN",
      auto_redirect: true,
      recover_abandoned_cart: true,
      expired_recovered_cart: CHECKOUT_RECOVERY_MINUTES,
      line_items: [
        {
          id: table.id,
          name: `${table.name} ${night.short}`,
          quantity: 1,
          price: table.priceIdr,
        },
      ],
    },
    payment: {
      payment_due_date: CHECKOUT_PAYMENT_DUE_MINUTES,
      payment_method_types: [...CHECKOUT_PAYMENT_METHOD_TYPES],
    },
    customer: {
      name: firstName,
      last_name: lastName.slice(0, 16),
      email: reservation.email,
      phone: toDokuPhone(reservation.phone),
      country: "ID",
    },
    collect_customer: {
      name: true,
      email: true,
      phone: true,
    },
    callbacks: {
      url: urls.callbackUrl,
    },
    additional_info: {
      override_notification_url: urls.notificationUrl,
    },
  });

  const response = await fetch(`${apiBase()}${requestTarget}`, {
    method: "POST",
    headers: dokuRequestHeaders({
      method: "POST",
      requestTarget,
      body,
    }),
    body,
  });

  const data = (await response.json()) as unknown;
  const payload = asRecord(data);
  const inner = asRecord(payload?.response);
  const payment = asRecord(inner?.payment);
  const paymentUrl = stringField(payment, "url");
  const tokenId = stringField(payment, "token_id");

  if (!response.ok || !paymentUrl || !tokenId) {
    throw new Error(errorMessage(data, "Could not start payment"));
  }

  return {
    tokenId,
    paymentUrl,
    expiredDate: stringField(payment, "expired_date"),
  };
}

export function readDokuStatus(payload: unknown): DokuOrderStatus {
  const record = asRecord(payload);
  const order = asRecord(record?.order) ?? record;
  const transaction = asRecord(record?.transaction);
  const channel = asRecord(record?.channel);

  return {
    invoiceNumber: stringField(order, "invoice_number"),
    amount: numberField(order, "amount"),
    orderStatus: stringField(order, "status"),
    transactionStatus: stringField(transaction, "status"),
    channelId: stringField(channel, "id"),
    transactionDate: stringField(transaction, "date"),
    originalRequestId: stringField(transaction, "original_request_id"),
  };
}

export async function getOrderStatus(orderId: string): Promise<DokuOrderStatus> {
  const requestTarget = `/orders/v1/status/${encodeURIComponent(orderId)}`;
  const response = await fetch(`${apiBase()}${requestTarget}`, {
    method: "GET",
    headers: dokuRequestHeaders({
      method: "GET",
      requestTarget,
    }),
    cache: "no-store",
  });

  const data = (await response.json()) as unknown;
  if (!response.ok) {
    throw new Error(errorMessage(data, "Could not check payment"));
  }

  return readDokuStatus(data);
}

export function summarizeReservation(options: {
  orderId: string;
  amount?: number;
  nightId?: string;
  packageId?: string;
  partySize?: number;
}) {
  const parsed = parseOrderId(options.orderId);
  const table = getTablePackage(options.packageId ?? parsed?.packageId ?? "");
  const night = getNight(options.nightId ?? parsed?.nightId ?? "");

  return {
    table,
    night,
    partySize: options.partySize,
    amountLabel:
      options.amount != null
        ? formatIdr(options.amount)
        : table
          ? formatIdr(table.priceIdr)
          : undefined,
  };
}
