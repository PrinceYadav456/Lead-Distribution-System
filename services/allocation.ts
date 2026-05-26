import { Prisma } from '@prisma/client';
import { REQUIRED_ASSIGNMENTS_PER_LEAD, SERVICE_RULES } from '@/lib/catalog';
import { AllocationError } from '@/services/errors';

type TransactionClient = Prisma.TransactionClient;

type ProviderRow = {
  id: number;
  name: string;
  monthlyQuota: number;
  quotaConsumedThisMonth: number;
  active: boolean;
};

type AllocationStateRow = {
  id: number;
  serviceId: number;
  nextPointer: number;
  version: number;
};

export type CreatedAssignment = {
  providerId: number;
  assignmentKind: 'MANDATORY' | 'FAIR';
};

export async function allocateLeadAssignments(
  tx: TransactionClient,
  leadId: string,
  serviceId: number
): Promise<CreatedAssignment[]> {
  const rule = SERVICE_RULES[serviceId];
  if (!rule) {
    throw new AllocationError(`No allocation rule exists for service ${serviceId}.`);
  }

  const mandatoryProviderIds = [...new Set(rule.mandatoryProviderIds)];
  const fairProviderIds = [...new Set(rule.fairProviderIds)];
  const allParticipantIds = [...new Set([...mandatoryProviderIds, ...fairProviderIds])].sort((a, b) => a - b);

  const allocationState = await loadAllocationState(tx, serviceId);
  const providerRows = await tx.$queryRaw<ProviderRow[]>(Prisma.sql`
    SELECT id, name, "monthlyQuota", "quotaConsumedThisMonth", active
    FROM "Provider"
    WHERE id IN (${Prisma.join(allParticipantIds)})
    ORDER BY id ASC
    FOR UPDATE
  `);

  const providerById = new Map(providerRows.map((provider) => [provider.id, provider]));
  const selectedProviderIds = new Set<number>();
  const assignments: CreatedAssignment[] = [];

  for (const providerId of mandatoryProviderIds) {
    const provider = providerById.get(providerId);
    if (!provider || !provider.active) {
      throw new AllocationError(`Mandatory provider ${providerId} is unavailable for service ${serviceId}.`);
    }

    if (provider.quotaConsumedThisMonth >= provider.monthlyQuota) {
      throw new AllocationError(`Mandatory provider ${providerId} has exhausted quota.`);
    }

    selectedProviderIds.add(providerId);
    assignments.push({ providerId, assignmentKind: 'MANDATORY' });
  }

  const remainingSlots = REQUIRED_ASSIGNMENTS_PER_LEAD - assignments.length;
  if (remainingSlots < 0) {
    throw new AllocationError(`Service ${serviceId} has too many mandatory providers.`);
  }

  if (remainingSlots > 0) {
    const fairAssignments = pickFairAssignments({
      fairProviderIds,
      providerById,
      selectedProviderIds,
      pointer: allocationState.nextPointer,
      requiredCount: remainingSlots
    });

    assignments.push(...fairAssignments.assignments);

    await tx.allocationState.update({
      where: { serviceId },
      data: {
        nextPointer: fairAssignments.nextPointer,
        version: { increment: 1 }
      }
    });
  }

  if (assignments.length !== REQUIRED_ASSIGNMENTS_PER_LEAD) {
    throw new AllocationError(`Unable to assign exactly ${REQUIRED_ASSIGNMENTS_PER_LEAD} providers.`);
  }

  for (const assignment of assignments) {
    await tx.leadAssignment.create({
      data: {
        leadId,
        serviceId,
        providerId: assignment.providerId,
        assignmentKind: assignment.assignmentKind
      }
    });

    await tx.provider.update({
      where: { id: assignment.providerId },
      data: {
        quotaConsumedThisMonth: { increment: 1 }
      }
    });
  }

  return assignments;
}

async function loadAllocationState(tx: TransactionClient, serviceId: number): Promise<AllocationStateRow> {
  const [allocationState] = await tx.$queryRaw<AllocationStateRow[]>(Prisma.sql`
    SELECT id, "serviceId", "nextPointer", version
    FROM "AllocationState"
    WHERE "serviceId" = ${serviceId}
    FOR UPDATE
  `);

  if (!allocationState) {
    throw new AllocationError(`Missing allocation state for service ${serviceId}.`);
  }

  return allocationState;
}

function pickFairAssignments({
  fairProviderIds,
  providerById,
  selectedProviderIds,
  pointer,
  requiredCount
}: {
  fairProviderIds: number[];
  providerById: Map<number, ProviderRow>;
  selectedProviderIds: Set<number>;
  pointer: number;
  requiredCount: number;
}): { assignments: CreatedAssignment[]; nextPointer: number } {
  if (fairProviderIds.length === 0) {
    throw new AllocationError('Fair allocation pool is empty.');
  }

  const assignments: CreatedAssignment[] = [];
  let lastChosenIndex = pointer;
  let scans = 0;
  let index = pointer % fairProviderIds.length;

  while (scans < fairProviderIds.length && assignments.length < requiredCount) {
    const providerId = fairProviderIds[index];
    const provider = providerById.get(providerId);

    if (provider && provider.active && provider.quotaConsumedThisMonth < provider.monthlyQuota && !selectedProviderIds.has(providerId)) {
      assignments.push({ providerId, assignmentKind: 'FAIR' });
      selectedProviderIds.add(providerId);
      lastChosenIndex = index;
    }

    index = (index + 1) % fairProviderIds.length;
    scans += 1;
  }

  if (assignments.length < requiredCount) {
    throw new AllocationError('Not enough eligible providers remain in the fair pool.');
  }

  return {
    assignments,
    nextPointer: (lastChosenIndex + 1) % fairProviderIds.length
  };
}
