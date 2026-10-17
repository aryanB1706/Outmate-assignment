import { useState } from "react";

const STATUS_STYLES = {
  verified: "bg-green-100 text-green-800 border-green-200",
  "provider-reported": "bg-blue-100 text-blue-800 border-blue-200",
  inferred: "bg-amber-100 text-amber-800 border-amber-200",
  unavailable: "bg-slate-100 text-slate-600 border-slate-200",
};

const STATUS_LABELS = {
  verified: "verified",
  "provider-reported": "provider-reported",
  inferred: "inferred",
  unavailable: "unavailable",
};

const FIELD_ORDER = [
  { key: "companyName", label: "Company" },
  { key: "website", label: "Website" },
  { key: "description", label: "Description" },
  { key: "industry", label: "Industry" },
  { key: "targetMarket", label: "Target market" },
  { key: "employeeSize", label: "Employee size" },
  { key: "gtmOpportunity", label: "GTM opportunity" },
  { key: "contactInfo", label: "Contact info" },
];

function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toLocaleDateString();
}

function detectMock(report) {
  if (!report) return false;
  const warningText = (report.warnings ?? []).join(" ");
  if (/mock/i.test(warningText)) return true;
  return FIELD_ORDER.some(({ key }) => report?.[key]?.note === "mock data");
}

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.unavailable;
  const label = STATUS_LABELS[status] ?? status ?? "unavailable";
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap ${style}`}
    >
      {label}
    </span>
  );
}

function SourceLinks({ sources }) {
  if (!sources || sources.length === 0) {
    return <span className="text-xs text-slate-400">No sources</span>;
  }
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1">
      {sources.map((url) => (
        <li key={url} className="max-w-full">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-xs text-blue-600 underline hover:text-blue-800"
          >
            {domainOf(url)}
          </a>
        </li>
      ))}
    </ul>
  );
}

function FieldCard({ label, field }) {
  const value =
    field?.value === null || field?.value === undefined || field?.value === ""
      ? null
      : field.value;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        <StatusBadge status={field?.status} />
      </div>
      {value ? (
        <p className="whitespace-pre-line break-words text-sm text-slate-800">{value}</p>
      ) : (
        <p className="text-sm italic text-slate-400">
          {field?.note ? `Unavailable — ${field.note}` : "Unavailable"}
        </p>
      )}
      <div className="mt-3">
        <SourceLinks sources={field?.sources} />
      </div>
    </div>
  );
}

function GrowthSignals({ signals }) {
  if (!signals || signals.length === 0) {
    return <p className="text-sm italic text-slate-400">No growth signals found.</p>;
  }
  return (
    <ul className="divide-y divide-slate-100">
      {signals.map((signal, index) => (
        <li key={index} className="flex flex-col gap-1 py-3">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium capitalize text-slate-700">
              {signal.type}
            </span>
            <span className="text-xs text-slate-500">
              {formatDate(signal.date) ?? "date unknown"}
            </span>
          </div>
          <p className="break-words text-sm text-slate-800">{signal.summary}</p>
          {signal.sourceUrl && (
            <a
              href={signal.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="truncate text-xs text-blue-600 underline hover:text-blue-800"
            >
              {domainOf(signal.sourceUrl)}
            </a>
          )}
        </li>
      ))}
    </ul>
  );
}

function DecisionMakers({ makers }) {
  if (!makers || makers.length === 0) {
    return <p className="text-sm italic text-slate-400">No decision makers available.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
            <th className="py-2 pr-4 font-medium">Name</th>
            <th className="py-2 pr-4 font-medium">Role</th>
            <th className="py-2 pr-4 font-medium">Status</th>
            <th className="py-2 font-medium">Source</th>
          </tr>
        </thead>
        <tbody>
          {makers.map((maker, index) => (
            <tr key={index} className="border-b border-slate-100">
              <td className="py-2 pr-4 text-slate-800">{maker.name || "—"}</td>
              <td className="py-2 pr-4 text-slate-800">{maker.role || "—"}</td>
              <td className="py-2 pr-4">
                <StatusBadge status={maker.status} />
              </td>
              <td className="py-2">
                {maker.sourceUrl ? (
                  <a
                    href={maker.sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-blue-600 underline hover:text-blue-800"
                  >
                    {domainOf(maker.sourceUrl)}
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function MissingInfo({ report }) {
  const missing = report.missingFields ?? [];
  const warnings = report.warnings ?? [];
  if (missing.length === 0 && warnings.length === 0) {
    return null;
  }
  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-amber-900">
        Missing / uncertain information
      </h3>
      {missing.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Fields
          </p>
          <ul className="mt-1 flex flex-wrap gap-2">
            {missing.map((name) => (
              <li
                key={name}
                className="rounded-full border border-amber-300 bg-white px-2 py-0.5 text-xs text-amber-800"
              >
                {name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
            Warnings
          </p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {warnings.map((warning, index) => (
              <li key={index} className="break-words">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ReportView({ report }) {
  const [copied, setCopied] = useState(false);

  if (!report) return null;

  const json = JSON.stringify(report, null, 2);
  const mockUsed = detectMock(report);
  const generatedAt = report.generatedAt
    ? new Date(report.generatedAt).toLocaleString()
    : null;
  const filename = `${(report.companyName?.value || "report")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.json`;

  function handleDownload() {
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(json);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="space-y-6">
      <header className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold break-words text-slate-900">
              {report.companyName?.value || "Unknown company"}
            </h2>
            {report.website?.value && (
              <a
                href={`https://${report.website.value}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-blue-600 underline hover:text-blue-800"
              >
                {report.website.value}
              </a>
            )}
            {generatedAt && (
              <p className="mt-2 text-xs text-slate-400">Generated {generatedAt}</p>
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleDownload}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700"
            >
              Download JSON
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
            >
              {copied ? "Copied!" : "Copy JSON"}
            </button>
          </div>
        </div>
      </header>

      {mockUsed && (
        <div
          role="status"
          className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
        >
          Enrichment provider is not integrated — mock/placeholder enrichment data was
          used and is never shown as provider-reported.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELD_ORDER.map(({ key, label }) => (
          <FieldCard key={key} label={label} field={report[key]} />
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-slate-800">Growth signals</h3>
        <GrowthSignals signals={report.growthSignals} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-slate-800">Decision makers</h3>
        <DecisionMakers makers={report.decisionMakers} />
      </div>

      <MissingInfo report={report} />

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-2 text-lg font-semibold text-slate-800">Sources</h3>
        {report.sources?.length > 0 ? (
          <ul className="divide-y divide-slate-100">
            {report.sources.map((source) => (
              <li key={source.url} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:gap-3">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-words text-sm text-blue-600 underline hover:text-blue-800"
                >
                  {source.title || source.url}
                </a>
                <span className="text-xs text-slate-500">
                  {domainOf(source.url)}
                  {formatDate(source.publishedDate) ? ` · ${formatDate(source.publishedDate)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-slate-400">No sources found.</p>
        )}
      </div>
    </section>
  );
}
