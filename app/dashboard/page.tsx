import { DashboardClient } from '@/components/dashboard-client';
import { getDashboardSnapshot } from '@/services/dashboard-service';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const initialSnapshot = await getDashboardSnapshot();

  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Provider dashboard</p>
        <h2 className="text-2xl font-semibold tracking-tight">Live quota and assignment view</h2>
        <p className="text-slate-600">Fetched from PostgreSQL and refreshed with SSE events after allocation changes.</p>
      </div>
      <DashboardClient initialSnapshot={initialSnapshot} />
    </div>
  );
}
