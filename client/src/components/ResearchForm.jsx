import { useState } from "react";

export default function ResearchForm({ onSubmit, loading }) {
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");
  const [objective, setObjective] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    if (loading) return;
    onSubmit({
      name: name.trim() || undefined,
      domain: domain.trim() || undefined,
      objective: objective.trim() || undefined,
    });
  }

  const inputClass =
    "w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-slate-100";

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Company name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Stripe"
            disabled={loading}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Website / domain
          </label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="e.g. stripe.com"
            disabled={loading}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Research objective <span className="text-slate-400">(optional)</span>
        </label>
        <textarea
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="What do you want to find out?"
          disabled={loading}
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={loading || (!name.trim() && !domain.trim())}
        className="mt-4 inline-flex items-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Researching…" : "Research company"}
      </button>
    </form>
  );
}
