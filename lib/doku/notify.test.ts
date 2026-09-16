import assert from "node:assert/strict";
import test from "node:test";

import {
  markNotificationSeen,
  verifyIncomingNotification,
  wasNotificationSeen,
} from "./notify";
import { dokuRequestHeaders } from "./signature";

const CLIENT_ID = "BRN-0000-notify";
const SECRET = "SK-notify-secret";

test("rejects notifications with a mismatched Client-Id", () => {
  process.env.DOKU_CLIENT_ID = CLIENT_ID;
  process.env.DOKU_SECRET_KEY = SECRET;
  const rawBody = '{"transaction":{"status":"SUCCESS"}}';
  const headers = dokuRequestHeaders({
    method: "POST",
    requestTarget: "/api/doku/notification",
    body: rawBody,
    clientId: "BRN-OTHER-merchant",
    secretKey: SECRET,
  });

  const result = verifyIncomingNotification({
    headers: {
      clientId: headers["Client-Id"],
      requestId: headers["Request-Id"],
      timestamp: headers["Request-Timestamp"],
      signature: headers.Signature,
    },
    requestTarget: "/api/doku/notification",
    rawBody,
  });
  assert.equal(result.ok, false);
  if (!result.ok) assert.equal(result.error, "Invalid client");
});

test("treats a repeated Request-Id as a replay", () => {
  process.env.DOKU_CLIENT_ID = CLIENT_ID;
  process.env.DOKU_SECRET_KEY = SECRET;
  const rawBody = '{"transaction":{"status":"SUCCESS"}}';
  const headers = dokuRequestHeaders({
    method: "POST",
    requestTarget: "/api/doku/notification",
    body: rawBody,
    clientId: CLIENT_ID,
    secretKey: SECRET,
  });
  markNotificationSeen(headers["Request-Id"]);
  assert.equal(wasNotificationSeen(headers["Request-Id"]), true);

  const result = verifyIncomingNotification({
    headers: {
      clientId: headers["Client-Id"],
      requestId: headers["Request-Id"],
      timestamp: headers["Request-Timestamp"],
      signature: headers.Signature,
    },
    requestTarget: "/api/doku/notification",
    rawBody,
  });
  assert.equal(result.ok, true);
  if (result.ok) assert.equal(result.replay, true);
});
