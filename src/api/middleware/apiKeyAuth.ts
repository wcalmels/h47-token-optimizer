/**
 * API key authentication + quota enforcement
 * Copyright (c) 2024-2026 H47 Team · SPDX-License-Identifier: MIT
 */

import { Request, Response, NextFunction } from 'express';
import { ApiKeyRecord, getBillingStore } from '../billing/store';

export interface AuthenticatedRequest extends Request {
  apiKey?: ApiKeyRecord;
}

export function isMonetizationEnabled(): boolean {
  return process.env.MONETIZATION_ENABLED === 'true';
}

const PUBLIC_PATHS = new Set([
  '/health',
  '/api/plans',
  '/api/checkout',
  '/api/webhooks/stripe',
]);

export function apiKeyAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!isMonetizationEnabled()) {
    next();
    return;
  }

  if (PUBLIC_PATHS.has(req.path)) {
    next();
    return;
  }

  const header = req.headers.authorization;
  const rawKey = header?.startsWith('Bearer ') ? header.slice(7).trim() : req.headers['x-api-key'];

  if (!rawKey || typeof rawKey !== 'string') {
    res.status(401).json({
      success: false,
      error: 'API key required. Use Authorization: Bearer h47_... or X-API-Key header.',
      upgrade: `${process.env.APP_URL ?? ''}/api/plans`,
    });
    return;
  }

  const store = getBillingStore();
  const apiKey = store.findByRawKey(rawKey);

  if (!apiKey) {
    res.status(401).json({ success: false, error: 'Invalid API key' });
    return;
  }

  const quota = store.checkQuota(apiKey);
  if (!quota.allowed) {
    res.status(402).json({
      success: false,
      error: quota.reason,
      usage: quota.usage,
      upgrade: `${process.env.APP_URL ?? ''}/api/plans`,
    });
    return;
  }

  req.apiKey = apiKey;
  next();
}

export function recordBillableUsage(
  req: AuthenticatedRequest,
  tokensProcessed: number,
  optimizationCount = 1
): void {
  if (!isMonetizationEnabled() || !req.apiKey) return;
  getBillingStore().recordUsage(req.apiKey.id, tokensProcessed, optimizationCount);
}
