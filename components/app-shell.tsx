import Link from 'next/link';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-teal-700">Lead Distribution</p>
            <h1 className="text-lg font-semibold">Provider allocation system</h1>
          </div>
          <nav className="flex gap-4 text-sm font-medium text-slate-600">
            <Link href="/request-service" className="hover:text-slate-950">
              Request Service
            </Link>
            <Link href="/dashboard" className="hover:text-slate-950">
              Dashboard
            </Link>
            <Link href="/test-tools" className="hover:text-slate-950">
              Test Tools
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
