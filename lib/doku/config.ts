import { DokuAuthError } from "./errors";

const SANDBOX_API = "https://api-sandbox.doku.com";
const PRODUCTION_API = "https://api.doku.com";
const SANDBOX_CHECKOUT_JS =
  "https://sandbox.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js";
const PRODUCTION_CHECKOUT_JS =
  "https://jokul.doku.com/jokul-checkout-js/v1/jokul-checkout-1.0.0.js";

export type DokuConfig = {
  clientId: string;
  secretKey: string;
  isProduction: boolean;
  baseUrl: string;
  checkoutJsUrl: string;
  connectTimeoutMs: number;
  readTimeoutMs: number;
  maxRetries: number;
};

export function isDokuConfigured() {
  return Boolean(process.env.DOKU_CLIENT_ID && process.env.DOKU_SECRET_KEY);
}

export function isDokuProduction() {
  return process.env.DOKU_IS_PRODUCTION === "true";
}

export function getCheckoutJsUrl() {
  return isDokuProduction() ? PRODUCTION_CHECKOUT_JS : SANDBOX_CHECKOUT_JS;
}

export function getDokuConfig(): DokuConfig {
  const clientId = process.env.DOKU_CLIENT_ID;
  const secretKey = process.env.DOKU_SECRET_KEY;
  if (!clientId) {
    throw new DokuAuthError({ message: "DOKU_CLIENT_ID is not configured" });
  }
  if (!secretKey) {
    throw new DokuAuthError({ message: "DOKU_SECRET_KEY is not configured" });
  }

  const isProduction = isDokuProduction();
  return {
    clientId,
    secretKey,
    isProduction,
    baseUrl: isProduction ? PRODUCTION_API : SANDBOX_API,
    checkoutJsUrl: isProduction ? PRODUCTION_CHECKOUT_JS : SANDBOX_CHECKOUT_JS,
    connectTimeoutMs: 10_000,
    readTimeoutMs: 30_000,
    maxRetries: 3,
  };
}
