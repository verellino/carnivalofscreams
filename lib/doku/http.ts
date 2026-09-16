import { getDokuConfig } from "./config";
import {
  DokuApiError,
  DokuAuthError,
  DokuNetworkError,
  DokuValidationError,
} from "./errors";
import { dokuLog, errorMessage } from "./json";
import { dokuRequestHeaders } from "./signature";

export type DokuHttpResult = {
  status: number;
  data: unknown;
  requestId: string;
  timestamp: string;
  endpoint: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mapStatusError(
  status: number,
  data: unknown,
  requestId: string,
  endpoint: string,
) {
  const message = errorMessage(data, "DOKU request failed");
  const options = { message, requestId, endpoint, status };
  if (status === 401 || status === 403) return new DokuAuthError(options);
  if (status === 400) return new DokuValidationError(options);
  return new DokuApiError(options);
}

async function sendOnce(options: {
  method: "GET" | "POST";
  requestTarget: string;
  body?: string;
  requestId: string;
  timestamp: string;
}): Promise<DokuHttpResult> {
  const config = getDokuConfig();
  const headers = dokuRequestHeaders({
    method: options.method,
    requestTarget: options.requestTarget,
    body: options.body,
    requestId: options.requestId,
    timestamp: options.timestamp,
  });

  let response: Response;
  try {
    response = await fetch(`${config.baseUrl}${options.requestTarget}`, {
      method: options.method,
      headers,
      body: options.body,
      cache: "no-store",
      signal: AbortSignal.timeout(config.readTimeoutMs),
    });
  } catch (cause) {
    throw new DokuNetworkError({
      message: "Could not reach DOKU",
      requestId: options.requestId,
      endpoint: options.requestTarget,
      cause,
    });
  }

  let data: unknown = {};
  try {
    data = (await response.json()) as unknown;
  } catch {
    data = {};
  }

  return {
    status: response.status,
    data,
    requestId: options.requestId,
    timestamp: options.timestamp,
    endpoint: options.requestTarget,
  };
}

export async function dokuFetch(options: {
  method: "GET" | "POST";
  requestTarget: string;
  body?: string;
}): Promise<DokuHttpResult> {
  const config = getDokuConfig();
  const requestId = crypto.randomUUID();
  const timestamp = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
  let lastError: unknown;

  for (let attempt = 0; attempt <= config.maxRetries; attempt += 1) {
    try {
      const result = await sendOnce({ ...options, requestId, timestamp });
      dokuLog(
        result.status >= 400 ? "error" : "info",
        {
          request_id: result.requestId,
          endpoint: result.endpoint,
          http_method: options.method,
          error_code: result.status >= 400 ? String(result.status) : undefined,
        },
        result.status >= 400 ? "DOKU API call failed" : "DOKU API call completed",
      );
      if (result.status >= 500 && attempt < config.maxRetries) {
        await sleep(250 * 2 ** attempt);
        continue;
      }
      if (result.status >= 400) {
        throw mapStatusError(
          result.status,
          result.data,
          result.requestId,
          result.endpoint,
        );
      }
      return result;
    } catch (error) {
      lastError = error;
      if (error instanceof DokuNetworkError && attempt < config.maxRetries) {
        dokuLog(
          "warn",
          {
            request_id: requestId,
            endpoint: options.requestTarget,
            http_method: options.method,
            error_code: "network",
          },
          "Retrying DOKU API call",
        );
        await sleep(250 * 2 ** attempt);
        continue;
      }
      throw error;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new DokuNetworkError({
        message: "Could not reach DOKU",
        requestId,
        endpoint: options.requestTarget,
      });
}
