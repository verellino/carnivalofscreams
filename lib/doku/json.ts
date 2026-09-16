export type JsonRecord = Record<string, unknown>;

export function asRecord(value: unknown): JsonRecord | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  return value as JsonRecord;
}

export function stringField(record: JsonRecord | undefined, key: string) {
  const value = record?.[key];
  if (typeof value === "string" && value.length > 0) return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

export function numberField(record: JsonRecord | undefined, key: string) {
  const value = record?.[key];
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function errorMessage(data: unknown, fallback: string) {
  const record = asRecord(data);
  const error = asRecord(record?.error);
  if (typeof error?.message === "string" && error.message) return error.message;
  const message = record?.message;
  if (Array.isArray(message)) {
    return message.filter((item) => typeof item === "string").join(", ") || fallback;
  }
  if (typeof message === "string" && message) return message;
  return fallback;
}

export function dokuLog(
  level: "info" | "warn" | "error",
  fields: Record<string, unknown>,
  message: string,
) {
  const payload = {
    timestamp: new Date().toISOString(),
    ...fields,
    message,
  };
  if (level === "error") {
    console.error("[doku]", payload);
    return;
  }
  if (level === "warn") {
    console.warn("[doku]", payload);
    return;
  }
  console.info("[doku]", payload);
}
