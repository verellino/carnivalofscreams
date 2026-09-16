import { NextResponse } from "next/server";

import {
  callbackFields,
  clientIpFromHeaders,
  headerRecord,
  insertDokuCallback,
} from "@/lib/audit";
import {
  isExpiredStatus,
  isPaidStatus,
  markNotificationSeen,
  notificationAck,
  readNotificationHeaders,
  readDokuStatus,
  verifyIncomingNotification,
} from "@/lib/doku";
import { sendReservationInvoice } from "@/lib/invoice";
import {
  expireReservationHoldSafe,
  markReservationPaidSafe,
} from "@/lib/reservations";

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
  const headers = readNotificationHeaders(request.headers);
  const check = headers
    ? verifyIncomingNotification({
        headers,
        requestTarget,
        rawBody: rawText,
      })
    : undefined;
  const signatureValid = check?.ok === true ? true : check ? false : null;

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

  if (!headers) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  if (!check?.ok) {
    return NextResponse.json(
      { error: check?.error ?? "Invalid signature" },
      { status: 400 },
    );
  }

  if (check.replay) {
    return NextResponse.json(notificationAck());
  }

  const dokuStatus = readDokuStatus(payload);

  if (isPaidStatus(dokuStatus.transactionStatus) && fields.orderId) {
    const reservation = await markReservationPaidSafe({
      orderId: fields.orderId,
      transactionStatus: dokuStatus.transactionStatus ?? "SUCCESS",
      channelId: dokuStatus.channelId ?? fields.paymentType,
    });
    await sendReservationInvoice(reservation, "/api/doku/notification");
  } else if (
    isExpiredStatus(dokuStatus.transactionStatus, dokuStatus.orderStatus) &&
    fields.orderId
  ) {
    await expireReservationHoldSafe(
      fields.orderId,
      dokuStatus.transactionStatus ?? dokuStatus.orderStatus ?? "EXPIRED",
    );
  }

  markNotificationSeen(headers.requestId);
  return NextResponse.json(notificationAck());
}
