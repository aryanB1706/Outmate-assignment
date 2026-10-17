import { useState } from "react";
import ResearchForm from "./components/ResearchForm.jsx";
import ReportView from "./components/ReportView.jsx";
import { runResearch } from "./api/research.js";

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
      aria-hidden="true"
    />
  );
}

function LoadingState() {
  return (
    <div className="space-y-4" aria-busy="true">
      <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <Spinner />
        Researching via Exa…
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div className="mb-3 h-4 w-1/3 rounded bg-slate-200" />
            <div className="mb-2 h-3 w-full rounded bg-slate-100" />
            <div className="h-3 w-2/3 rounded bg-slate-100" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <p className="text-sm text-slate-500">
        Enter a company name or website above to generate a sourced research report.
      </p>
    </div>
  );
}

export default function App() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(input) {
    setLoading(true);
    setError(null);
    try {
      const data = await runResearch(input);
      setReport(data);
    } catch (err) {
      setReport(null);
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
        Outmate GTM Research
      </h1>

      <ResearchForm onSubmit={handleSubmit} loading={loading} />

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          <span className="break-words">{error}</span>
          <button
            type="button"
            onClick={() => setError(null)}
            className="shrink-0 rounded px-2 text-red-700 hover:bg-red-100"
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {loading && <LoadingState />}

      {!loading && !error && report && <ReportView report={report} />}

      {!loading && !error && !report && <EmptyState />}
    </main>
  );
}
