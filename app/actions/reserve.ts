"use server";

import { headers } from "next/headers";

import { insertAuditLogSafe, requestMeta } from "@/lib/audit";
import {
  createCheckoutPayment,
  isDokuConfigured,
  newOrderId,
} from "@/lib/doku";
import { sendReservationInvoice } from "@/lib/invoice";
import {
  claimReservationSeat,
  getReservationSafe,
  insertReservationSafe,
} from "@/lib/reservations";
import { getSeat } from "@/lib/seats";
import { getSiteUrl } from "@/lib/site";
import {
  getNight,
  getTablePackage,
  type NightId,
  type TablePackageId,
} from "@/lib/tables";

export type CreateReservationResult =
  | { ok: true; paymentUrl: string; orderId: string }
  | { ok: false; error: string };

export type SelectSeatResult =
  | { ok: true }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{9,16}$/;
const NIK_RE = /^\d{16}$/;
const ORDER_ID_RE = /^COS-[A-Za-z0-9._~-]{1,46}$/;

async function requestOrigin() {
  const headerList = await headers();
  const host =
    headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  if (host) return `${proto}://${host}`;
  return getSiteUrl();
}

function asNightId(value: unknown): NightId | undefined {
  if (value === "oct-30" || value === "oct-31") return value;
  return undefined;
}

function asPackageId(value: unknown): TablePackageId | undefined {
  if (value === "standard" || value === "premiere" || value === "vip") {
    return value;
  }
  return undefined;
}

export async function createReservation(
  raw: unknown,
): Promise<CreateReservationResult> {
  const meta = await requestMeta();

  await insertAuditLogSafe({
    event: "reservation.create.request",
    method: "POST",
    path: "/reserve",
    ip: meta.ip,
    userAgent: meta.userAgent,
    payload: raw ?? {},
  });

  const respond = async (
    result: CreateReservationResult,
    orderId?: string,
  ) => {
    await insertAuditLogSafe({
      event: result.ok
        ? "reservation.create.response"
        : "reservation.create.error",
      orderId,
      method: "POST",
      path: "/reserve",
      ip: meta.ip,
      userAgent: meta.userAgent,
      payload: result,
    });
    return result;
  };

  if (!isDokuConfigured()) {
    return respond({ ok: false, error: "Payment is not configured yet." });
  }

  const input = raw as Record<string, unknown>;
  const name = String(input.name ?? "").trim();
  const nik = String(input.nik ?? "").replace(/\D/g, "");
  const email = String(input.email ?? "").trim().toLowerCase();
  const phone = String(input.phone ?? "").replace(/[\s()-]/g, "");
  const nightId = asNightId(input.nightId);
  const packageId = asPackageId(input.packageId);

  if (name.length < 2 || name.length > 80) {
    return respond({ ok: false, error: "Please enter your full name." });
  }
  if (!NIK_RE.test(nik)) {
    return respond({ ok: false, error: "Please enter a 16-digit NIK." });
  }
  if (!EMAIL_RE.test(email)) {
    return respond({ ok: false, error: "Please enter a valid email." });
  }
  if (!PHONE_RE.test(phone)) {
    return respond({ ok: false, error: "Please enter a valid phone number." });
  }
  if (!nightId || !getNight(nightId)) {
    return respond({ ok: false, error: "Please choose a night." });
  }
  if (!packageId) {
    return respond({ ok: false, error: "Please choose a sofa category." });
  }

  const table = getTablePackage(packageId);
  if (!table) {
    return respond({ ok: false, error: "Please choose a sofa category." });
  }

  const orderId = newOrderId(packageId, nightId);
  const origin = await requestOrigin();
  const reservation = {
    name,
    nik,
    email,
    phone,
    nightId,
    packageId,
  };

  try {
    const checkout = await createCheckoutPayment(orderId, reservation, {
      callbackUrl: `${origin}/reserve/confirmed?order_id=${encodeURIComponent(orderId)}`,
      notificationUrl: `${origin}/api/doku/notification`,
    });

    await insertReservationSafe({
      orderId,
      ...reservation,
      partySize: table.seats,
      amountIdr: table.priceIdr,
      paymentUrl: checkout.paymentUrl,
      paymentToken: checkout.tokenId,
    });

    return respond(
      { ok: true, paymentUrl: checkout.paymentUrl, orderId },
      orderId,
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not start payment.";
    return respond({ ok: false, error: message }, orderId);
  }
}

export async function selectReservationSeat(
  raw: unknown,
): Promise<SelectSeatResult> {
  const meta = await requestMeta();
  const input = raw as Record<string, unknown>;
  const orderId = String(input.orderId ?? "").trim();
  const seatId = String(input.seatId ?? "").trim();

  await insertAuditLogSafe({
    event: "reservation.seat.request",
    orderId,
    method: "POST",
    path: "/reserve/confirmed",
    ip: meta.ip,
    userAgent: meta.userAgent,
    payload: { seatId },
  });

  if (!ORDER_ID_RE.test(orderId) || !getSeat(seatId)) {
    return { ok: false, error: "Please pick a sofa." };
  }

  try {
    const claimed = await claimReservationSeat(orderId, seatId);
    if (!claimed) {
      return { ok: false, error: "That sofa was just taken. Pick another." };
    }
    await sendReservationInvoice(claimed, "/reserve/confirmed");
    await insertAuditLogSafe({
      event: "reservation.seat.response",
      orderId,
      method: "POST",
      path: "/reserve/confirmed",
      ip: meta.ip,
      userAgent: meta.userAgent,
      payload: { ok: true, seatId },
    });
    return { ok: true };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not hold that sofa.";
    const latest = await getReservationSafe(orderId);
    await insertAuditLogSafe({
      event: "reservation.seat.error",
      orderId,
      method: "POST",
      path: "/reserve/confirmed",
      ip: meta.ip,
      userAgent: meta.userAgent,
      payload: { error: message, seatId },
    });
    if (latest?.seatId === seatId) return { ok: true };
    return { ok: false, error: message };
  }
}
