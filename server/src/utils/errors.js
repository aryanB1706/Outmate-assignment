export const ERROR_CODES = {
  VALIDATION_ERROR: "VALIDATION_ERROR",
  PROVIDER_TIMEOUT: "PROVIDER_TIMEOUT",
  PROVIDER_RATE_LIMIT: "PROVIDER_RATE_LIMIT",
  PROVIDER_AUTH: "PROVIDER_AUTH",
  PROVIDER_ERROR: "PROVIDER_ERROR",
  NOT_FOUND: "NOT_FOUND",
};

export const DEFAULT_STATUS_CODES = {
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.PROVIDER_TIMEOUT]: 504,
  [ERROR_CODES.PROVIDER_RATE_LIMIT]: 429,
  [ERROR_CODES.PROVIDER_AUTH]: 502,
  [ERROR_CODES.PROVIDER_ERROR]: 502,
  [ERROR_CODES.NOT_FOUND]: 404,
};

export class AppError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = "AppError";
    this.code = ERROR_CODES[code] ? code : ERROR_CODES.PROVIDER_ERROR;
    this.statusCode =
      options.statusCode ?? DEFAULT_STATUS_CODES[this.code] ?? 500;
    this.provider = options.provider ?? null;
    this.expose = options.expose ?? true;
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

export default AppError;
