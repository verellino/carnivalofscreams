export class DokuApiError extends Error {
  readonly requestId: string;
  readonly responseCode: string;
  readonly endpoint: string;
  readonly status?: number;

  constructor(options: {
    message: string;
    requestId?: string;
    responseCode?: string;
    endpoint?: string;
    status?: number;
    cause?: unknown;
  }) {
    super(options.message, { cause: options.cause });
    this.name = "DokuApiError";
    this.requestId = options.requestId ?? "";
    this.responseCode = options.responseCode ?? "";
    this.endpoint = options.endpoint ?? "";
    this.status = options.status;
  }
}

export class DokuAuthError extends DokuApiError {
  constructor(options: ConstructorParameters<typeof DokuApiError>[0]) {
    super(options);
    this.name = "DokuAuthError";
  }
}

export class DokuValidationError extends DokuApiError {
  constructor(options: ConstructorParameters<typeof DokuApiError>[0]) {
    super(options);
    this.name = "DokuValidationError";
  }
}

export class DokuSignatureError extends DokuApiError {
  constructor(options: ConstructorParameters<typeof DokuApiError>[0]) {
    super(options);
    this.name = "DokuSignatureError";
  }
}

export class DokuNetworkError extends DokuApiError {
  constructor(options: ConstructorParameters<typeof DokuApiError>[0]) {
    super(options);
    this.name = "DokuNetworkError";
  }
}
