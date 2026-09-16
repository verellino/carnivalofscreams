import { createHash, createHmac, timingSafeEqual } from "node:crypto";

import { getDokuConfig } from "./config";

export function utcTimestamp(date = new Date()) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function digestBody(body: string) {
  return createHash("sha256").update(body).digest("base64");
}

export function signatureComponent(parts: {
  clientId: string;
  requestId: string;
  timestamp: string;
  requestTarget: string;
  digest?: string;
}) {
  const lines = [
    `Client-Id:${parts.clientId}`,
    `Request-Id:${parts.requestId}`,
    `Request-Timestamp:${parts.timestamp}`,
    `Request-Target:${parts.requestTarget}`,
  ];
  if (parts.digest) {
    lines.push(`Digest:${parts.digest}`);
  }
  return lines.join("\n");
}

export function hmacSignature(component: string, secret: string) {
  const digest = createHmac("sha256", secret).update(component).digest("base64");
  return `HMACSHA256=${digest}`;
}

export function dokuRequestHeaders(options: {
  method: "GET" | "POST";
  requestTarget: string;
  body?: string;
  requestId?: string;
  timestamp?: string;
  clientId?: string;
  secretKey?: string;
}) {
  const config =
    options.clientId && options.secretKey
      ? { clientId: options.clientId, secretKey: options.secretKey }
      : getDokuConfig();
  const requestId = options.requestId ?? crypto.randomUUID();
  const timestamp = options.timestamp ?? utcTimestamp();
  const digest =
    options.method === "POST" && options.body !== undefined
      ? digestBody(options.body)
      : undefined;
  const signature = hmacSignature(
    signatureComponent({
      clientId: config.clientId,
      requestId,
      timestamp,
      requestTarget: options.requestTarget,
      digest,
    }),
    config.secretKey,
  );

  return {
    "Client-Id": config.clientId,
    "Request-Id": requestId,
    "Request-Timestamp": timestamp,
    Signature: signature,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
}

export function signaturesMatch(expected: string, received: string) {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function verifyNotificationSignature(options: {
  clientId: string;
  requestId: string;
  timestamp: string;
  requestTarget: string;
  rawBody: string;
  signature: string;
  secretKey?: string;
}) {
  const secretKey = options.secretKey ?? getDokuConfig().secretKey;
  const expected = hmacSignature(
    signatureComponent({
      clientId: options.clientId,
      requestId: options.requestId,
      timestamp: options.timestamp,
      requestTarget: options.requestTarget,
      digest: digestBody(options.rawBody),
    }),
    secretKey,
  );
  return signaturesMatch(expected, options.signature);
}
