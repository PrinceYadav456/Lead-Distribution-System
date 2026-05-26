import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { withTransactionRetry } from '@/lib/transaction';
import { publishRealtimeEvent } from '@/services/realtime';

export async function resetProviderQuotas(eventId: string, payload: Record<string, unknown>) {
  const result = await withTransactionRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const existingEvent = await tx.webhookEvent.findUnique({ where: { eventId } });

        if (existingEvent?.status === 'PROCESSED') {
          return { alreadyProcessed: true as const, eventId };
        }

        const webhookEvent = existingEvent
          ? existingEvent
          : await tx.webhookEvent.create({
              data: {
                eventId,
                eventType: 'RESET_QUOTAS',
                payload: payload as Prisma.InputJsonValue,
                status: 'RECEIVED'
              }
            });

        if (webhookEvent.status === 'PROCESSED') {
          return { alreadyProcessed: true as const, eventId };
        }

        await tx.provider.updateMany({
          data: {
            quotaConsumedThisMonth: 0
          }
        });

        await tx.webhookEvent.update({
          where: { eventId },
          data: {
            status: 'PROCESSED',
            processedAt: new Date()
          }
        });

        return { alreadyProcessed: false as const, eventId };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )
  );

  publishRealtimeEvent({
    type: 'quota.reset',
    eventId
  });

  return result;
}
