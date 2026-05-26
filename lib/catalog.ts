export type ServiceRule = {
  mandatoryProviderIds: number[];
  fairProviderIds: number[];
};

export const REQUIRED_ASSIGNMENTS_PER_LEAD = 3;

export const SERVICE_CATALOG = [
  {
    id: 1,
    code: 'service-1',
    name: 'Service 1',
    description: 'Service 1 lead intake'
  },
  {
    id: 2,
    code: 'service-2',
    name: 'Service 2',
    description: 'Service 2 lead intake'
  },
  {
    id: 3,
    code: 'service-3',
    name: 'Service 3',
    description: 'Service 3 lead intake'
  }
] as const;

export const PROVIDER_CATALOG = [
  { id: 1, code: 'provider-1', name: 'Provider 1' },
  { id: 2, code: 'provider-2', name: 'Provider 2' },
  { id: 3, code: 'provider-3', name: 'Provider 3' },
  { id: 4, code: 'provider-4', name: 'Provider 4' },
  { id: 5, code: 'provider-5', name: 'Provider 5' },
  { id: 6, code: 'provider-6', name: 'Provider 6' },
  { id: 7, code: 'provider-7', name: 'Provider 7' },
  { id: 8, code: 'provider-8', name: 'Provider 8' }
] as const;

export const SERVICE_RULES: Record<number, ServiceRule> = {
  1: {
    mandatoryProviderIds: [1],
    fairProviderIds: [2, 3, 4]
  },
  2: {
    mandatoryProviderIds: [5],
    fairProviderIds: [6, 7, 8]
  },
  3: {
    mandatoryProviderIds: [1, 4],
    fairProviderIds: [2, 3, 5, 6, 7, 8]
  }
};
