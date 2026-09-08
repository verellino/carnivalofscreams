import { createHash, timingSafeEqual } from "node:crypto";

import {
  formatIdr,
  getNight,
  getTablePackage,
  type NightId,
  type TablePackageId,
} from "./tables";

export type ReservationPayload = {
  name: string;
  email: string;
  phone: string;
  nightId: NightId;
  packageId: TablePackageId;
  partySize: number;
  notes?: string;
};

export type MidtransStatus = {
  order_id?: string;
  status_code?: string;
  status_message?: string;
  transaction_status?: string;
  fraud_status?: string;
  payment_type?: string;
  gross_amount?: string;
  transaction_time?: string;
  custom_field1?: string;
  custom_field2?: string;
  custom_field3?: string;
};

type SnapTransaction = {
  token: string;
  redirect_url: string;
};

function getServerKey() {
  const key = process.env.MIDTRANS_SERVER_KEY;
  if (!key) {
    throw new Error("MIDTRANS_SERVER_KEY is not configured");
  }
  return key;
}

export function isMidtransProduction() {
  const flag = process.env.MIDTRANS_IS_PRODUCTION;
  if (flag === "true") return true;
  if (flag === "false") return false;
  const key = process.env.MIDTRANS_SERVER_KEY ?? "";
  return key.startsWith("Mid-server-");
}

export function getMidtransClientKey() {
  return (
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ??
    process.env.MIDTRANS_CLIENT_KEY ??
    ""
  );
}

export function getSnapJsUrl() {
  return isMidtransProduction()
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

function basicAuthHeader() {
  return `Basic ${Buffer.from(`${getServerKey()}:`).toString("base64")}`;
}

function snapApiBase() {
  return isMidtransProduction()
    ? "https://app.midtrans.com"
    : "https://app.sandbox.midtrans.com";
}

function coreApiBase() {
  return isMidtransProduction()
    ? "https://api.midtrans.com"
    : "https://api.sandbox.midtrans.com";
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

export function isPaidStatus(
  status?: string,
  fraud?: string,
): boolean {
  if (fraud === "deny") return false;
  return status === "capture" || status === "settlement";
}

export function isPendingStatus(status?: string) {
  return status === "pending" || status === "authorize";
}

export function verifyNotificationSignature(notification: {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
}) {
  const expected = createHash("sha512")
    .update(
      notification.order_id +
        notification.status_code +
        notification.gross_amount +
        getServerKey(),
    )
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(notification.signature_key, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function createSnapTransaction(
  orderId: string,
  reservation: ReservationPayload,
  finishUrl: string,
): Promise<SnapTransaction> {
  const table = getTablePackage(reservation.packageId);
  const night = getNight(reservation.nightId);
  if (!table || !night) {
    throw new Error("Unknown table or night");
  }

  const { firstName, lastName } = splitName(reservation.name);

  const response = await fetch(`${snapApiBase()}/snap/v1/transactions`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: basicAuthHeader(),
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: orderId,
        gross_amount: table.priceIdr,
      },
      credit_card: { secure: true },
      item_details: [
        {
          id: table.id,
          price: table.priceIdr,
          quantity: 1,
          name: `${table.name} · ${night.short}`,
        },
      ],
      customer_details: {
        first_name: firstName,
        last_name: lastName,
        email: reservation.email,
        phone: reservation.phone,
      },
      custom_field1: reservation.packageId,
      custom_field2: reservation.nightId,
      custom_field3: String(reservation.partySize),
      callbacks: {
        finish: finishUrl,
      },
    }),
  });

  const data = (await response.json()) as SnapTransaction & {
    error_messages?: string[];
  };

  if (!response.ok || !data.token) {
    const message = data.error_messages?.join(", ") ?? "Could not start payment";
    throw new Error(message);
  }

  return { token: data.token, redirect_url: data.redirect_url };
}

export async function getTransactionStatus(
  orderId: string,
): Promise<MidtransStatus> {
  const response = await fetch(
    `${coreApiBase()}/v2/${encodeURIComponent(orderId)}/status`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: basicAuthHeader(),
      },
      cache: "no-store",
    },
  );

  return (await response.json()) as MidtransStatus;
}

export function summarizeReservation(status: MidtransStatus) {
  const table = status.custom_field1
    ? getTablePackage(status.custom_field1)
    : undefined;
  const night = status.custom_field2
    ? getNight(status.custom_field2)
    : undefined;

  return {
    table,
    night,
    partySize: status.custom_field3
      ? Number.parseInt(status.custom_field3, 10)
      : undefined,
    amountLabel: status.gross_amount
      ? formatIdr(Number.parseFloat(status.gross_amount))
      : table
        ? formatIdr(table.priceIdr)
        : undefined,
  };
}
