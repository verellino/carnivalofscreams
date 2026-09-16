"use server";

import { headers } from "next/headers";

import { insertAuditLogSafe, requestMeta } from "@/lib/audit";
import {
  createCheckoutPayment,
  isDokuConfigured,
  newOrderId,
} from "@/lib/doku";
import { insertReservationSafe } from "@/lib/reservations";
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[0-9]{9,16}$/;

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
  const email = String(input.email ?? "").trim().toLowerCase();
  const phone = String(input.phone ?? "").replace(/[\s()-]/g, "");
  const nightId = asNightId(input.nightId);
  const packageId = asPackageId(input.packageId);
  const partySize = Number(input.partySize);
  const notes = String(input.notes ?? "").trim();

  if (name.length < 2 || name.length > 80) {
    return respond({ ok: false, error: "Please enter your full name." });
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
    return respond({ ok: false, error: "Please choose a table." });
  }

  const table = getTablePackage(packageId);
  if (!table) {
    return respond({ ok: false, error: "Please choose a table." });
  }
  if (
    !Number.isInteger(partySize) ||
    partySize < 1 ||
    partySize > table.seats
  ) {
    return respond({
      ok: false,
      error: `Party size must be between 1 and ${table.seats}.`,
    });
  }
  if (notes.length > 400) {
    return respond({ ok: false, error: "Notes are too long." });
  }

  const orderId = newOrderId(packageId, nightId);
  const origin = await requestOrigin();
  const reservation = {
    name,
    email,
    phone,
    nightId,
    packageId,
    partySize,
    notes: notes || undefined,
  };

  try {
    const checkout = await createCheckoutPayment(orderId, reservation, {
      callbackUrl: `${origin}/reserve/confirmed?order_id=${encodeURIComponent(orderId)}`,
      notificationUrl: `${origin}/api/doku/notification`,
    });

    await insertReservationSafe({
      orderId,
      ...reservation,
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
