# Product Research — Phase 1

Scope: a short competitive review to inform the first Outmate GTM prototype. Only claim
what can be observed on public pages; anything unverified is marked `TODO(verify)`.

Reference products:
1. Orange Slice — https://www.orangeslice.ai/
2. Second reference product — `TODO(verify)` (pick and capture here)

---

## 1. Products reviewed

### Orange Slice
- Website: https://www.orangeslice.ai/
- Positioning (from site): "Automate any sales task with AI" — find customers, enrich
  them, and build revenue workflows. Markets itself to "5,000+ sales and RevOps teams".
- Shape: a spreadsheet-like canvas where each column is an AI agent, plus natural-language
  lead search. Also exposed through Slack.
- Funding note: site links a Business Insider story about a $5.3M seed round.
  `TODO(verify)` the round details independently.
- Public data providers listed: OpenAI, Google Maps, Firecrawl, PredictLeads, Apify,
  BetterContact, FullEnrich, BuiltWith.
- Integrations listed: Salesforce, HubSpot, Attio, Instantly, HeyReach, Gmail, Slack.

### Product 2 (placeholder)
- Name / URL: `TODO(verify)`
- Positioning: `TODO(verify)`
- Shape: `TODO(verify)`
- Notes: `TODO(verify)`

---

## 2. Problem each solves

### Orange Slice
- Manual list-building is slow: sales/RevOps teams otherwise stitch together filters,
  saved searches, spreadsheets, and separate enrichment tools.
- Data goes stale: static, pre-scraped databases age poorly, so teams want live lookups.
- Workflow breakage: "workflows that actually survive real-world complexity" — the pain
  is brittle automation when real data is messy.
- Concentration: replace "build a list + enrich + push to CRM/sequence" point tools with
  one prompt-driven flow.

### Product 2
- `TODO(verify)`

---

## 3. How a search starts & what inputs

### Orange Slice
- Primary input is **natural language**, e.g. "Find me 50 Series A fintech companies in
  NYC that just hired a Head of Sales".
- Filters can be expressed as plain-English criteria that map to columns, e.g.
  "SaaS companies with over 200 employees that use Salesforce".
- Enrichment flow can also start from an **uploaded list**: paste CSV, connect a Google
  Sheet, or describe companies to enrich.
