import { prisma } from '@/lib/prisma';

export async function getDashboardSnapshot() {
  const [services, providers, allocationStates, recentLeads] = await Promise.all([
    prisma.service.findMany({
      orderBy: { id: 'asc' }
    }),
    prisma.provider.findMany({
      orderBy: { id: 'asc' },
      include: {
        assignments: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            lead: {
              include: {
                service: true
              }
            }
          }
        }
      }
    }),
    prisma.allocationState.findMany({
      orderBy: { serviceId: 'asc' }
    }),
    prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        service: true,
        assignments: {
          include: {
            provider: true
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    })
  ]);

  return {
    services: services.map((service) => ({
      id: service.id,
      code: service.code,
      name: service.name,
      description: service.description
    })),
    providers: providers.map((provider) => ({
      id: provider.id,
      code: provider.code,
      name: provider.name,
      monthlyQuota: provider.monthlyQuota,
      quotaConsumedThisMonth: provider.quotaConsumedThisMonth,
      quotaRemaining: provider.monthlyQuota - provider.quotaConsumedThisMonth,
      active: provider.active,
      latestAssignments: provider.assignments.map((assignment) => ({
        id: assignment.id,
        leadId: assignment.leadId,
        serviceName: assignment.lead.service.name,
        leadName: assignment.lead.name,
        phone: assignment.lead.phone,
        city: assignment.lead.city,
        assignmentKind: assignment.assignmentKind,
        createdAt: assignment.createdAt.toISOString()
      }))
    })),
    allocationStates,
    recentLeads: recentLeads.map((lead) => ({
      id: lead.id,
      serviceName: lead.service.name,
      name: lead.name,
      phone: lead.phone,
      city: lead.city,
      status: lead.status,
      allocationError: lead.allocationError,
      createdAt: lead.createdAt.toISOString(),
      assignments: lead.assignments.map((assignment) => ({
        providerId: assignment.providerId,
        providerName: assignment.provider.name,
        assignmentKind: assignment.assignmentKind
      }))
    }))
  };
}
