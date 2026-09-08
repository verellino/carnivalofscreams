import { NextResponse } from "next/server";

import {
  callbackFields,
  clientIpFromHeaders,
  headerRecord,
  insertMidtransCallback,
} from "@/lib/audit";
import {
  getTransactionStatus,
  verifyNotificationSignature,
} from "@/lib/midtrans";

export const runtime = "nodejs";

type NotificationBody = {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
};

function asNotification(payload: unknown): NotificationBody | null {
  if (!payload || typeof payload !== "object") return null;
  return payload as NotificationBody;
}

export async function POST(request: Request) {
  const rawText = await request.text();
  const ip = clientIpFromHeaders(request.headers);
  const userAgent = request.headers.get("user-agent");
  const storedHeaders = headerRecord(request.headers);

  let payload: unknown = { raw: rawText };
  try {
    payload = JSON.parse(rawText) as unknown;
  } catch {
    payload = { raw: rawText, parse_error: true };
  }

  const fields = callbackFields(payload);
  const notification = asNotification(payload);
  let signatureValid: boolean | null = null;

  if (
    notification?.order_id &&
    notification.status_code &&
    notification.gross_amount &&
    notification.signature_key
  ) {
    try {
      signatureValid = verifyNotificationSignature({
        order_id: notification.order_id,
        status_code: notification.status_code,
        gross_amount: notification.gross_amount,
        signature_key: notification.signature_key,
      });
    } catch {
      signatureValid = false;
    }
  }

  try {
    await insertMidtransCallback({
      source: "http_notification",
      event: "notification",
      orderId: fields.orderId,
      transactionId: fields.transactionId,
      transactionStatus: fields.transactionStatus,
      statusCode: fields.statusCode,
      paymentType: fields.paymentType,
      signatureValid,
      ip,
      userAgent,
      headers: storedHeaders,
      payload,
    });
  } catch (error) {
    console.error("[midtrans] failed to persist notification", error);
    return NextResponse.json({ error: "Persist failed" }, { status: 500 });
  }

  if (!notification?.order_id || !notification.status_code || !notification.gross_amount || !notification.signature_key) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  await getTransactionStatus(notification.order_id);

  return NextResponse.json({ ok: true });
}
