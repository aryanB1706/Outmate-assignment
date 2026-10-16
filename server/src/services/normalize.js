/**
 * Pure normalization layer. No network calls.
 *
 * Turns raw research (Exa) results + enrichment provider output into the fixed
 * report schema. Rule-based and deterministic (pass `now` to make timestamps
 * injectable in tests).
 *
 * Every scalar field is { value, status, sources: [url], note? } with status
 * one of: "verified" | "provider-reported" | "inferred" | "unavailable".
 */

const STATUS = {
  VERIFIED: "verified",
  PROVIDER: "provider-reported",
  INFERRED: "inferred",
  UNAVAILABLE: "unavailable",
};

export const FIELD_NAMES = [
  "companyName",
  "website",
  "description",
  "industry",
  "targetMarket",
  "employeeSize",
  "gtmOpportunity",
];

const GROWTH_RULES = [
  { type: "funding", patterns: [/\brais(?:e|ed|es|ing)\b/i, /\bseries\s+[a-e]\b/i, /\bfunding\b/i] },
  { type: "hiring", patterns: [/\bhiring\b/i, /\bhires?\b/i, /\brecruit(?:ing|ment)?\b/i] },
  { type: "expansion", patterns: [/\bexpand(?:s|ing|ed|ion)?\b/i, /\bnew (?:office|market|region)s?\b/i] },
  { type: "launch", patterns: [/\blaunch(?:es|ed|ing)?\b/i, /\bunveil(?:s|ed)?\b/i] },
];

function normalizeDomain(domain) {
  if (!domain) return null;
  return (
    String(domain)
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "") || null
  );
}

function collapse(text) {
  return String(text ?? "").replace(/\s+/g, " ").trim();
}

function truncate(text, max) {
  const clean = collapse(text);
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
}

function field(value, status, sources = [], note) {
  return note ? { value, status, sources, note } : { value, status, sources };
}

function unavailable(note) {
  return field(null, STATUS.UNAVAILABLE, [], note);
}

function uniqStrings(list) {
  return [...new Set(list.filter(Boolean))];
}

function collectSources(results) {
  const byUrl = new Map();
  for (const r of results) {
    if (!r?.url || byUrl.has(r.url)) continue;
    byUrl.set(r.url, {
      title: r.title ?? r.url,
      url: r.url,
      publishedDate: r.publishedDate ?? null,
    });
  }
  return [...byUrl.values()];
}

function highlightsByQuery(results, needle) {
  return results.filter((r) => typeof r?.query === "string" && r.query.includes(needle));
}

function allHighlights(results) {
  return results.flatMap((r) =>
    (r?.highlights ?? []).map((h) => ({ text: collapse(h), url: r.url, date: r.publishedDate ?? null }))
  );
}

/**
 * Explicit employee counts only. Never guesses from general text.
 * Matches ranges ("11-50 employees") and counts ("500+ employees").
 */
export function extractEmployeeSize(highlights) {
  const rangeRe = /(\d[\d,]*)\s*(?:-|–|to)\s*(\d[\d,]*)\s*(?:\+)?\s*employees/i;
  const countRe = /(\d[\d,]*)\s*\+?\s*employees/i;

  for (const h of highlights) {
    const range = h.text.match(rangeRe);
    if (range) {
      return { value: `${range[1]}-${range[2]} employees`, sourceUrl: h.url };
    }
    const count = h.text.match(countRe);
    if (count) {
      return { value: `${count[1]}+ employees`, sourceUrl: h.url };
    }
  }
  return null;
}

export function classifyGrowthSignals(results) {
  const signals = [];
  const seen = new Set();

  for (const h of allHighlights(results)) {
    if (!h.text) continue;
    for (const rule of GROWTH_RULES) {
      if (!rule.patterns.some((re) => re.test(h.text))) continue;
      const key = `${rule.type}|${h.url}|${h.text}`;
      if (seen.has(key)) continue;
      seen.add(key);
      signals.push({
        type: rule.type,
        summary: truncate(h.text, 300),
        date: h.date,
        sourceUrl: h.url,
      });
    }
  }
  return signals;
}

function buildGtmOpportunity(signals, descriptionSources, objective) {
  const usedTypes = uniqStrings(signals.map((s) => s.type));
  const usedSources = uniqStrings(signals.map((s) => s.sourceUrl));
  const sentences = [];

  if (usedTypes.includes("funding")) sentences.push("Recent funding signals suggest budget for new tooling and teams.");
  if (usedTypes.includes("hiring")) sentences.push("Active hiring signals suggest growing teams that need enablement.");
  if (usedTypes.includes("expansion")) sentences.push("Expansion signals suggest new markets or locations to support.");
  if (usedTypes.includes("launch")) sentences.push("Recent launches suggest active product momentum worth timing outreach around.");
  if (objective) sentences.push(`Research objective to address: ${collapse(objective)}.`);
  if (sentences.length === 0) {
    sentences.push("No concrete growth signals surfaced; opportunity is limited to the public company overview.");
  }

  return field(
    sentences.join(" "),
    STATUS.INFERRED,
    usedSources.length > 0 ? usedSources : descriptionSources,
    `Based on ${usedTypes.length > 0 ? `signals: ${usedTypes.join(", ")}` : "public overview only"}`
  );
}

