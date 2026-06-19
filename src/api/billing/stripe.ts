/**
 * Stripe integration for subscription checkout
 * Copyright (c) 2024-2026 H47 Team · SPDX-License-Identifier: MIT
 */

import Stripe from 'stripe';
import { PlanId, getPlan, getStripePriceId } from './plans';
import { getBillingStore } from './store';

let stripeClient: Stripe | null = null;

export function isStripeEnabled(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe(): Stripe | null {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export async function createCheckoutSession(options: {
  planId: PlanId;
  email: string;
  apiKeyId?: string;
}): Promise<{ url: string | null; error?: string }> {
  const stripe = getStripe();
  if (!stripe) {
    return { url: null, error: 'Stripe not configured. Set STRIPE_SECRET_KEY and price IDs.' };
  }

  if (!priceId) {
    return { url: null, error: `No Stripe price configured for plan: ${options.planId}` };
  }

  const appUrl = process.env.APP_URL ?? 'http://localhost:3001';

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer_email: options.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/api/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${appUrl}/api/plans`,
    metadata: {
      planId: options.planId,
      apiKeyId: options.apiKeyId ?? '',
    },
  });

  return { url: session.url };
}

export async function handleStripeWebhook(
  rawBody: Buffer,
  signature: string
): Promise<{ received: boolean; error?: string }> {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return { received: false, error: 'Stripe webhook not configured' };
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    return { received: false, error: `Webhook signature failed: ${err}` };
  }

  const store = getBillingStore();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const planId = (session.metadata?.planId ?? 'pro') as PlanId;
      const apiKeyId = session.metadata?.apiKeyId;

      if (apiKeyId) {
        store.updateKey(apiKeyId, {
          plan: planId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: session.subscription as string,
          email: session.customer_email ?? '',
        });
      } else if (session.customer_email) {
        store.generateApiKey({
          plan: planId,
          email: session.customer_email,
          label: 'stripe-checkout',
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const key = store.findByStripeSubscription(sub.id);
      if (key) {
        store.updateKey(key.id, { plan: 'free', stripeSubscriptionId: undefined });
      }
      break;
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription;
      const key = store.findByStripeSubscription(sub.id);
      if (key && sub.status === 'active') {
        const priceId = sub.items.data[0]?.price.id;
        const planId = resolvePlanFromPriceId(priceId);
        if (planId) store.updateKey(key.id, { plan: planId });
      }
      break;
    }
  }

  return { received: true };
}

function resolvePlanFromPriceId(priceId: string | undefined): PlanId | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_PRO) return 'pro';
  if (priceId === process.env.STRIPE_PRICE_TEAM) return 'team';
  return null;
}

export function getPublicPlans() {
  return (['free', 'pro', 'team'] as PlanId[]).map((id) => {
    const plan = getPlan(id);
    return {
      id: plan.id,
      name: plan.name,
      priceMonthly: plan.priceMonthlyCents / 100,
      priceFormatted: plan.priceMonthlyCents === 0 ? 'Free' : `$${(plan.priceMonthlyCents / 100).toFixed(2)}/mo`,
      dailyOptimizations: plan.dailyOptimizations,
      monthlyTokens: plan.monthlyTokens,
      batchMaxSize: plan.batchMaxSize,
      features: plan.features,
      stripeEnabled: Boolean(getStripePriceId(id)),
    };
  });
}
