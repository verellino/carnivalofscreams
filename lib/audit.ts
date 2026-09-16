import { headers } from "next/headers";

import postgres from "postgres";

import { getSql } from "./db";
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

function toJson(value: unknown): postgres.JSONValue {
  return JSON.parse(JSON.stringify(value ?? {})) as postgres.JSONValue;
}

export async function insertAuditLog(entry: AuditEvent) {
  const sql = getSql();
  await sql`
    insert into public.audit_logs (
      event, order_id, method, path, ip, user_agent, payload
    ) values (
      ${entry.event},
      ${entry.orderId ?? null},
      ${entry.method ?? null},
      ${entry.path ?? null},
      ${entry.ip ?? null},
      ${entry.userAgent ?? null},
      ${sql.json(toJson(entry.payload))}
    )
  `;
}

export async function insertAuditLogSafe(entry: AuditEvent) {
  try {
    await insertAuditLog(entry);
  } catch (error) {
    console.error("[audit] failed to insert audit log", error);
  }
}

export async function insertDokuCallback(entry: DokuCallbackEvent) {
  const sql = getSql();
  await sql`
    insert into public.doku_callbacks (
      source,
      event,
      order_id,
      transaction_id,
      transaction_status,
      status_code,
      payment_type,
      signature_valid,
      ip,
      user_agent,
      headers,
      payload
    ) values (
      ${entry.source},
      ${entry.event ?? null},
      ${entry.orderId ?? null},
      ${entry.transactionId ?? null},
      ${entry.transactionStatus ?? null},
      ${entry.statusCode ?? null},
      ${entry.paymentType ?? null},
      ${entry.signatureValid ?? null},
      ${entry.ip ?? null},
      ${entry.userAgent ?? null},
      ${entry.headers == null ? null : sql.json(toJson(entry.headers))},
      ${sql.json(toJson(entry.payload))}
    )
  `;
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
