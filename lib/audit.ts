import { headers } from "next/headers";

import { getDb } from "./db";
import { readDokuStatus } from "./doku";

export type AuditEvent = {
  event: string;
  orderId?: string | null;
  method?: string | null;
  path?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  payload?: unknown;
};

export type DokuCallbackEvent = {
  source: "http_notification" | "checkout_js" | "window_redirect";
  event?: string | null;
  orderId?: string | null;
  transactionId?: string | null;
  transactionStatus?: string | null;
  statusCode?: string | null;
  paymentType?: string | null;
  signatureValid?: boolean | null;
  ip?: string | null;
  userAgent?: string | null;
  headers?: unknown;
  payload: unknown;
};

export function clientIpFromHeaders(headerList: Headers) {
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? null;
  return headerList.get("x-real-ip");
}

export function headerRecord(headerList: Headers) {
  const record: Record<string, string> = {};
  headerList.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "cookie" || lower === "authorization") return;
    record[lower] = value;
  });
  return record;
}

export async function requestMeta() {
  const headerList = await headers();
  return {
    ip: clientIpFromHeaders(headerList),
    userAgent: headerList.get("user-agent"),
  };
}

function toJson(value: unknown) {
  return JSON.parse(JSON.stringify(value ?? {})) as unknown;
}

export async function insertAuditLog(entry: AuditEvent) {
  const { error } = await getDb().from("audit_logs").insert({
    event: entry.event,
    order_id: entry.orderId ?? null,
    method: entry.method ?? null,
    path: entry.path ?? null,
    ip: entry.ip ?? null,
    user_agent: entry.userAgent ?? null,
    payload: toJson(entry.payload),
  });
  if (error) throw error;
}

export async function insertAuditLogSafe(entry: AuditEvent) {
  try {
    await insertAuditLog(entry);
  } catch (error) {
    console.error("[audit] failed to insert audit log", error);
  }
}

export async function insertDokuCallback(entry: DokuCallbackEvent) {
  const { error } = await getDb().from("doku_callbacks").insert({
    source: entry.source,
    event: entry.event ?? null,
    order_id: entry.orderId ?? null,
    transaction_id: entry.transactionId ?? null,
    transaction_status: entry.transactionStatus ?? null,
    status_code: entry.statusCode ?? null,
    payment_type: entry.paymentType ?? null,
    signature_valid: entry.signatureValid ?? null,
    ip: entry.ip ?? null,
    user_agent: entry.userAgent ?? null,
    headers: entry.headers == null ? null : toJson(entry.headers),
    payload: toJson(entry.payload),
  });
  if (error) throw error;
}

export async function insertDokuCallbackSafe(entry: DokuCallbackEvent) {
  try {
    await insertDokuCallback(entry);
  } catch (error) {
    console.error("[audit] failed to insert doku callback", error);
  }
}

function stringOrNull(value: unknown) {
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number") return String(value);
  return null;
}

export function callbackFields(payload: unknown) {
  const status = readDokuStatus(payload);
  if (!payload || typeof payload !== "object") {
    return {
      orderId: null as string | null,
      transactionId: null as string | null,
      transactionStatus: null as string | null,
      statusCode: null as string | null,
      paymentType: null as string | null,
    };
  }

  const record = payload as Record<string, unknown>;
  return {
    orderId:
      status.invoiceNumber ??
      stringOrNull(record.order_id) ??
      stringOrNull(record.invoice_number),
    transactionId:
      status.originalRequestId ?? stringOrNull(record.transaction_id),
    transactionStatus:
      status.transactionStatus ?? stringOrNull(record.transaction_status),
    statusCode: stringOrNull(record.status_code),
    paymentType: status.channelId ?? stringOrNull(record.payment_type),
  };
}
