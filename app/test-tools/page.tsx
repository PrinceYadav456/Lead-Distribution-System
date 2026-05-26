import { TestToolsPanel } from '@/components/test-tools-panel';

export default function TestToolsPage() {
  return (
    <div className="space-y-6">
      <div className="max-w-2xl space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">Test tools</p>
        <h2 className="text-2xl font-semibold tracking-tight">Webhook and concurrency checks</h2>
        <p className="text-slate-600">Use these actions to validate idempotency, quota resets, and lock-safe concurrent lead allocation.</p>
      </div>
      <TestToolsPanel />
    </div>
  );
}
