import { describe, it, expect } from "vitest";
import {
  normalizeCompanyReport,
  classifyGrowthSignals,
  extractEmployeeSize,
} from "../src/services/normalize.js";

const NOW = "2026-10-17T00:00:00.000Z";

const researchResults = [
  {
    url: "https://acme.com/about",
    title: "About Acme",
    publishedDate: null,
    highlights: ["Acme builds logistics software for retailers."],
    query: "Acme company overview: what they do, industry, product",
  },
  {
    url: "https://news.example.com/acme-series-b",
    title: "Acme raises Series B",
    publishedDate: "2026-01-01T00:00:00Z",
    highlights: ["Acme raised a $40M Series B to expand."],
    query: "Acme funding round, investors, valuation, growth news",
  },
  {
    url: "https://news.example.com/acme-hiring",
    title: "Acme hiring",
    publishedDate: "2026-02-01T00:00:00Z",
    highlights: ["Acme is hiring and now has 200 employees."],
    query: "Acme hiring, job openings, expansion, new office",
  },
];

const realEnrichment = {
  source: "moltsets",
  isMock: false,
  company: {
    industry: "Logistics Software",
    employeeRange: "51-200",
    headquarters: "Berlin",
    foundedYear: 2015,
  },
  contacts: [
    {
      name: "Dana Lee",
      title: "VP Sales",
      email: "dana@acme.com",
      sourceUrls: ["https://linkedin.com/in/danalee"],
    },
  ],
  meta: {},
};

const mockEnrichment = {
  source: "mock",
  isMock: true,
  company: {
    industry: "Sample Industry",
    employeeRange: "Unknown",
    headquarters: "Sample Location",
    foundedYear: null,
  },
  contacts: [],
  meta: { note: "Mock enrichment — real provider not integrated", fetchedAt: NOW },
};

function report(enrichment, query = { name: "Acme", domain: "acme.com" }) {
  return normalizeCompanyReport(
    { research: { results: researchResults, warnings: [] }, enrichment, query },
    { now: NOW }
  );
}

describe("normalizeCompanyReport status rules", () => {
  it("uses verified for Exa-backed fields", () => {
    const r = report(realEnrichment);
    expect(r.companyName.status).toBe("verified");
    expect(r.companyName.sources).toEqual(["https://acme.com/about"]);
    expect(r.website.status).toBe("verified");
    expect(r.description.status).toBe("verified");
    expect(r.description.sources.length).toBeGreaterThan(0);
  });

  it("uses provider-reported only for real provider values", () => {
    const r = report(realEnrichment);
    expect(r.industry).toMatchObject({ value: "Logistics Software", status: "provider-reported" });
    expect(r.employeeSize).toMatchObject({ value: "51-200", status: "provider-reported" });
    expect(r.decisionMakers).toHaveLength(1);
    expect(r.decisionMakers[0].status).toBe("provider-reported");
    expect(r.contactInfo.status).toBe("provider-reported");
  });

  it("marks gtmOpportunity inferred and cites the signals used", () => {
    const r = report(realEnrichment);
    expect(r.gtmOpportunity.status).toBe("inferred");
    expect(r.gtmOpportunity.sources).toContain("https://news.example.com/acme-series-b");
  });

  it("uses unavailable with null value when nothing backs a field", () => {
    const r = report(realEnrichment, { name: "Acme", domain: "nomatch.example" });
    expect(r.website.status).toBe("unavailable");
    expect(r.website.value).toBeNull();

    const noResearch = normalizeCompanyReport(
      { research: { results: [], warnings: [] }, enrichment: mockEnrichment, query: { name: "Acme" } },
      { now: NOW }
    );
    expect(noResearch.description.status).toBe("unavailable");
    expect(noResearch.companyName.status).toBe("unavailable");
  });
});

describe("mock data handling", () => {
  it("never treats mock enrichment as provider-reported", () => {
    const r = report(mockEnrichment);
    expect(r.industry.status).toBe("unavailable");
    expect(r.industry.note).toBe("mock data");
    expect(r.contactInfo.status).toBe("unavailable");
    expect(r.contactInfo.note).toBe("mock data");
    expect(r.decisionMakers).toEqual([]);
    expect(r.warnings).toContain("Enrichment data is mock; not treated as provider-reported.");
  });

  it("allows verified employee size from an explicit highlight even in mock mode", () => {
    const r = report(mockEnrichment);
    expect(r.employeeSize.status).toBe("verified");
    expect(r.employeeSize.sources).toEqual(["https://news.example.com/acme-hiring"]);
  });
});

describe("employee size is never inferred", () => {
  it("stays unavailable for vague text", () => {
    const vague = [
      {
        url: "https://acme.com/blog",
        title: "Blog",
        publishedDate: null,
        highlights: ["We are growing fast and the team is expanding."],
        query: "Acme company overview: what they do",
      },
    ];
    const r = normalizeCompanyReport(
      { research: { results: vague, warnings: [] }, enrichment: mockEnrichment, query: { name: "Acme" } },
      { now: NOW }
    );
    expect(r.employeeSize.status).toBe("unavailable");
    expect(r.employeeSize.value).toBeNull();
  });

  it("extractEmployeeSize only matches explicit counts", () => {
    expect(extractEmployeeSize([{ text: "team is growing", url: "u" }])).toBeNull();
    expect(extractEmployeeSize([{ text: "11-50 employees", url: "u" }])).toEqual({
      value: "11-50 employees",
      sourceUrl: "u",
    });
    expect(extractEmployeeSize([{ text: "about 500 employees worldwide", url: "u" }])).toEqual({
      value: "500+ employees",
      sourceUrl: "u",
    });
  });
});

describe("growth signal classification", () => {
  it("classifies raised / hiring / expands / launches with source and date", () => {
    const results = [
      {
        url: "https://a.com/1",
        publishedDate: "2026-01-01T00:00:00Z",
        highlights: ["Acme raised a Series B round of funding."],
      },
      {
        url: "https://a.com/2",
        publishedDate: "2026-02-01T00:00:00Z",
        highlights: ["Acme is hiring aggressively."],
      },
      {
        url: "https://a.com/3",
        publishedDate: null,
        highlights: ["Acme expands into Asia."],
      },
      {
        url: "https://a.com/4",
        publishedDate: null,
        highlights: ["Acme launches a new product."],
      },
    ];
    const signals = classifyGrowthSignals(results);
    const byType = Object.fromEntries(signals.map((s) => [s.type, s]));

    expect(Object.keys(byType).sort()).toEqual(["expansion", "funding", "hiring", "launch"]);
    expect(byType.funding.sourceUrl).toBe("https://a.com/1");
    expect(byType.funding.date).toBe("2026-01-01T00:00:00Z");
    expect(signals.every((s) => typeof s.summary === "string" && s.summary.length > 0)).toBe(true);
  });
});

describe("missingFields", () => {
  it("lists fields whose status is unavailable", () => {
    const r = report(mockEnrichment);
    expect(r.missingFields).toContain("industry");
    expect(r.missingFields).toContain("decisionMakers");
    expect(r.missingFields).toContain("contactInfo");
  });

  it("includes growthSignals when no signals are found", () => {
    const r = normalizeCompanyReport(
      {
        research: {
          results: [
            {
              url: "https://acme.com/about",
              title: "About",
              publishedDate: null,
              highlights: ["Acme builds logistics software."],
              query: "Acme company overview: what they do",
            },
          ],
          warnings: [],
        },
        enrichment: mockEnrichment,
        query: { name: "Acme" },
      },
      { now: NOW }
    );
    expect(r.missingFields).toContain("growthSignals");
  });
});
