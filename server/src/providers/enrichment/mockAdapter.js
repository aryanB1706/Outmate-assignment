import { AppError, ERROR_CODES } from "../../utils/errors.js";

const PROVIDER = "mock";
const ARTIFICIAL_DELAY_MS = 300;

/**
 * Enrichment adapter contract (see docs/enrichment-provider-notes.md).
 *
 * `enrichCompany({ name, domain })` resolves to:
 * {
 *   source: string,        // provider id, e.g. "mock"
 *   isMock: boolean,       // true when values are placeholders, not real data
 *   company: {
 *     industry: string|null,
 *     employeeRange: string|null,
 *     headquarters: string|null,
 *     foundedYear: number|null
 *   },
 *   contacts: Array,       // always [] from the mock provider
 *   meta: {
 *     note: string,
 *     fetchedAt: string    // ISO 8601 timestamp
 *   }
 * }
 *
 * Implementations must never fabricate real company facts or contacts.
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function enrichCompany({ name, domain } = {}) {
  if (domain === "fail.test") {
    throw new AppError(ERROR_CODES.PROVIDER_ERROR, "Mock enrichment forced failure", {
      provider: PROVIDER,
    });
  }

  await delay(ARTIFICIAL_DELAY_MS);

  return {
    source: PROVIDER,
    isMock: true,
    company: {
      industry: "Sample Industry",
      employeeRange: "Unknown",
      headquarters: "Sample Location",
      foundedYear: null,
    },
    contacts: [],
    meta: {
      note: "Mock enrichment — real provider not integrated",
      fetchedAt: new Date().toISOString(),
    },
  };
}

export const mockEnrichmentProvider = { source: PROVIDER, isMock: true, enrichCompany };

export default mockEnrichmentProvider;
