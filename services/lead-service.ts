import { Prisma } from '@prisma/client';
import { normalizePhone } from '@/lib/phone';
import { leadCreateSchema } from '@/lib/validation';
import { prisma } from '@/lib/prisma';
import { withTransactionRetry } from '@/lib/transaction';
import { AllocationError } from '@/services/errors';
import { allocateLeadAssignments } from '@/services/allocation';
import { publishRealtimeEvent } from '@/services/realtime';

export type CreateLeadInput = {
  name: string;
  phone: string;
  city: string;
  serviceId: number;
  description?: string;
};

export async function createLeadAndAssign(input: CreateLeadInput) {
  const parsed = leadCreateSchema.parse(input);
  const normalizedPhone = normalizePhone(parsed.phone);

  if (!normalizedPhone) {
    throw new Error('Phone number must contain at least one digit.');
  }

  const result = await withTransactionRetry(() =>
    prisma.$transaction(
      async (tx) => {
        const lead = await tx.lead.create({
          data: {
            serviceId: parsed.serviceId,
            name: parsed.name,
            phone: normalizedPhone,
            city: parsed.city,
            description: parsed.description ?? '',
            status: 'RECEIVED'
          }
        });

        try {
          const assignments = await allocateLeadAssignments(tx, lead.id, parsed.serviceId);

          const updatedLead = await tx.lead.update({
            where: { id: lead.id },
            data: {
              status: 'ASSIGNED',
              assignedAt: new Date(),
              allocationError: null
            },
            include: {
              service: true,
              assignments: {
                include: {
                  provider: true
                },
                orderBy: {
                  createdAt: 'asc'
                }
              }
            }
          });

          return {
            lead: updatedLead,
            assignments,
            assigned: true as const
          };
        } catch (error) {
          if (!(error instanceof AllocationError)) {
            throw error;
          }

          const updatedLead = await tx.lead.update({
            where: { id: lead.id },
            data: {
              status: 'ALLOCATION_FAILED',
              allocationError: error.message
            },
            include: {
              service: true,
              assignments: true
            }
          });

          return {
            lead: updatedLead,
            assignments: [],
            assigned: false as const,
            allocationError: error.message
          };
        }
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    )
  );

  if (result.assigned) {
    publishRealtimeEvent({
      type: 'lead.assigned',
      leadId: result.lead.id,
      serviceId: result.lead.serviceId
    });
  }

  publishRealtimeEvent({
    type: 'lead.created',
    leadId: result.lead.id,
    serviceId: result.lead.serviceId,
    status: result.assigned ? 'ASSIGNED' : 'ALLOCATION_FAILED'
  });

  return result;
}
