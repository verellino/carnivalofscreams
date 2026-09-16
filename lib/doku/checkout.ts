import { getSeat } from "../seats";
import { getNight, getTablePackage } from "../tables";
import { DokuValidationError } from "./errors";
import { dokuFetch } from "./http";
import { asRecord, stringField } from "./json";
import {
  CHECKOUT_CANCEL_PATH,
  CHECKOUT_PAYMENT_DUE_MINUTES,
  CHECKOUT_PAYMENT_METHOD_TYPES,
  CHECKOUT_PAYMENT_PATH,
  type DokuCancelRequest,
  type DokuCheckout,
  type DokuCheckoutRequest,
  type ReservationPayload,
} from "./types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^62[0-9]{8,14}$/;
const INVOICE_RE = /^[A-Za-z0-9._~-]{1,64}$/;

export function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const firstName = parts[0] ?? fullName;
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
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

export function asciiItemName(value: string) {
  return value
    .replace(/[·•]/g, "-")
    .replace(/[^\u0020-\u007E]/g, " ")
    .replace(/\s*-\s*/g, " - ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 255);
}

export function validateCheckoutRequest(request: DokuCheckoutRequest) {
  const amount = request.order.amount;
  if (!Number.isInteger(amount) || amount <= 0 || String(amount).length > 12) {
    throw new DokuValidationError({ message: "Invalid checkout amount" });
  }
  if (!INVOICE_RE.test(request.order.invoice_number)) {
    throw new DokuValidationError({ message: "Invalid invoice number" });
  }
  if (request.order.currency !== "IDR") {
    throw new DokuValidationError({ message: "Unsupported currency" });
  }
  if (!EMAIL_RE.test(request.customer.email)) {
    throw new DokuValidationError({ message: "Invalid customer email" });
  }
  if (!PHONE_RE.test(request.customer.phone)) {
    throw new DokuValidationError({ message: "Invalid customer phone" });
  }
}

export function buildCheckoutRequest(
  orderId: string,
  reservation: ReservationPayload,
  urls: { callbackUrl: string; notificationUrl: string },
): DokuCheckoutRequest {
  const table = getTablePackage(reservation.packageId);
  const night = getNight(reservation.nightId);
  if (!table || !night) {
    throw new DokuValidationError({ message: "Unknown table or night" });
  }

  const { firstName, lastName } = splitName(reservation.name);
  const seat = getSeat(reservation.seatId);
  const itemName = asciiItemName(
    seat
      ? `${table.name} ${night.short} - ${seat.label}`
      : `${table.name} ${night.short}`,
  );

  return {
    order: {
      amount: table.priceIdr,
      invoice_number: orderId,
      currency: "IDR",
      callback_url: urls.callbackUrl,
      callback_url_result: urls.callbackUrl,
      language: "EN",
      auto_redirect: true,
      recover_abandoned_cart: false,
      line_items: [
        {
          id: table.id,
          name: itemName,
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
    callbacks: {
      url: urls.callbackUrl,
    },
    additional_info: {
      override_notification_url: urls.notificationUrl,
    },
  };
}

function parseCheckoutResponse(data: unknown): DokuCheckout {
  const payload = asRecord(data);
  const inner = asRecord(payload?.response);
  const payment = asRecord(inner?.payment);
  const paymentUrl = stringField(payment, "url");
  const tokenId = stringField(payment, "token_id");
  if (!paymentUrl || !tokenId) {
    throw new DokuValidationError({
      message: "Could not start payment",
      endpoint: CHECKOUT_PAYMENT_PATH,
    });
  }
  return {
    tokenId,
    paymentUrl,
    expiredDate: stringField(payment, "expired_date"),
  };
}

export async function createCheckoutPayment(
  orderId: string,
  reservation: ReservationPayload,
  urls: { callbackUrl: string; notificationUrl: string },
): Promise<DokuCheckout> {
  const request = buildCheckoutRequest(orderId, reservation, urls);
  validateCheckoutRequest(request);
  const body = JSON.stringify(request);
  const result = await dokuFetch({
    method: "POST",
    requestTarget: CHECKOUT_PAYMENT_PATH,
    body,
  });
  return parseCheckoutResponse(result.data);
}

export async function cancelCheckoutOrder(request: DokuCancelRequest) {
  if (!request.order.invoice_number || !request.payment.original_request_id) {
    throw new DokuValidationError({ message: "Missing cancel fields" });
  }
  const result = await dokuFetch({
    method: "POST",
    requestTarget: CHECKOUT_CANCEL_PATH,
    body: JSON.stringify(request),
  });
  return result.data;
}
