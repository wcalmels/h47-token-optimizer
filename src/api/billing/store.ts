/**
 * Persistent billing store — API keys, usage, subscriptions
 * Copyright (c) 2024-2026 H47 Team · SPDX-License-Identifier: MIT
 */

import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';
import { PlanId, getPlan } from './plans';

export interface ApiKeyRecord {
  id: string;
  keyHash: string;
  prefix: string;
  plan: PlanId;
  email: string;
  label: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: string;
  active: boolean;
}

export interface UsageRecord {
  apiKeyId: string;
  day: string;
  month: string;
  optimizationsToday: number;
  tokensToday: number;
}

export interface BillingStoreData {
  keys: ApiKeyRecord[];
  usage: UsageRecord[];
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

function hashKey(rawKey: string): string {
  // Simple hash for storage — raw key shown once at creation
  let hash = 0;
  for (let i = 0; i < rawKey.length; i++) {
    hash = (hash << 5) - hash + rawKey.charCodeAt(i);
    hash |= 0;
  }
  return `h${Math.abs(hash).toString(16)}`;
}

export class BillingStore {
  private filePath: string;
  private data: BillingStoreData;

  constructor(dataDir = process.env.DATA_DIR ?? './data') {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    this.filePath = path.join(dataDir, 'billing.json');
    this.data = this.load();
  }

  private load(): BillingStoreData {
    if (!fs.existsSync(this.filePath)) {
      return { keys: [], usage: [] };
    }
    return JSON.parse(fs.readFileSync(this.filePath, 'utf-8')) as BillingStoreData;
  }

  private save(): void {
    fs.writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  registerExistingKey(
    rawKey: string,
    options: { plan?: PlanId; email?: string; label?: string }
  ): ApiKeyRecord {
    const existing = this.findByRawKey(rawKey);
    if (existing) return existing;

    const prefix = rawKey.slice(0, 12);
    const record: ApiKeyRecord = {
      id: randomBytes(8).toString('hex'),
      keyHash: hashKey(rawKey),
      prefix,
      plan: options.plan ?? 'free',
      email: options.email ?? '',
      label: options.label ?? 'registered',
      createdAt: new Date().toISOString(),
      active: true,
    };
    this.data.keys.push(record);
    this.save();
    return record;
  }

  generateApiKey(options: {
    plan?: PlanId;
    email?: string;
    label?: string;
  }): { rawKey: string; record: ApiKeyRecord } {
    const rawKey = `h47_${randomBytes(24).toString('hex')}`;
    const prefix = rawKey.slice(0, 12);
    const record: ApiKeyRecord = {
      id: randomBytes(8).toString('hex'),
      keyHash: hashKey(rawKey),
      prefix,
      plan: options.plan ?? 'free',
      email: options.email ?? '',
      label: options.label ?? 'default',
      createdAt: new Date().toISOString(),
      active: true,
    };

    this.data.keys.push({ ...record, keyHash: hashKey(rawKey) });
    this.save();

    return { rawKey, record };
  }

  findByRawKey(rawKey: string): ApiKeyRecord | undefined {
    const h = hashKey(rawKey);
    return this.data.keys.find((k) => k.keyHash === h && k.active);
  }

  findById(id: string): ApiKeyRecord | undefined {
    return this.data.keys.find((k) => k.id === id);
  }

  updateKey(id: string, patch: Partial<ApiKeyRecord>): ApiKeyRecord | undefined {
    const idx = this.data.keys.findIndex((k) => k.id === id);
    if (idx === -1) return undefined;
    this.data.keys[idx] = { ...this.data.keys[idx], ...patch };
    this.save();
    return this.data.keys[idx];
  }

  findByStripeCustomer(customerId: string): ApiKeyRecord | undefined {
    return this.data.keys.find((k) => k.stripeCustomerId === customerId);
  }

  findByStripeSubscription(subscriptionId: string): ApiKeyRecord | undefined {
    return this.data.keys.find((k) => k.stripeSubscriptionId === subscriptionId);
  }

  private getMonthTokens(apiKeyId: string, month: string): number {
    return this.data.usage
      .filter((u) => u.apiKeyId === apiKeyId && u.month === month)
      .reduce((sum, u) => sum + u.tokensToday, 0);
  }

  recordUsage(
    apiKeyId: string,
    tokensProcessed: number,
    optimizationCount = 1
  ): {
    optimizationsToday: number;
    tokensThisMonth: number;
  } {
    const day = todayKey();
    const month = monthKey();
    let record = this.data.usage.find((u) => u.apiKeyId === apiKeyId && u.day === day);

    if (!record) {
      record = { apiKeyId, day, month, optimizationsToday: 0, tokensToday: 0 };
      this.data.usage.push(record);
    }

    record.optimizationsToday += optimizationCount;
    record.tokensToday += tokensProcessed;
    this.save();

    return {
      optimizationsToday: record.optimizationsToday,
      tokensThisMonth: this.getMonthTokens(apiKeyId, month),
    };
  }

  getUsageSummary(apiKeyId: string): {
    optimizationsToday: number;
    tokensThisMonth: number;
    plan: PlanId;
  } {
    const day = todayKey();
    const month = monthKey();
    const record = this.data.usage.find((u) => u.apiKeyId === apiKeyId && u.day === day);
    const key = this.findById(apiKeyId);

    return {
      optimizationsToday: record?.optimizationsToday ?? 0,
      tokensThisMonth: this.getMonthTokens(apiKeyId, month),
      plan: key?.plan ?? 'free',
    };
  }

  checkQuota(apiKey: ApiKeyRecord): {
    allowed: boolean;
    reason?: string;
    usage: { optimizationsToday: number; tokensThisMonth: number };
  } {
    const plan = getPlan(apiKey.plan);
    const usage = this.getUsageSummary(apiKey.id);

    if (usage.optimizationsToday >= plan.dailyOptimizations) {
      return {
        allowed: false,
        reason: `Daily limit reached (${plan.dailyOptimizations}). Upgrade at /api/plans`,
        usage,
      };
    }

    if (usage.tokensThisMonth >= plan.monthlyTokens) {
      return {
        allowed: false,
        reason: `Monthly token limit reached (${plan.monthlyTokens}). Upgrade at /api/plans`,
        usage,
      };
    }

    return { allowed: true, usage };
  }

  listKeys(): Omit<ApiKeyRecord, 'keyHash'>[] {
    return this.data.keys.map(({ keyHash: _, ...rest }) => rest);
  }
}

let storeInstance: BillingStore | null = null;

export function getBillingStore(): BillingStore {
  if (!storeInstance) {
    storeInstance = new BillingStore();
  }
  return storeInstance;
}

export function resetBillingStore(): void {
  storeInstance = null;
}
