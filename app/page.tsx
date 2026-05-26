import Link from 'next/link';

export default function HomePage() {
  return (
    <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
      <div className="max-w-2xl space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Lead Distribution System</p>
        <h2 className="text-3xl font-semibold tracking-tight text-slate-900">A concurrency-safe provider allocation workflow.</h2>
        <p className="text-slate-600">
          Submit leads, inspect live assignments, and exercise webhook idempotency with database-backed round-robin allocation.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/request-service" className="rounded-xl bg-teal-700 px-4 py-2 font-semibold text-white">
          Request Service
        </Link>
        <Link href="/dashboard" className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-900">
          Open Dashboard
        </Link>
        <Link href="/test-tools" className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-900">
          Test Tools
        </Link>
      </div>
    </section>
  );
}
