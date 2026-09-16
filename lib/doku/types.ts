import type { NightId, TablePackageId } from "../tables";

export const CHECKOUT_PAYMENT_PATH = "/checkout/v1/payment";
export const CHECKOUT_CANCEL_PATH = "/checkout/v3/cancellations";
export const ORDER_STATUS_PATH_PREFIX = "/orders/v1/status/";

export const CHECKOUT_PAYMENT_DUE_MINUTES = 60;

/** Methods and display order on the Jokul page. API list wins over the dashboard selection. */
export const CHECKOUT_PAYMENT_METHOD_TYPES = [
  "VIRTUAL_ACCOUNT_BCA",
  "VIRTUAL_ACCOUNT_BANK_MANDIRI",
  "VIRTUAL_ACCOUNT_BANK_SYARIAH_MANDIRI",
  "VIRTUAL_ACCOUNT_DOKU",
  "VIRTUAL_ACCOUNT_BRI",
  "VIRTUAL_ACCOUNT_BNI",
  "VIRTUAL_ACCOUNT_BANK_PERMATA",
  "VIRTUAL_ACCOUNT_BANK_CIMB",
  "VIRTUAL_ACCOUNT_BANK_DANAMON",
  "ONLINE_TO_OFFLINE_ALFA",
  "CREDIT_CARD",
  "DIRECT_DEBIT_BRI",
  "EMONEY_SHOPEE_PAY",
  "EMONEY_OVO",
  "QRIS",
  "PEER_TO_PEER_AKULAKU",
  "PEER_TO_PEER_KREDIVO",
  "PEER_TO_PEER_INDODANA",
] as const;

export type CheckoutPaymentMethodType =
  (typeof CHECKOUT_PAYMENT_METHOD_TYPES)[number];

export type ReservationPayload = {
  name: string;
  nik: string;
  email: string;
  phone: string;
  nightId: NightId;
  packageId: TablePackageId;
  seatId: string;
};

export type DokuCheckout = {
  tokenId: string;
  paymentUrl: string;
  expiredDate?: string;
};

export type DokuOrderStatus = {
  invoiceNumber?: string;
  amount?: number;
  orderStatus?: string;
  transactionStatus?: string;
  channelId?: string;
  transactionDate?: string;
  originalRequestId?: string;
};

export type DokuLineItem = {
  readonly id: string;
  readonly name: string;
  readonly quantity: number;
  readonly price: number;
};

export type DokuCheckoutRequest = {
  readonly order: {
    readonly amount: number;
    readonly invoice_number: string;
    readonly currency: string;
    readonly callback_url: string;
    readonly callback_url_result: string;
    readonly language: string;
    readonly auto_redirect: boolean;
    readonly recover_abandoned_cart: boolean;
    readonly line_items: readonly DokuLineItem[];
  };
  readonly payment: {
    readonly payment_due_date: number;
    readonly payment_method_types: readonly string[];
  };
  readonly customer: {
    readonly name: string;
    readonly last_name: string;
    readonly email: string;
    readonly phone: string;
    readonly country: string;
  };
  readonly callbacks: {
    readonly url: string;
  };
  readonly additional_info: {
    readonly override_notification_url: string;
  };
};

export type DokuCancelRequest = {
  readonly order: { readonly invoice_number: string };
  readonly payment: { readonly original_request_id: string };
  readonly note: string;
};

export type DokuResponse<T> = {
  success: boolean;
  data?: T;
  error?: { code: string; message: string; requestId: string };
};

export const DOKU_NOTIFICATION_ACK = {
  responseCode: "2000000",
  responseMessage: "Successful",
} as const;

export function orderStatusPath(invoiceNumber: string) {
  return `${ORDER_STATUS_PATH_PREFIX}${encodeURIComponent(invoiceNumber)}`;
}
