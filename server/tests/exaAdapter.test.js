import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

process.env.EXA_API_KEY = "test-key";

const { researchCompany } = await import("../src/providers/exa/exaAdapter.js");

const jsonResponse = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });

function mockFetch(impl) {
  const fn = vi.fn(impl);
  vi.stubGlobal("fetch", fn);
  return fn;
}

beforeEach(() => {
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("researchCompany error mapping", () => {
  it("returns [] (not an error) when Exa returns no results", async () => {
    mockFetch(async () => jsonResponse({ results: [] }));

    const out = await researchCompany({ name: "Acme", domain: "acme.com" });

    expect(out.results).toEqual([]);
    expect(out.warnings).toEqual([]);
  });

  it("maps 401 to PROVIDER_AUTH", async () => {
    mockFetch(async () => new Response("unauthorized", { status: 401 }));

    const out = await researchCompany({ name: "Acme", domain: "acme.com" });

    expect(out.results).toEqual([]);
    expect(out.warnings).toHaveLength(5);
    expect(out.warnings.every((w) => w.code === "PROVIDER_AUTH")).toBe(true);
  });

  it("retries 429 (max 2 retries) then surfaces PROVIDER_RATE_LIMIT", async () => {
    const fetchMock = mockFetch(
      async () => new Response("rate limited", { status: 429, headers: { "retry-after": "0" } })
    );

    const out = await researchCompany({ name: "Acme", domain: "acme.com" });

    expect(fetchMock).toHaveBeenCalledTimes(15); // 5 queries x 3 attempts
    expect(out.results).toEqual([]);
    expect(out.warnings.every((w) => w.code === "PROVIDER_RATE_LIMIT")).toBe(true);
  });

  it("maps a timeout to PROVIDER_TIMEOUT", async () => {
    mockFetch(async () => {
      throw Object.assign(new Error("aborted"), { name: "AbortError" });
    });

    const out = await researchCompany({ name: "Acme", domain: "acme.com" });

    expect(out.results).toEqual([]);
    expect(out.warnings.length).toBe(5);
    expect(out.warnings.every((w) => w.code === "PROVIDER_TIMEOUT")).toBe(true);
  });

  it("keeps other queries' results when one query fails", async () => {
    mockFetch(async (url, options) => {
      const body = JSON.parse(options.body);
      if (body.query.includes("funding")) {
        return new Response("server error", { status: 500, headers: { "retry-after": "0" } });
      }
      return jsonResponse({
        results: [
          {
            url: `https://example.com/${body.query.length}`,
            title: "Result",
            publishedDate: null,
            highlights: ["highlight"],
          },
        ],
      });
    });

    const out = await researchCompany({ name: "Acme", domain: "acme.com" });

    expect(out.results.length).toBeGreaterThan(0);
    expect(out.warnings).toHaveLength(1);
    expect(out.warnings[0].code).toBe("PROVIDER_ERROR");
    expect(out.results.every((r) => r.url && Array.isArray(r.highlights))).toBe(true);
  });
});
