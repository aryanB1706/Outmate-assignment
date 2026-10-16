import { config } from "../../config.js";
import { mockEnrichmentProvider } from "./mockAdapter.js";

/**
 * Returns the active enrichment provider based on ENRICHMENT_MODE.
 *
 * Only "mock" is supported in this prototype. Any other value (including
 * "moltsets", whose adapter is a documented stub) logs a warning and falls
 * back to the mock provider.
 *
 * To add a real provider: implement it as an adapter with the same
 * `enrichCompany` contract, register it here, and set ENRICHMENT_MODE.
 * See docs/enrichment-provider-notes.md.
 */
export function getEnrichmentProvider(mode = config.enrichmentMode) {
  const normalized = String(mode ?? "").trim().toLowerCase();

  if (normalized && normalized !== "mock") {
    console.warn(
      `[enrichment] ENRICHMENT_MODE "${mode}" is not supported yet; falling back to "mock".`
    );
  }

  return mockEnrichmentProvider;
}

export default getEnrichmentProvider;
