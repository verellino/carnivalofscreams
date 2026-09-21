import assert from "node:assert/strict";
import test from "node:test";

import { asciiItemName, validateCheckoutRequest } from "./checkout";
import { DokuValidationError } from "./errors";
import type { DokuCheckoutRequest } from "./types";

function validRequest(
  overrides: Partial<DokuCheckoutRequest> = {},
): DokuCheckoutRequest {
  return {
    order: {
      amount: 300000,
      invoice_number: "COS-30-REG-abc123defg",
      currency: "IDR",
      callback_url: "https://example.com/reserve/confirmed",
      callback_url_result: "https://example.com/reserve/confirmed",
      language: "EN",
      auto_redirect: true,
      recover_abandoned_cart: false,
      line_items: [
        { id: "onomy", name: "Onomy Area 30 Oct - Onomy 1", quantity: 1, price: 300000 },
      ],
    },
    payment: {
      payment_due_date: 60,
      payment_method_types: ["VIRTUAL_ACCOUNT_DOKU"],
    },
    customer: {
      name: "Test",
      last_name: "Guest",
      email: "guest@example.com",
      phone: "6281212345678",
      country: "ID",
    },
    callbacks: { url: "https://example.com/reserve/confirmed" },
    additional_info: {
      override_notification_url: "https://example.com/api/doku/notification",
    },
    ...overrides,
  };
}

test("accepts a valid checkout request", () => {
  validateCheckoutRequest(validRequest());
});

test("rejects non-integer or non-positive amounts", () => {
  assert.throws(
    () => validateCheckoutRequest(validRequest({
      order: { ...validRequest().order, amount: 10.5 },
    })),
    DokuValidationError,
  );
  assert.throws(
    () => validateCheckoutRequest(validRequest({
      order: { ...validRequest().order, amount: 0 },
    })),
    DokuValidationError,
  );
});

test("rejects invalid invoice, currency, email, and phone", () => {
  assert.throws(
    () => validateCheckoutRequest(validRequest({
      order: { ...validRequest().order, invoice_number: "" },
    })),
    DokuValidationError,
  );
  assert.throws(
    () => validateCheckoutRequest(validRequest({
      order: { ...validRequest().order, currency: "USD" },
    })),
    DokuValidationError,
  );
  assert.throws(
    () => validateCheckoutRequest(validRequest({
      customer: { ...validRequest().customer, email: "not-an-email" },
    })),
    DokuValidationError,
  );
  assert.throws(
    () => validateCheckoutRequest(validRequest({
      customer: { ...validRequest().customer, phone: "0812" },
    })),
    DokuValidationError,
  );
});

test("strips non-ASCII characters from line item names", () => {
  assert.equal(asciiItemName("Luxer Area · Luxer 1"), "Luxer Area - Luxer 1");
  assert.equal(asciiItemName("Tivex Area 30 Oct - Tivex 3"), "Tivex Area 30 Oct - Tivex 3");
});
