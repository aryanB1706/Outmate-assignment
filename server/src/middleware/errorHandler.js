import { AppError, ERROR_CODES } from "../utils/errors.js";

export function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "Internal server error";

  if (err instanceof AppError && err.expose) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
  } else if (err?.type === "entity.parse.failed") {
    statusCode = 400;
    code = ERROR_CODES.VALIDATION_ERROR;
    message = "Invalid JSON in request body";
  }

  console.error(`[error] ${code}: ${err?.message ?? err}`);

  res.status(statusCode).json({ error: { code, message } });
}

export default errorHandler;
