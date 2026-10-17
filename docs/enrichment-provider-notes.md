# Enrichment Provider Notes

## Status (mock only)

The enrichment layer ships with a **mock provider only**. No real enrichment
service is contacted. `ENRICHMENT_MODE=mock` is the supported and default mode.

Files:
- `server/src/providers/enrichment/index.js` — `getEnrichmentProvider()`
- `server/src/providers/enrichment/mockAdapter.js` — working mock provider
- `server/src/providers/enrichment/moltsetsAdapter.js` — documented **stub**

## Why

MoltSets/Moldset is **not integrated** in this prototype. There is no provider
API access configured, and hard rules for the assignment forbid paid calls. The
stub exists so the interface is defined and a real integration can be added
later without touching callers.

## What the adapter contract is

`getEnrichmentProvider()` returns an object exposing:

```js
enrichCompany({ name, domain }) => Promise<{
  source: string,        // provider id, e.g. "mock"
  isMock: boolean,       // true when values are placeholders, not real data
  company: {
    industry: string|null,
    employeeRange: string|null,
    headquarters: string|null,
    foundedYear: number|null
  },
  contacts: Array<{
    name?: string|null,
    title?: string|null,
    email?: string|null,
    phone?: string|null,
    sourceUrls?: string[]
  }>,
  meta: { note?: string, fetchedAt: string } // fetchedAt is ISO 8601
}>
```

Errors must be surfaced as `AppError` with one of:
`PROVIDER_TIMEOUT` | `PROVIDER_RATE_LIMIT` | `PROVIDER_AUTH` | `PROVIDER_ERROR`.

## How to plug in a real provider

1. Create `server/src/providers/enrichment/<provider>Adapter.js` exporting
   `enrichCompany({ name, domain })` that returns the contract above. Put the
   real API call inside it, read any key from the **server** environment, and
   map provider failures to `AppError` codes. Do not fabricate values — return
   `null` for anything the provider omits.
2. Register the adapter in `server/src/providers/enrichment/index.js` (add it to
   the mode→adapter lookup) and return it when its mode is selected.
3. Set `ENRICHMENT_MODE=<provider>` in `server/.env` (and document the key name
   in `server/.env.example`, key left blank).

Until steps 1–3 are done, any mode other than `mock` warns and falls back to the
mock provider.

## How mock data is treated

- Mock results are always tagged `isMock: true` and `source: "mock"`. They must
  **never** be presented as `provider-reported` (or any verified status) in the
  normalized report.
- Mock `company` values are deliberately generic placeholders (e.g.
  `"Sample Industry"`, `"Sample Location"`, `employeeRange: "Unknown"`,
  `foundedYear: null`) so they cannot be mistaken for real facts about a company.
- `contacts` is **always** `[]`. The mock provider never generates names,
  emails, or phone numbers.
- Downstream normalization should treat every mock field as `unavailable` (or
  clearly marked as mock), with no source URLs.
