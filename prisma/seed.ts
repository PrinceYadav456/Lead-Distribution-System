import { PrismaClient } from '@prisma/client';
import { PROVIDER_CATALOG, SERVICE_CATALOG } from '../lib/catalog';

const prisma = new PrismaClient();

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.leadAssignment.deleteMany();
    await tx.lead.deleteMany();
    await tx.allocationState.deleteMany();
    await tx.webhookEvent.deleteMany();
    await tx.provider.deleteMany();
    await tx.service.deleteMany();

    await tx.service.createMany({
      data: SERVICE_CATALOG.map((service) => ({
        id: service.id,
        code: service.code,
        name: service.name,
        description: service.description
      }))
    });

    await tx.provider.createMany({
      data: PROVIDER_CATALOG.map((provider) => ({
        id: provider.id,
        code: provider.code,
        name: provider.name,
        monthlyQuota: 10,
        quotaConsumedThisMonth: 0,
        active: true
      }))
    });

    await tx.allocationState.createMany({
      data: SERVICE_CATALOG.map((service) => ({
        serviceId: service.id,
        nextPointer: 0,
        version: 0
      }))
    });
  });

  console.log('Seeded services, providers, and allocation state.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
