import { formatIdr, getNight, getTablePackage } from "../tables";
import { dokuFetch } from "./http";
import { asRecord, numberField, stringField } from "./json";
import { parseOrderId } from "./orders";
import { orderStatusPath, type DokuOrderStatus } from "./types";

export function isPaidStatus(status?: string) {
  return status === "SUCCESS";
}

export function isPendingStatus(status?: string, orderStatus?: string) {
  if (status === "PENDING" || status === "REDIRECT" || status === "TIMEOUT") {
    return true;
  }
  if (!status && orderStatus === "ORDER_GENERATED") return true;
  return false;
}

export function isExpiredStatus(status?: string, orderStatus?: string) {
  return status === "EXPIRED" || orderStatus === "ORDER_EXPIRED";
}

export function isFailedStatus(status?: string, orderStatus?: string) {
  return (
    status === "FAILED" ||
    status === "EXPIRED" ||
    status === "REFUNDED" ||
    orderStatus === "ORDER_EXPIRED"
  );
}

export function readDokuStatus(payload: unknown): DokuOrderStatus {
  const record = asRecord(payload);
  const order = asRecord(record?.order) ?? record;
  const transaction = asRecord(record?.transaction);
  const channel = asRecord(record?.channel);

  return {
    invoiceNumber: stringField(order, "invoice_number"),
    amount: numberField(order, "amount"),
    orderStatus: stringField(order, "status"),
    transactionStatus: stringField(transaction, "status"),
    channelId: stringField(channel, "id"),
    transactionDate: stringField(transaction, "date"),
    originalRequestId: stringField(transaction, "original_request_id"),
  };
}

export async function getOrderStatus(orderId: string): Promise<DokuOrderStatus> {
  const result = await dokuFetch({
    method: "GET",
    requestTarget: orderStatusPath(orderId),
  });
  return readDokuStatus(result.data);
}

export function summarizeReservation(options: {
  orderId: string;
  amount?: number;
  nightId?: string;
  packageId?: string;
  partySize?: number;
}) {
  const parsed = parseOrderId(options.orderId);
  const table = getTablePackage(options.packageId ?? parsed?.packageId ?? "");
  const night = getNight(options.nightId ?? parsed?.nightId ?? "");

  return {
    table,
    night,
    partySize: options.partySize,
    amountLabel:
      options.amount != null
        ? formatIdr(options.amount)
        : table
          ? formatIdr(table.priceIdr)
          : undefined,
  };
}
