import { useState } from "react";
import ResearchForm from "./components/ResearchForm.jsx";
import ReportView from "./components/ReportView.jsx";
import { runResearch } from "./api/research.js";

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
    <main className="mx-auto max-w-4xl space-y-6 p-6">
      <h1 className="text-3xl font-bold text-slate-900">Outmate GTM Research</h1>

      <ResearchForm onSubmit={handleSubmit} loading={loading} />

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">Researching… this can take a few seconds.</p>
      )}

      <ReportView report={report} />
    </main>
  );
}
