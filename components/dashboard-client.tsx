'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

type DashboardSnapshot = {
  services: Array<{ id: number; name: string; code: string; description: string | null }>;
  providers: Array<{
    id: number;
    code: string;
    name: string;
    monthlyQuota: number;
    quotaConsumedThisMonth: number;
    quotaRemaining: number;
    active: boolean;
    latestAssignments: Array<{
      id: number;
      leadId: string;
      serviceName: string;
      leadName: string;
      phone: string;
      city: string;
      assignmentKind: string;
      createdAt: string;
    }>;
  }>;
  allocationStates: Array<{ serviceId: number; nextPointer: number; version: number }>;
  recentLeads: Array<{
    id: string;
    serviceName: string;
    name: string;
    phone: string;
    city: string;
    status: string;
    allocationError: string | null;
    createdAt: string;
    assignments: Array<{ providerId: number; providerName: string; assignmentKind: string }>;
  }>;
};

export function DashboardClient({ initialSnapshot }: { initialSnapshot: DashboardSnapshot }) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [isRefreshing, startTransition] = useTransition();

  const refresh = useMemo(
    () => async () => {
      const response = await fetch('/api/dashboard', { cache: 'no-store' });
      if (!response.ok) {
        return;
      }

      const nextSnapshot = (await response.json()) as DashboardSnapshot;
      setSnapshot(nextSnapshot);
    },
    []
  );

  useEffect(() => {
    const source = new EventSource('/api/events');

    const handleUpdate = () => {
      startTransition(async () => {
        await refresh();
      });
    };

    source.addEventListener('lead.assigned', handleUpdate);
    source.addEventListener('lead.created', handleUpdate);
    source.addEventListener('quota.reset', handleUpdate);

    source.onerror = () => {
      source.close();
    };

    return () => {
      source.close();
    };
  }, [refresh, startTransition]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-3">
        {snapshot.providers.map((provider) => (
          <article key={provider.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">{provider.code}</p>
                <h3 className="text-lg font-semibold">{provider.name}</h3>
              </div>
              <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                {provider.quotaRemaining} remaining
              </span>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <Metric label="Assigned" value={provider.quotaConsumedThisMonth} />
              <Metric label="Monthly quota" value={provider.monthlyQuota} />
            </dl>
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Latest assignments</p>
              {provider.latestAssignments.length === 0 ? (
                <p className="text-sm text-slate-500">No assignments yet.</p>
              ) : (
                provider.latestAssignments.map((assignment) => (
                  <div key={assignment.id} className="rounded-xl bg-slate-50 px-3 py-2 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-slate-900">{assignment.leadName}</span>
                      <span className="text-xs text-slate-500">{assignment.assignmentKind}</span>
                    </div>
                    <p className="text-slate-600">
                      {assignment.serviceName} · {assignment.city} · {assignment.phone}
                    </p>
                  </div>
                ))
              )}
            </div>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Recent leads</h2>
            <p className="text-sm text-slate-500">Live feed from the database.</p>
          </div>
          {isRefreshing ? <span className="text-sm text-slate-500">Refreshing...</span> : null}
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3">Lead</th>
                <th className="px-4 py-3">Service</th>
                <th className="px-4 py-3">Assignments</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {snapshot.recentLeads.map((lead) => (
                <tr key={lead.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{lead.name}</div>
                    <div className="text-slate-500">
                      {lead.phone} · {lead.city}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{lead.serviceName}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {lead.assignments.length === 0
                      ? lead.allocationError ?? 'Pending'
                      : lead.assignments.map((assignment) => assignment.providerName).join(', ')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={lead.status === 'ASSIGNED' ? 'text-emerald-700' : 'text-rose-700'}>{lead.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-lg font-semibold text-slate-900">{value}</dd>
    </div>
  );
}
