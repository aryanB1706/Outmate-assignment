import { researchCompany } from "../providers/exa/exaAdapter.js";
import { getEnrichmentProvider } from "../providers/enrichment/index.js";
import { normalizeCompanyReport } from "./normalize.js";

const CACHE_TTL_MS = 10 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;

const cache = new Map();

function cacheKeyFor({ name, domain }) {
  if (domain) return `domain:${String(domain).toLowerCase()}`;
  if (name) return `name:${String(name).toLowerCase()}`;
  return null;
}

function readCache(key, now) {
  if (!key) return null;
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= now) {
    cache.delete(key);
    return null;
  }
  return entry.report;
}

function writeCache(key, report, now) {
  if (!key) return;
  if (cache.size >= CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, { report, expiresAt: now + CACHE_TTL_MS });
}

export function __clearCache() {
  cache.clear();
}

export async function runResearch(input = {}) {
  const { name, domain, objective } = input;
  const now = Date.now();
  const key = cacheKeyFor({ name, domain });

  const cached = readCache(key, now);
  if (cached) {
    return cached;
  }

  const exaResult = await researchCompany({ name, domain, objective });
  const results = exaResult?.results ?? [];
  const warnings = [...(exaResult?.warnings ?? [])];
  const exaFailedCompletely = results.length === 0 && warnings.length > 0;

  let enrichment = null;
  try {
    const provider = getEnrichmentProvider();
    enrichment = await provider.enrichCompany({ name, domain });
  } catch (err) {
    warnings.push(`Enrichment unavailable: ${err?.message ?? "unknown error"}`);
  }

  const report = normalizeCompanyReport(
    { research: { results, warnings }, enrichment, query: { name, domain, objective } },
    { now: new Date(now).toISOString() }
  );

  if (!exaFailedCompletely) {
    writeCache(key, report, now);
  }

  return report;
}

export default runResearch;
