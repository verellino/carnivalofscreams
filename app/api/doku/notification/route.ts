import { NextResponse } from "next/server";

import {
  callbackFields,
  clientIpFromHeaders,
  headerRecord,
  insertDokuCallback,
} from "@/lib/audit";
import { isPaidStatus, verifyNotificationSignature } from "@/lib/doku";
import { markReservationPaidSafe } from "@/lib/reservations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawText = await request.text();
  const ip = clientIpFromHeaders(request.headers);
  const userAgent = request.headers.get("user-agent");
  const storedHeaders = headerRecord(request.headers);
  const requestTarget = new URL(request.url).pathname;

  let payload: unknown = { raw: rawText };
  try {
    payload = JSON.parse(rawText) as unknown;
  } catch {
    payload = { raw: rawText, parse_error: true };
  }

  const fields = callbackFields(payload);
  const clientId = request.headers.get("client-id") ?? "";
  const requestId = request.headers.get("request-id") ?? "";
  const timestamp = request.headers.get("request-timestamp") ?? "";
  const signature = request.headers.get("signature") ?? "";
  let signatureValid: boolean | null = null;

  if (clientId && requestId && timestamp && signature) {
    try {
      signatureValid = verifyNotificationSignature({
        clientId,
        requestId,
        timestamp,
        requestTarget,
        rawBody: rawText,
        signature,
      });
    } catch {
      signatureValid = false;
    }
  }

  try {
    await insertDokuCallback({
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
    console.error("[doku] failed to persist notification", error);
    return NextResponse.json({ error: "Persist failed" }, { status: 500 });
  }

  if (!clientId || !requestId || !timestamp || !signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!signatureValid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  if (isPaidStatus(fields.transactionStatus ?? undefined) && fields.orderId) {
    await markReservationPaidSafe({
      orderId: fields.orderId,
      transactionStatus: fields.transactionStatus ?? "SUCCESS",
      channelId: fields.paymentType,
    });
  }

  return NextResponse.json({ ok: true });
}
