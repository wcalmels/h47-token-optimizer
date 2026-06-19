import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { BillingStore, resetBillingStore } from '../src/api/billing/store';
import { mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('BillingStore', () => {
  let dataDir: string;

  beforeEach(() => {
    resetBillingStore();
    dataDir = mkdtempSync(join(tmpdir(), 'h47-billing-'));
  });

  afterEach(() => {
    rmSync(dataDir, { recursive: true, force: true });
  });

  it('generates and finds API keys', () => {
    const store = new BillingStore(dataDir);
    const { rawKey, record } = store.generateApiKey({ plan: 'pro', email: 'test@example.com' });

    expect(rawKey.startsWith('h47_')).toBe(true);
    expect(store.findByRawKey(rawKey)?.id).toBe(record.id);
    expect(store.findByRawKey('invalid')).toBeUndefined();
  });

  it('enforces daily quota on free plan', () => {
    const store = new BillingStore(dataDir);
    const { rawKey } = store.generateApiKey({ plan: 'free' });
    const key = store.findByRawKey(rawKey)!;

    for (let i = 0; i < 10; i++) {
      expect(store.checkQuota(key).allowed).toBe(true);
      store.recordUsage(key.id, 100);
    }

    expect(store.checkQuota(key).allowed).toBe(false);
  });

  it('registers existing bootstrap key', () => {
    const store = new BillingStore(dataDir);
    const fixed = 'h47_test_bootstrap_key_1234567890ab';
    store.registerExistingKey(fixed, { plan: 'pro' });
    expect(store.findByRawKey(fixed)?.plan).toBe('pro');
  });
});

describe('Plans', () => {
  it('exports pro plan pricing', async () => {
    const { PLANS } = await import('../src/api/billing/plans');
    expect(PLANS.pro.priceMonthlyCents).toBe(999);
    expect(PLANS.pro.stripePriceEnvKey).toBe('STRIPE_PRICE_PRO');
  });
});
