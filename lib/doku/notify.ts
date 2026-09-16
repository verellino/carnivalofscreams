import { getDokuConfig } from "./config";
import { dokuLog } from "./json";
import { verifyNotificationSignature } from "./signature";
import { DOKU_NOTIFICATION_ACK } from "./types";

const REPLAY_TTL_MS = 24 * 60 * 60 * 1000;
const seenRequestIds = new Map<string, number>();

export type NotificationHeaders = {
  clientId: string;
  requestId: string;
  timestamp: string;
  signature: string;
};

export type NotificationCheck =
  | { ok: true; replay: boolean; headers: NotificationHeaders }
  | { ok: false; status: 400; error: string };

function pruneSeen(now = Date.now()) {
  for (const [requestId, expiresAt] of seenRequestIds) {
    if (expiresAt <= now) seenRequestIds.delete(requestId);
  }
}

export function wasNotificationSeen(requestId: string) {
  pruneSeen();
  const expiresAt = seenRequestIds.get(requestId);
  return Boolean(expiresAt && expiresAt > Date.now());
}

export function markNotificationSeen(requestId: string) {
  pruneSeen();
  seenRequestIds.set(requestId, Date.now() + REPLAY_TTL_MS);
}

export function readNotificationHeaders(
  headerList: Headers,
): NotificationHeaders | undefined {
  const clientId = headerList.get("client-id") ?? "";
  const requestId = headerList.get("request-id") ?? "";
  const timestamp = headerList.get("request-timestamp") ?? "";
  const signature = headerList.get("signature") ?? "";
  if (!clientId || !requestId || !timestamp || !signature) return undefined;
  return { clientId, requestId, timestamp, signature };
}

export function verifyIncomingNotification(options: {
  headers: NotificationHeaders;
  requestTarget: string;
  rawBody: string;
}): NotificationCheck {
  const config = getDokuConfig();
  if (options.headers.clientId !== config.clientId) {
    dokuLog(
      "error",
      {
        request_id: options.headers.requestId,
        endpoint: options.requestTarget,
        http_method: "POST",
        error_code: "client_id_mismatch",
      },
      "Rejected DOKU notification",
    );
    return { ok: false, status: 400, error: "Invalid client" };
  }

  if (wasNotificationSeen(options.headers.requestId)) {
    return { ok: true, replay: true, headers: options.headers };
  }

  const signatureValid = verifyNotificationSignature({
    clientId: options.headers.clientId,
    requestId: options.headers.requestId,
    timestamp: options.headers.timestamp,
    requestTarget: options.requestTarget,
    rawBody: options.rawBody,
    signature: options.headers.signature,
    secretKey: config.secretKey,
  });

  if (!signatureValid) {
    dokuLog(
      "error",
      {
        request_id: options.headers.requestId,
        endpoint: options.requestTarget,
        http_method: "POST",
        error_code: "invalid_signature",
      },
      "Rejected DOKU notification",
    );
    return { ok: false, status: 400, error: "Invalid signature" };
  }

  return { ok: true, replay: false, headers: options.headers };
}

export function notificationAck() {
  return DOKU_NOTIFICATION_ACK;
}
