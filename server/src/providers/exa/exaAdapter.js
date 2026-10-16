import { config } from "../../config.js";
import { AppError, ERROR_CODES } from "../../utils/errors.js";
import { fetchWithRetry } from "../../utils/http.js";

const EXA_SEARCH_URL = "https://api.exa.ai/search";
const EXA_TIMEOUT_MS = 20000;
const RESULTS_PER_QUERY = 3;
const PROVIDER = "exa";

function normalizeDomain(domain) {
  if (!domain) return null;
  return String(domain)
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/.*$/, "")
    .replace(/\/+$/, "") || null;
}

function buildQueries({ name, domain }) {
  const company = (name || "").trim() || normalizeDomain(domain) || "";
  const site = normalizeDomain(domain);

  return [
    {
      label: "overview",
      query: `${company} company overview: what they do, industry, product`,
      includeDomains: site ? [site] : undefined,
    },
    {
      label: "funding",
      query: `${company} funding round, investors, valuation, growth news`,
    },
    {
      label: "hiring",
      query: `${company} hiring, job openings, expansion, new office`,
    },
    {
      label: "product",
      query: `${company} product launch, new features, announcements`,
    },
    {
      label: "leadership",
      query: `${company} leadership team, CEO, founders, executives`,
    },
  ];
}

async function searchOnce({ query, includeDomains }, { apiKey, objective }) {
  const body = {
    query,
    type: "auto",
    numResults: RESULTS_PER_QUERY,
    contents: { highlights: true },
  };

  if (includeDomains && includeDomains.length > 0) {
    body.includeDomains = includeDomains;
  }
  if (objective) {
    body.objective = objective;
  }

  const response = await fetchWithRetry(
    EXA_SEARCH_URL,
    {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
      provider: PROVIDER,
    },
    { timeoutMs: EXA_TIMEOUT_MS, provider: PROVIDER }
  );

  const data = await response.json();
  return Array.isArray(data?.results) ? data.results : [];
}

export async function researchCompany({ name, domain, objective } = {}) {
  if (!config.exaApiKey) {
    throw new AppError(ERROR_CODES.PROVIDER_AUTH, "EXA_API_KEY is not configured", {
      provider: PROVIDER,
    });
  }

  const queries = buildQueries({ name, domain });
  const results = [];
  const warnings = [];
  const seenUrls = new Set();

  for (const q of queries) {
    try {
      const rawResults = await searchOnce(q, { apiKey: config.exaApiKey, objective });

      for (const item of rawResults) {
        const url = item?.url;
        if (!url || seenUrls.has(url)) continue;
        seenUrls.add(url);
        results.push({
          url,
          title: item.title ?? null,
          publishedDate: item.publishedDate ?? null,
          highlights: Array.isArray(item.highlights) ? item.highlights : [],
          query: q.query,
        });
      }
    } catch (err) {
      warnings.push({
        query: q.query,
        code: err?.code ?? ERROR_CODES.PROVIDER_ERROR,
        message: err?.message ?? "Exa query failed",
      });
    }
  }

  return { results, warnings };
}

export default { researchCompany };
