import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../src/providers/exa/exaAdapter.js", () => ({
  researchCompany: vi.fn(),
}));

const { researchCompany } = await import("../src/providers/exa/exaAdapter.js");
const { runResearch, __clearCache } = await import("../src/services/researchService.js");

const exaResults = [
  {
    url: "https://acme.com/about",
    title: "About Acme",
    publishedDate: null,
    highlights: ["Acme builds logistics software."],
    query: "Acme company overview: what they do",
  },
];

beforeEach(() => {
  __clearCache();
  researchCompany.mockReset();
});

describe("runResearch", () => {
  it("continues with a warning when the enrichment provider throws", async () => {
    researchCompany.mockResolvedValue({ results: exaResults, warnings: [] });

    const report = await runResearch({ name: "Acme", domain: "fail.test" });

    expect(report.warnings.some((w) => String(w).includes("Enrichment unavailable"))).toBe(true);
    expect(report.industry.status).toBe("unavailable");
    expect(report.contactInfo.status).toBe("unavailable");
    expect(report.companyName.status).toBe("verified");
  });

  it("returns an all-unavailable report when both providers return nothing", async () => {
    researchCompany.mockResolvedValue({ results: [], warnings: [] });

    const report = await runResearch({ name: "Acme", domain: "acme.com" });

    expect(report.companyName.status).toBe("unavailable");
    expect(report.description.status).toBe("unavailable");
    expect(report.growthSignals).toEqual([]);
    expect(report.sources).toEqual([]);
    expect(report.missingFields.length).toBeGreaterThan(0);
    expect(typeof report.generatedAt).toBe("string");
  });

  it("keeps existing Exa results when enrichment is unavailable", async () => {
    researchCompany.mockResolvedValue({ results: exaResults, warnings: [] });

    const report = await runResearch({ name: "Acme", domain: "fail.test" });

    expect(report.sources).toHaveLength(1);
    expect(report.description.status).toBe("verified");
  });
});
