# Lead Distribution System

Production-oriented mini lead distribution platform built with Next.js 15, TypeScript, Tailwind CSS, PostgreSQL, Prisma, and Server-Sent Events for live dashboard refreshes.

## What it does

- Accepts public lead submissions at `/request-service`.
- Stores each lead in PostgreSQL with a unique `(serviceId, phone)` constraint.
- Assigns each accepted lead to exactly 3 providers.
- Enforces mandatory provider rules per service.
- Uses persistent, DB-backed round-robin allocation for fair provider selection.
- Respects monthly provider quotas with transactional row-level locking.
- Exposes a live dashboard at `/dashboard`.
- Includes test utilities for webhook idempotency and concurrent lead generation at `/test-tools`.

## Architecture

- `prisma/schema.prisma` defines `Service`, `Provider`, `Lead`, `LeadAssignment`, `AllocationState`, and `WebhookEvent`.
- `services/allocation.ts` performs the allocation inside a Prisma transaction with locked rows.
- `services/lead-service.ts` creates the lead, assigns providers, and publishes realtime updates.
- `services/webhook-service.ts` resets quotas through an idempotent webhook event flow.
- `app/api/events/route.ts` streams Server-Sent Events to connected dashboards.

## Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL`.
2. Install dependencies:

```bash
npm install
```

3. Generate the Prisma client and seed the database:

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

4. Start the app:

```bash
npm run dev
```

## Database model notes

- Lead deduplication is enforced at the database level with `@@unique([serviceId, phone])`.
- Provider quota state lives in `Provider.quotaConsumedThisMonth` and is reset only through the webhook path.
- `AllocationState.nextPointer` persists the round-robin position for each service.
- Lead assignments are uniquely constrained by `(leadId, providerId)`.

## API routes

- `POST /api/leads` - submit a lead.
- `GET /api/dashboard` - fetch dashboard data.
- `GET /api/events` - subscribe to realtime updates.
- `POST /api/webhooks` - idempotent quota reset webhook.
- `POST /api/test-tools/concurrent-leads` - generate concurrent leads for stress testing.

## Webhook idempotency

The webhook endpoint requires an `eventId`. Reusing the same `eventId` does not reapply the quota reset. The event is stored in `WebhookEvent` and guarded by a unique constraint.

## Concurrency safety

- Allocation runs inside a serializable Prisma transaction.
- The service allocation row and participating provider rows are locked with `FOR UPDATE`.
- Provider quota increments happen in the same transaction as lead assignment creation.
- Round-robin pointer updates are committed atomically.

## Docker

Run the app and PostgreSQL with:

```bash
docker compose up --build
```
