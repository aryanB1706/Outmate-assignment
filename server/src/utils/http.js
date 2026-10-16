import { AppError, ERROR_CODES } from "./errors.js";

const DEFAULT_TIMEOUT_MS = 10000;
const MAX_RETRIES = 2;

function parseRetryAfter(headerValue) {
  if (!headerValue) return null;

  const seconds = Number(headerValue);
  if (Number.isFinite(seconds)) {
    return Math.max(0, seconds * 1000);
  }

  const dateMs = Date.parse(headerValue);
  if (!Number.isNaN(dateMs)) {
    return Math.max(0, dateMs - Date.now());
  }

  return null;
}

function backoffDelay(attempt) {
  const base = 300 * 2 ** attempt;
  const jitter = Math.random() * 100;
  return base + jitter;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetryOnStatus(status) {
  return status === 429 || status >= 500;
}

function errorForStatus(status, provider) {
  if (status === 429) {
    return new AppError(ERROR_CODES.PROVIDER_RATE_LIMIT, "Provider rate limit exceeded", {
      provider,
    });
  }
  if (status === 401 || status === 403) {
    return new AppError(ERROR_CODES.PROVIDER_AUTH, "Provider authentication failed", {
      provider,
    });
  }
  return new AppError(ERROR_CODES.PROVIDER_ERROR, `Provider request failed (${status})`, {
    provider,
  });
}

export async function fetchWithTimeout(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new AppError(ERROR_CODES.PROVIDER_TIMEOUT, `Request timed out after ${timeoutMs}ms`, {
        provider: options.provider ?? null,
      });
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchWithRetry(
  url,
  options = {},
  { timeoutMs = DEFAULT_TIMEOUT_MS, retries = MAX_RETRIES, provider = null } = {}
) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetchWithTimeout(url, { ...options, provider }, timeoutMs);

      if (!shouldRetryOnStatus(response.status) || attempt === retries) {
        if (!response.ok) {
          throw errorForStatus(response.status, provider);
        }
        return response;
      }

      const retryAfter = parseRetryAfter(response.headers?.get?.("retry-after"));
      try {
        await response.body?.cancel?.();
      } catch {
        // ignore body cancellation errors
      }
      await sleep(retryAfter ?? backoffDelay(attempt));
    } catch (err) {
      lastError = err;
      const isTimeout = err instanceof AppError && err.code === ERROR_CODES.PROVIDER_TIMEOUT;
      if (isTimeout && attempt < retries) {
        await sleep(backoffDelay(attempt));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
}

export { MAX_RETRIES };
