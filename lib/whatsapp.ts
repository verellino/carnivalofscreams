import { insertAuditLogSafe } from "./audit";
import { dokuRequestHeaders, isDokuProduction, toWhatsAppPhone } from "./doku";
import {
  markWhatsAppSentSafe,
  type ReservationRecord,
} from "./reservations";
import { formatIdr, getNight, getTablePackage } from "./tables";

type WhatsAppResponse = {
  status?: string;
  messageId?: string;
  error?: {
    code?: string;
    message?: string;
    type?: string;
  };
};

export function getWhatsAppTemplateId() {
  return process.env.DOKU_WHATSAPP_TEMPLATE_ID ?? "";
}

export function isWhatsAppConfigured() {
  return Boolean(
    process.env.DOKU_CLIENT_ID &&
      process.env.DOKU_SECRET_KEY &&
      getWhatsAppTemplateId(),
  );
}

function whatsappApiBase() {
  return isDokuProduction()
    ? "https://app.doku.com"
    : "https://app-uat.doku.com";
}

export function whatsappParams(reservation: ReservationRecord) {
  const table = getTablePackage(reservation.packageId);
  const night = getNight(reservation.nightId);
  return [
    reservation.name,
    table?.name ?? reservation.packageId,
    night?.label ?? reservation.nightId,
    reservation.orderId,
    formatIdr(reservation.amountIdr),
  ];
}

export async function sendWhatsAppMessage(options: {
  phone: string;
  params: string[];
  templateId?: string;
}) {
  const templateId = options.templateId ?? getWhatsAppTemplateId();
  if (!templateId) {
    throw new Error("DOKU_WHATSAPP_TEMPLATE_ID is not configured");
  }

  const requestTarget = "/message-as-a-service/v1/whatsapp/messages";
  const body = JSON.stringify({
    templateId,
    params: options.params,
    destinationPhone: toWhatsAppPhone(options.phone),
  });

  const response = await fetch(`${whatsappApiBase()}${requestTarget}`, {
    method: "POST",
    headers: dokuRequestHeaders({
      method: "POST",
      requestTarget,
      body,
      timestamp: String(Date.now()),
    }),
    body,
  });

  const data = (await response.json()) as WhatsAppResponse;
  if (!response.ok || data.error || !data.messageId) {
    const message =
      data.error?.message ?? "Could not send WhatsApp confirmation.";
    throw new Error(message);
  }

  return data;
}

export async function sendReservationWhatsApp(reservation: ReservationRecord) {
  return sendWhatsAppMessage({
    phone: reservation.phone,
    params: whatsappParams(reservation),
  });
}

export async function sendPaidReservationWhatsApp(
  reservation: ReservationRecord | null,
  sourcePath: string,
) {
  if (
    !reservation ||
    reservation.status !== "paid" ||
    reservation.whatsappSentAt ||
    !isWhatsAppConfigured()
  ) {
    return;
  }

  try {
    const result = await sendReservationWhatsApp(reservation);
    if (result.messageId) {
      await markWhatsAppSentSafe(reservation.orderId, result.messageId);
      await insertAuditLogSafe({
        event: "reservation.whatsapp.sent",
        orderId: reservation.orderId,
        method: "POST",
        path: sourcePath,
        payload: { messageId: result.messageId, status: result.status },
      });
    }
  } catch (error) {
    console.error("[doku] failed to send WhatsApp confirmation", error);
    await insertAuditLogSafe({
      event: "reservation.whatsapp.error",
      orderId: reservation.orderId,
      method: "POST",
      path: sourcePath,
      payload: {
        error: error instanceof Error ? error.message : "unknown",
      },
    });
  }
}