- Table view: add columns as natural-language prompts ("Add columns for annual revenue,
  CEO name, and what CRM they use").
- Slack: DM or @mention the app with a request and approve credit usage.
- Optional intent signals layered on top: recent funding, job postings, tech adoption,
  leadership changes, geographic expansion, news/social activity.

### Our prototype (intended)
- Inputs: company name + website/domain + optional research objective (single company).

### Product 2
- `TODO(verify)`

---

## 4. How companies/contacts are discovered

### Orange Slice
- Agent "searches across multiple data sources, cross-references results" from a
  natural-language ICP.
- Lead-generation use cases are built from sources such as conferences, VC portfolios,
  funding news, and local business data.
- Contact discovery spans LinkedIn, X, Instagram, TikTok, and YouTube for social use cases.
- BuiltWith-style tech detection and PredictLeads-style signals feed tech/signal targeting.
- Exact source list, coverage, and freshness guarantees: `TODO(verify)`.

### Product 2
- `TODO(verify)`

---

## 5. How enrichment works

### Orange Slice
- Every column is an AI agent that "browses the web and pulls live data"; a fleet of
  agents enriches rows in parallel.
- Enrichment fields claimed: firmographics (revenue, headcount, industry, HQ, founding
  year), technographics (CRM, marketing automation, analytics, cloud infra), contact data
  (work emails, direct dials), and social/intent signals.
- Contact data is described as sourced from multiple waterfall providers for coverage.
- Live sources mentioned: LinkedIn, company websites, job boards, SEC filings, news/press,
  tech detection, email verification, phone verification.
- Action columns can then push data: CRM sync, outbound sequences, send email.
- Verification method for "verified" contacts: `TODO(verify)`.

### Our prototype (intended)
- Enrichment through a swappable provider adapter (MoltSets/Moldset), with a mock fallback
  when the provider is unavailable.
- Every field is normalized to a fixed schema with a status
  (`verified` | `provider-reported` | `inferred` | `unavailable`) and source URLs.
- Never fabricate employee counts, funding, contacts, or buying intent.

### Product 2
- `TODO(verify)`

---

## 6. How results are displayed / filtered / exported

### Orange Slice
- Displayed as a spreadsheet/table: one row per company, columns per data field/agent.
- Filtering is done via natural-language criteria and intent signals; multi-criteria
  filtering is advertised.
- Export: push to Google Sheets, HubSpot, Salesforce, or download as CSV.
- Progress/state is visible per row (e.g. "searching…", "running…", "queued").

### Our prototype (intended)
- A React report page for a single company, with sources shown next to each data point.
- `TODO(verify)` export/filter needs for the prototype scope.

### Product 2
- `TODO(verify)`

---

## 7. Agents vs workflows vs spreadsheet UI

- **Spreadsheet UI**: rows = records (companies/people), columns = fields or agent prompts.
  Familiar for RevOps, easy to scan, and the export surface. Orange Slice's core canvas.
- **Agents**: a natural-language prompt bound to a column; the agent researches and fills
  each cell. Enables parallel enrichment and "add a column, describe what you need".
- **Workflows**: multi-step automation that chains search → enrich → action (CRM sync,
  sequence enrollment, email), ideally robust to messy real-world data.
- Orange Slice's own blog argues for **code-based subagent orchestration** over pure
  no-code visual builders or fully autonomous agents (`TODO(verify)` read the full post).
- Trade-offs for our prototype: a spreadsheet UI shines for bulk lists; for a single-company
  deep report, a structured report view communicates sources and statuses more clearly.

### Product 2
- `TODO(verify)`

---

## 8. Feature comparison

| Feature | Orange Slice | Product 2 | Our prototype |
| --- | --- | --- | --- |
| Primary search input | Natural-language ICP prompt | `TODO(verify)` | Company name + domain + optional objective |
| Unit of work | Bulk list / spreadsheet | `TODO(verify)` | Single-company research report |
| Discovery sources | Multi-source web + LinkedIn/social | `TODO(verify)` | Exa web research |
| Enrichment | Firmographics, technographics, contacts | `TODO(verify)` | Provider adapter (MoltSets/Moldset) + mock fallback |
| Contact data | Work emails, direct dials (waterfall) | `TODO(verify)` | Only if provider/key available; else `unavailable` |
| Buying-intent signals | Funding, hiring, tech, social | `TODO(verify)` | Not fabricated; status-tagged only |
| Field provenance | Not specified on site | `TODO(verify)` | `verified`/`provider-reported`/`inferred`/`unavailable` + source URLs |
| Results UI | Spreadsheet / columns-as-agents | `TODO(verify)` | React report page with sources |
| Filtering | NLP + intent signals | `TODO(verify)` | `TODO(verify)` (out of first scope) |
| Export | Google Sheets, HubSpot, Salesforce, CSV | `TODO(verify)` | `TODO(verify)` (out of first scope) |
| Integrations | Salesforce, HubSpot, Attio, Instantly, Gmail, Slack | `TODO(verify)` | None (prototype) |
| Data freshness model | Live web pulls | `TODO(verify)` | Exa live web results per request |
| Pricing / free tier | See /pricing | `TODO(verify)` | Free tiers only |

---

## 9. Recommendation for the first prototype

Build a **single-company research report** first. Reasons:

- The assignment's core flow is already single-company (name + domain + objective), so a
  report view matches the actual deliverable instead of forcing a bulk-list abstraction.
- Provenance is the differentiator: a report view has room to show each field's
  `status` and `source URLs`, which is central to the no-fabrication rule and harder to
  surface cleanly in a dense spreadsheet grid.
- It exercises every hard part end-to-end (Exa research → provider adapter → normalize →
  status-tagged schema → UI) at small scale, so the same schema can later feed a bulk/
  spreadsheet view.
- Bulk list-building, filtering, and export are large surfaces with weak free-tier
  coverage; deferring them avoids paid calls and scope creep.

Design the normalized JSON schema and provider adapter interface as if a future
spreadsheet/bulk mode will consume them, so the single-company report is a clean first
slice rather than a dead end.

`TODO(verify)`: confirm with the assignment brief that bulk/list features are out of
scope for the first prototype.
