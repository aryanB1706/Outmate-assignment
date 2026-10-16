import { AppError, ERROR_CODES } from "../../utils/errors.js";

const PROVIDER = "moltsets";

/**
 * MoltSets enrichment adapter — STUB ONLY, not integrated.
 *
 * No network calls, URLs, or keys are used here. This file exists to document
 * the provider contract so a real integration can be dropped in.
 *
 * Expected interface (identical to the mock provider):
 *   enrichCompany({ name, domain }) -> Promise<{
 *     source: "moltsets",
 *     isMock: false,
 *     company: {
 *       industry: string|null,
 *       employeeRange: string|null,
 *       headquarters: string|null,
 *       foundedYear: number|null
 *     },
 *     contacts: Array<{
 *       name?: string|null,
 *       title?: string|null,
 *       email?: string|null,
 *       phone?: string|null,
 *       sourceUrls?: string[]
 *     }>,
 *     meta: { note?: string, fetchedAt: string }
 *   }>
 *
 * Where the real API call would go: inside `enrichCompany`, after validating
 * input, read the key from the server environment and issue the provider's
 * enrichment request, then normalize the response into the shape above. Any
 * field the provider does not return must be surfaced as null/unavailable —
 * never fabricated. Errors should be mapped to AppError codes
 * (PROVIDER_TIMEOUT / PROVIDER_RATE_LIMIT / PROVIDER_AUTH / PROVIDER_ERROR).
 */
export async function enrichCompany() {
  throw new AppError(ERROR_CODES.PROVIDER_ERROR, "MoltSets integration not implemented", {
    provider: PROVIDER,
  });
}

export const moltsetsEnrichmentProvider = { source: PROVIDER, isMock: false, enrichCompany };

export default moltsetsEnrichmentProvider;
