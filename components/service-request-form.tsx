'use client';

import { useMemo, useState, useTransition } from 'react';
import { SERVICE_CATALOG } from '@/lib/catalog';

type FormState = {
  name: string;
  phone: string;
  city: string;
  serviceId: number;
  description: string;
};

const initialState: FormState = {
  name: '',
  phone: '',
  city: '',
  serviceId: SERVICE_CATALOG[0]?.id ?? 1,
  description: ''
};

export function ServiceRequestForm() {
  const [form, setForm] = useState<FormState>(initialState);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const services = useMemo(() => SERVICE_CATALOG, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(form)
      });

      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setError(payload.error ?? 'Failed to submit lead.');
        return;
      }

      setMessage(payload.message ?? 'Lead received and allocated successfully.');
      setForm(initialState);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name">
          <input
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-teal-600"
            placeholder="Enter customer name"
            required
          />
        </Field>
        <Field label="Phone">
          <input
            value={form.phone}
            onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-teal-600"
            placeholder="Phone number"
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="City">
          <input
            value={form.city}
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
            className="w-full rounded-xl border border-slate-300 px-3 py-2 outline-none ring-0 focus:border-teal-600"
            placeholder="City"
            required
          />
        </Field>
        <Field label="Service type">
          <select
            value={form.serviceId}
            onChange={(event) => setForm((current) => ({ ...current, serviceId: Number(event.target.value) }))}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none focus:border-teal-600"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          className="min-h-32 w-full rounded-xl border border-slate-300 px-3 py-2 outline-none focus:border-teal-600"
          placeholder="Short lead context"
        />
      </Field>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-teal-700 px-4 py-2 font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
        >
          {isPending ? 'Submitting...' : 'Submit lead'}
        </button>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}
