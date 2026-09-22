// An error whose message is safe to show to guests. Anything else (database,
// network, payment provider) is logged and replaced with a generic message.
export class PublicError extends Error {}

export function publicMessage(error: unknown, fallback: string) {
  return error instanceof PublicError ? error.message : fallback;
}
