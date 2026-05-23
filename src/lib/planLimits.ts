export interface PlanLimits {
  draftsPerMonth: number; // -1 = unlimited
  maxMembers: number;     // -1 = unlimited
  label: string;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  starter: {
    label: 'Starter',
    draftsPerMonth: 10,
    maxMembers: 3,
  },
  professional: {
    label: 'Professional',
    draftsPerMonth: 150,
    maxMembers: 15,
  },
  enterprise: {
    label: 'Enterprise',
    draftsPerMonth: -1,
    maxMembers: -1,
  },
};

export function getPlanLimits(tier: string | null | undefined): PlanLimits {
  return PLAN_LIMITS[tier ?? 'starter'] ?? PLAN_LIMITS.starter;
}
