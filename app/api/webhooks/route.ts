import { Prisma } from '@prisma/client';
import { NextResponse } from 'next/server';
import { resetProviderQuotas } from '@/services/webhook-service';
import { webhookSchema } from '@/lib/validation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = webhookSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'Invalid webhook payload.',
        issues: parsed.error.flatten()
      },
      { status: 400 }
    );
  }

  try {
    const result = await resetProviderQuotas(parsed.data.eventId, parsed.data.payload);

    return NextResponse.json(
      {
        message: result.alreadyProcessed ? 'Webhook already processed.' : 'Provider quotas reset to 10.',
        eventId: result.eventId,
        alreadyProcessed: result.alreadyProcessed
      },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json(
        {
          message: 'Webhook already processed.',
          alreadyProcessed: true
        },
        { status: 200 }
      );
    }

    const message = error instanceof Error ? error.message : 'Unexpected server error.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