export function normalizeCompanyReport({ research = {}, enrichment = {}, query = {} } = {}, { now } = {}) {
  const results = Array.isArray(research.results) ? research.results : [];
  const warnings = Array.isArray(research.warnings) ? [...research.warnings] : [];
  const sources = collectSources(results);
  const sourceUrls = sources.map((s) => s.url);
  const allHighlightsList = allHighlights(results);

  const targetName = collapse(query.name);
  const domain = normalizeDomain(query.domain);
  const overviewResults = highlightsByQuery(results, "overview");
  const overviewHighlights = allHighlights(overviewResults.length > 0 ? overviewResults : results);

  const domainSource = domain
    ? sources.find((s) => s.url.toLowerCase().includes(domain.toLowerCase()))
    : null;

  // companyName — from input, corroborated by any Exa source.
  const nameSource = domainSource?.url ?? sourceUrls[0] ?? null;
  const companyName = targetName
    ? sourceUrls.length > 0
      ? field(targetName, STATUS.VERIFIED, [nameSource])
      : unavailable("no corroborating sources")
    : unavailable("not provided");

  // website — from input, verified only if a source URL contains the domain.
  const website =
    domain && domainSource
      ? field(domain, STATUS.VERIFIED, [domainSource.url])
      : domain
        ? unavailable("domain not found in research sources")
        : unavailable("not provided");

  // description — from explicit overview highlights.
  const descriptionText = overviewHighlights.map((h) => h.text).filter(Boolean);
  const description =
    descriptionText.length > 0
      ? field(
          truncate(descriptionText.join(" "), 600),
          STATUS.VERIFIED,
          uniqStrings(overviewHighlights.map((h) => h.url))
        )
      : unavailable("no overview text found");

  const isMock = enrichment?.isMock === true;
  const providerCompany = enrichment?.company ?? {};

  // industry — provider value only; mock is never provider-reported.
  let industry;
  if (isMock) {
    industry = unavailable("mock data");
  } else if (providerCompany.industry) {
    industry = field(providerCompany.industry, STATUS.PROVIDER, [], `source: ${enrichment.source}`);
  } else {
    industry = unavailable("no provider value");
  }

  // targetMarket — inferred from objective + overview text.
  const targetMarket =
    objectiveText(query.objective) || descriptionText.length > 0
      ? field(
          [
            objectiveText(query.objective)
              ? `Market focus from research objective: ${objectiveText(query.objective)}`
              : "Market inferred from the company overview",
            descriptionText.length > 0 ? truncate(descriptionText.join(" "), 200) : null,
          ]
            .filter(Boolean)
            .join(" — "),
          STATUS.INFERRED,
          uniqStrings(overviewHighlights.map((h) => h.url)),
          "reasoned from overview text and objective"
        )
      : unavailable("insufficient context");

  // employeeSize — explicit highlight or provider value only. Never inferred.
  let employeeSize;
  const explicitEmployees = extractEmployeeSize(allHighlightsList);
  if (isMock) {
    employeeSize = explicitEmployees
      ? field(explicitEmployees.value, STATUS.VERIFIED, [explicitEmployees.sourceUrl])
      : unavailable("mock data");
  } else if (providerCompany.employeeRange) {
    employeeSize = field(providerCompany.employeeRange, STATUS.PROVIDER, [], `source: ${enrichment.source}`);
  } else if (explicitEmployees) {
    employeeSize = field(explicitEmployees.value, STATUS.VERIFIED, [explicitEmployees.sourceUrl]);
  } else {
    employeeSize = unavailable("no explicit employee count found");
  }

  const growthSignals = classifyGrowthSignals(results);

  const gtmOpportunity = buildGtmOpportunity(
    growthSignals,
    uniqStrings(overviewHighlights.map((h) => h.url)),
    query.objective
  );

  // decisionMakers — provider contacts only. Never inferred from text.
  let decisionMakers = [];
  let contactInfo;
  if (isMock) {
    contactInfo = unavailable("mock data");
  } else if (Array.isArray(enrichment.contacts) && enrichment.contacts.length > 0) {
    decisionMakers = enrichment.contacts.map((c) => ({
      name: c.name ?? null,
      role: c.title ?? c.role ?? null,
      status: STATUS.PROVIDER,
      sourceUrl: Array.isArray(c.sourceUrls) ? c.sourceUrls[0] ?? null : null,
    }));
    contactInfo = field(
      enrichment.contacts
        .map((c) => [c.email, c.phone].filter(Boolean).join(" / "))
        .filter(Boolean)
        .join("; ") || null,
      STATUS.PROVIDER,
      uniqStrings(enrichment.contacts.flatMap((c) => c.sourceUrls ?? [])),
      `source: ${enrichment.source}`
    );
    if (contactInfo.value === null) {
      contactInfo = unavailable("provider returned no contact details");
    }
  } else {
    contactInfo = unavailable("no provider contacts");
  }

  if (isMock) {
    warnings.push("Enrichment data is mock; not treated as provider-reported.");
  }
  if (decisionMakers.length === 0) {
    warnings.push("No decision makers available; contacts are never inferred.");
  }

  const fields = { companyName, website, description, industry, targetMarket, employeeSize, gtmOpportunity };
  const missingFields = [
    ...FIELD_NAMES.filter((name) => fields[name].status === STATUS.UNAVAILABLE),
    ...(growthSignals.length === 0 ? ["growthSignals"] : []),
    ...(decisionMakers.length === 0 ? ["decisionMakers"] : []),
    ...(contactInfo.status === STATUS.UNAVAILABLE ? ["contactInfo"] : []),
  ];

  return {
    ...fields,
    growthSignals,
    decisionMakers,
    contactInfo,
    sources,
    missingFields,
    warnings,
    generatedAt: now ?? new Date().toISOString(),
  };
}

function objectiveText(objective) {
  return collapse(objective) || null;
}

export default normalizeCompanyReport;
