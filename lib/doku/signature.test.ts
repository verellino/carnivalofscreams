import assert from "node:assert/strict";
import { createHash, createHmac } from "node:crypto";
import test from "node:test";

import {
  digestBody,
  dokuRequestHeaders,
  hmacSignature,
  signatureComponent,
  utcTimestamp,
  verifyNotificationSignature,
} from "./signature";

const SECRET = "SK-test-secret";
const CLIENT_ID = "BRN-0000-testclient";

test("utc timestamps are ISO8601 UTC without millis", () => {
  const value = utcTimestamp(new Date("2020-08-11T08:45:42.123Z"));
  assert.equal(value, "2020-08-11T08:45:42Z");
});

test("computes Non-SNAP HMAC-SHA256 in documented field order", () => {
  const body = '{"order":{"amount":10000,"invoice_number":"TEST-001"}}';
  const digest = digestBody(body);
  const expectedDigest = createHash("sha256").update(body).digest("base64");
  assert.equal(digest, expectedDigest);

  const component = signatureComponent({
    clientId: CLIENT_ID,
    requestId: "cc682442-6c22-493e-8121-b9ef6b3fa728",
    timestamp: "2020-08-11T08:45:42Z",
    requestTarget: "/checkout/v1/payment",
    digest,
  });
  assert.equal(
    component,
    [
      `Client-Id:${CLIENT_ID}`,
      "Request-Id:cc682442-6c22-493e-8121-b9ef6b3fa728",
      "Request-Timestamp:2020-08-11T08:45:42Z",
      "Request-Target:/checkout/v1/payment",
      `Digest:${digest}`,
    ].join("\n"),
  );

  const signature = hmacSignature(component, SECRET);
  const raw = createHmac("sha256", SECRET).update(component).digest("base64");
  assert.equal(signature, `HMACSHA256=${raw}`);
});

test("GET signatures omit Digest", () => {
  const component = signatureComponent({
    clientId: CLIENT_ID,
    requestId: "d895fb53-479c-4f77-a76a-ab81b40d77cb",
    timestamp: "2020-08-11T08:45:42Z",
    requestTarget: "/orders/v1/status/INV-123123-12313",
  });
  assert.equal(component.includes("Digest:"), false);
  assert.equal(component.endsWith("/orders/v1/status/INV-123123-12313"), true);
});

test("generates unique Request-Id per call", () => {
  process.env.DOKU_CLIENT_ID = CLIENT_ID;
  process.env.DOKU_SECRET_KEY = SECRET;
  const first = dokuRequestHeaders({
    method: "GET",
    requestTarget: "/orders/v1/status/TEST-001",
  });
  const second = dokuRequestHeaders({
    method: "GET",
    requestTarget: "/orders/v1/status/TEST-001",
  });
  assert.notEqual(first["Request-Id"], second["Request-Id"]);
  assert.equal(first["Client-Id"], CLIENT_ID);
  assert.match(first.Signature, /^HMACSHA256=/);
});

test("verifies inbound notification signatures in constant time", () => {
  const rawBody = '{"order":{"invoice_number":"INV-1"},"transaction":{"status":"SUCCESS"}}';
  const headers = dokuRequestHeaders({
    method: "POST",
    requestTarget: "/api/doku/notification",
    body: rawBody,
    clientId: CLIENT_ID,
    secretKey: SECRET,
  });
  assert.equal(
    verifyNotificationSignature({
      clientId: headers["Client-Id"],
      requestId: headers["Request-Id"],
      timestamp: headers["Request-Timestamp"],
      requestTarget: "/api/doku/notification",
      rawBody,
      signature: headers.Signature,
      secretKey: SECRET,
    }),
    true,
  );
  assert.equal(
    verifyNotificationSignature({
      clientId: headers["Client-Id"],
      requestId: headers["Request-Id"],
      timestamp: headers["Request-Timestamp"],
      requestTarget: "/api/doku/notification",
      rawBody,
      signature: "HMACSHA256=aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa=",
      secretKey: SECRET,
    }),
    false,
  );
});
