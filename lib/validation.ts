import { z } from 'zod';

export const leadCreateSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(7).max(32),
  city: z.string().trim().min(2).max(120),
  serviceId: z.coerce.number().int().positive(),
  description: z.string().trim().max(1000).optional().default('')
});

export const webhookSchema = z.object({
  eventId: z.string().trim().min(8).max(128),
  action: z.literal('RESET_QUOTAS'),
  payload: z.record(z.unknown()).default({})
});

export const concurrentLeadSchema = z.object({
  serviceId: z.coerce.number().int().positive(),
  count: z.coerce.number().int().min(1).max(50).default(10)
});
