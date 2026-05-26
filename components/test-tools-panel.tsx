'use client';

import { useMemo, useState, useTransition } from 'react';
import { SERVICE_CATALOG } from '@/lib/catalog';

type LogEntry = {
  title: string;
  detail: string;
};

export function TestToolsPanel() {
  const [serviceId, setServiceId] = useState<number>(SERVICE_CATALOG[0]?.id ?? 1);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPending, startTransition] = useTransition();

  const services = useMemo(() => SERVICE_CATALOG, []);

  function appendLog(title: string, detail: string) {
    setLogs((current) => [{ title, detail }, ...current].slice(0, 8));
  }

  async function resetQuotas() {
    const eventId = `reset-${Date.now()}`;
    const response = await fetch('/api/webhooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventId, action: 'RESET_QUOTAS', payload: { source: 'test-tools' } })
    });

    const payload = (await response.json()) as { message?: string; error?: string };
    appendLog('Reset quotas', payload.message ?? payload.error ?? 'Completed');
  }

  async function simulateWebhookMultipleTimes() {
    const eventId = `dup-reset-${Date.now()}`;
    const payload = { eventId, action: 'RESET_QUOTAS', payload: { source: 'test-tools-repeat' } };

    const results = await Promise.all(
      [1, 2].map(async () => {
        const response = await fetch('/api/webhooks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        return (await response.json()) as { message?: string; alreadyProcessed?: boolean; error?: string };
      })
    );

    appendLog('Webhook replay', results.map((result) => result.message ?? result.error ?? 'ok').join(' | '));
  }

  async function generateConcurrentLeads() {
    const response = await fetch('/api/test-tools/concurrent-leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serviceId, count: 10 })
    });

    const payload = (await response.json()) as { message?: string; error?: string };
    appendLog('Concurrent leads', payload.message ?? payload.error ?? 'Completed');
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold">Test tools</h2>
        <p className="mt-1 text-sm text-slate-500">Webhook idempotency and concurrency checks.</p>

        <label className="mt-4 grid gap-2 text-sm font-medium text-slate-700">
          Service for concurrent leads
          <select
            value={serviceId}
            onChange={(event) => setServiceId(Number(event.target.value))}
            className="rounded-xl border border-slate-300 bg-white px-3 py-2"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </label>

        <div className="mt-4 grid gap-3">
          <button
            onClick={() => startTransition(resetQuotas)}
            disabled={isPending}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Reset provider quotas to 10
          </button>
          <button
            onClick={() => startTransition(simulateWebhookMultipleTimes)}
            disabled={isPending}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-900 disabled:opacity-60"
          >
            Simulate webhook multiple times
          </button>
          <button
            onClick={() => startTransition(generateConcurrentLeads)}
            disabled={isPending}
            className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            Generate 10 concurrent leads instantly
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
        <h2 className="text-lg font-semibold">Execution log</h2>
        <div className="mt-4 space-y-3">
          {logs.length === 0 ? <p className="text-sm text-slate-500">No actions yet.</p> : null}
          {logs.map((entry, index) => (
            <div key={`${entry.title}-${index}`} className="rounded-xl bg-slate-50 p-4">
              <div className="font-medium text-slate-900">{entry.title}</div>
              <div className="text-sm text-slate-600">{entry.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
