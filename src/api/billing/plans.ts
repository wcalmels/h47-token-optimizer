/**
 * Subscription plans — pricing in USD cents
 * Copyright (c) 2024-2026 H47 Team · SPDX-License-Identifier: MIT
 */

export type PlanId = 'free' | 'pro' | 'team' | 'enterprise';

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthlyCents: number;
  dailyOptimizations: number;
  monthlyTokens: number;
  batchMaxSize: number;
  features: string[];
  stripePriceEnvKey?: string;
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    priceMonthlyCents: 0,
    dailyOptimizations: 10,
    monthlyTokens: 100_000,
    batchMaxSize: 3,
    features: ['10 optimizations/day', '100K tokens/month', 'Community support'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthlyCents: 999,
    dailyOptimizations: 1_000,
    monthlyTokens: 5_000_000,
    batchMaxSize: 50,
    features: [
      '1,000 optimizations/day',
      '5M tokens/month',
      'Batch API',
      'Usage dashboard',
      'Email support',
    ],
    stripePriceEnvKey: 'STRIPE_PRICE_PRO',
  },
  team: {
    id: 'team',
    name: 'Team',
    priceMonthlyCents: 4900,
    dailyOptimizations: 10_000,
    monthlyTokens: 50_000_000,
    batchMaxSize: 200,
    features: [
      '10,000 optimizations/day',
      '50M tokens/month',
      '5 API keys included',
      'Priority support',
      'Audit logs',
    ],
    stripePriceEnvKey: 'STRIPE_PRICE_TEAM',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthlyCents: 0,
    dailyOptimizations: Number.MAX_SAFE_INTEGER,
    monthlyTokens: Number.MAX_SAFE_INTEGER,
    batchMaxSize: 1000,
    features: ['Custom limits', 'SSO', 'On-prem', 'SLA', 'Dedicated support'],
  },
};

export function getPlan(planId: PlanId): Plan {
  return PLANS[planId] ?? PLANS.free;
}

export function formatPrice(cents: number): string {
  if (cents === 0) return '$0';
  return `$${(cents / 100).toFixed(2)}`;
}

export function getStripePriceId(planId: PlanId): string | undefined {
  const plan = PLANS[planId];
  if (!plan.stripePriceEnvKey) return undefined;
  return process.env[plan.stripePriceEnvKey];
}
