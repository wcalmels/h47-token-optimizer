/**
 * Express application factory
 * Copyright (c) 2024-2026 H47 Team · SPDX-License-Identifier: MIT
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { H47TokenOptimizer, OptimizationOptions } from '../core/tokenOptimizer';
import { v4 as uuidv4 } from 'uuid';
import { rateLimiter } from './middleware/rateLimiter';
import { apiKeyAuth, AuthenticatedRequest, recordBillableUsage, isMonetizationEnabled } from './middleware/apiKeyAuth';
import { getBillingStore } from './billing/store';
import { createCheckoutSession, getPublicPlans, handleStripeWebhook, isStripeEnabled } from './billing/stripe';
import { getPlan } from './billing/plans';
import { PlanId } from './billing/plans';

export function createApp(): Express {
  const app = express();
  const optimizer = new H47TokenOptimizer();
  const rateLimit = parseInt(process.env.RATE_LIMIT ?? '100', 10);

  app.use(helmet());
  app.use(cors({ origin: process.env.CORS_ORIGIN ?? '*' }));

  // Stripe webhook needs raw body
  app.post(
    '/api/webhooks/stripe',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response) => {
      const signature = req.headers['stripe-signature'];
      if (!signature || typeof signature !== 'string') {
        res.status(400).json({ error: 'Missing stripe-signature' });
        return;
      }
      const result = await handleStripeWebhook(req.body as Buffer, signature);
      if (!result.received) {
        res.status(400).json({ error: result.error });
        return;
      }
      res.json({ received: true });
    }
  );

  app.use(express.json({ limit: '10mb' }));
  app.use('/api', rateLimiter(rateLimit));
  app.use('/api', apiKeyAuth);

  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      monetization: isMonetizationEnabled(),
      stripe: isStripeEnabled(),
      timestamp: new Date().toISOString(),
    });
  });

  app.get('/api/plans', (_req, res) => {
    res.json({
      success: true,
      data: getPublicPlans(),
      checkout: isStripeEnabled(),
      docs: `${process.env.APP_URL ?? ''}/docs/DEPLOY.md`,
    });
  });

  app.post('/api/checkout', async (req, res) => {
    const { planId, email, apiKey } = req.body as {
      planId?: PlanId;
      email?: string;
      apiKey?: string;
    };

    if (!planId || !email) {
      res.status(400).json({ success: false, error: 'planId and email are required' });
      return;
    }

    const store = getBillingStore();
    let apiKeyId: string | undefined;

    if (apiKey) {
      const key = store.findByRawKey(apiKey);
      apiKeyId = key?.id;
    }

    const session = await createCheckoutSession({ planId, email, apiKeyId });
    if (!session.url) {
      res.status(503).json({ success: false, error: session.error });
      return;
    }

    res.json({ success: true, url: session.url });
  });

  app.get('/api/checkout/success', (_req, res) => {
    res.json({
      success: true,
      message: 'Subscription active. Use your API key with Authorization: Bearer h47_...',
    });
  });

  app.get('/api/usage', (req: AuthenticatedRequest, res) => {
    if (!req.apiKey) {
      res.status(401).json({ success: false, error: 'API key required' });
      return;
    }

    const store = getBillingStore();
    const usage = store.getUsageSummary(req.apiKey.id);
    const plan = getPlan(req.apiKey.plan);

    res.json({
      success: true,
      data: {
        plan: plan.name,
        usage,
        limits: {
          dailyOptimizations: plan.dailyOptimizations,
          monthlyTokens: plan.monthlyTokens,
        },
      },
    });
  });

  app.post('/api/keys', (req, res) => {
    const adminSecret = process.env.ADMIN_SECRET;
    if (!adminSecret || req.headers['x-admin-secret'] !== adminSecret) {
      res.status(403).json({ success: false, error: 'Forbidden' });
      return;
    }

    const { email, plan, label } = req.body as {
      email?: string;
      plan?: PlanId;
      label?: string;
    };

    const { rawKey, record } = getBillingStore().generateApiKey({
      email: email ?? '',
      plan: plan ?? 'free',
      label: label ?? 'manual',
    });

    res.status(201).json({
      success: true,
      data: { apiKey: rawKey, prefix: record.prefix, plan: record.plan, id: record.id },
      warning: 'Store this key securely. It will not be shown again.',
    });
  });

  app.post('/api/optimize', async (req: AuthenticatedRequest, res) => {
    try {
      const { text, options } = req.body;

      if (!text || typeof text !== 'string') {
        res.status(400).json({ error: 'Text is required and must be a string' });
        return;
      }

      const result = await optimizer.optimize(text, options as OptimizationOptions);
      recordBillableUsage(req, result.original.tokenCount);

      res.json({ success: true, requestId: uuidv4(), data: result });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.post('/api/batch', async (req: AuthenticatedRequest, res) => {
    try {
      const { texts, options } = req.body;

      if (!Array.isArray(texts) || texts.length === 0) {
        res.status(400).json({ error: 'Texts array is required and must not be empty' });
        return;
      }

      const maxBatch = req.apiKey ? getPlan(req.apiKey.plan).batchMaxSize : 50;
      if (texts.length > maxBatch) {
        res.status(400).json({
          error: `Batch size ${texts.length} exceeds plan limit (${maxBatch}). Upgrade at /api/plans`,
        });
        return;
      }

      const results = await optimizer.optimizeBatch(texts, options as OptimizationOptions);
      const totalTokens = results.reduce((sum, r) => sum + r.original.tokenCount, 0);
      recordBillableUsage(req, totalTokens, texts.length);

      res.json({ success: true, requestId: uuidv4(), count: results.length, data: results });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.get('/api/stats', (_req, res) => {
    res.json({ success: true, data: optimizer.getStats() });
  });

  app.post('/api/optimize-for-ai', async (req: AuthenticatedRequest, res) => {
    try {
      const { text, ai } = req.body;

      if (!text || !ai) {
        res.status(400).json({ error: 'Text and AI model are required' });
        return;
      }

      const result = await optimizer.optimize(text, {
        targetAI: ai as OptimizationOptions['targetAI'],
        compressionLevel: 'balanced',
      });

      recordBillableUsage(req, result.original.tokenCount);

      res.json({ success: true, requestId: uuidv4(), data: result });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  app.use((_req, res) => {
    res.status(404).json({ success: false, error: 'Endpoint not found' });
  });

  return app;
}

export function bootstrapMonetization(): void {
  if (!isMonetizationEnabled()) return;

  const store = getBillingStore();
  const bootstrapKey = process.env.BOOTSTRAP_API_KEY;

  if (bootstrapKey) {
    store.registerExistingKey(bootstrapKey, {
      plan: (process.env.BOOTSTRAP_PLAN as PlanId) ?? 'pro',
      email: process.env.BOOTSTRAP_EMAIL ?? 'admin@local',
      label: 'bootstrap',
    });
    console.log('✓ Bootstrap API key registered from BOOTSTRAP_API_KEY');
    return;
  }

  if (store.listKeys().length === 0) {
    const { rawKey } = store.generateApiKey({
      plan: 'pro',
      label: 'auto-bootstrap',
      email: 'admin@local',
    });
    console.log(`\n🔑 Auto-generated API key (save this): ${rawKey}\n`);
  }
}
