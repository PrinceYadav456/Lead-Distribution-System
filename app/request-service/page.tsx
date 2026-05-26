import { ServiceRequestForm } from '@/components/service-request-form';

export default function RequestServicePage() {
  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Public form</p>
        <h2 className="text-2xl font-semibold tracking-tight">Submit a new lead</h2>
        <p className="text-slate-600">The lead is stored, assigned through a persistent round-robin allocator, and broadcast to the dashboard.</p>
      </div>
      <ServiceRequestForm />
    </div>
  );
}
