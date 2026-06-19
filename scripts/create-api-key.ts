#!/usr/bin/env node
/**
 * Create API key for monetized deployment
 */

import { BillingStore } from '../src/api/billing/store.js';
import type { PlanId } from '../src/api/billing/plans.js';

const args = process.argv.slice(2);

function getArg(name: string, fallback: string): string {
  const i = args.indexOf(`--${name}`);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}

const store = new BillingStore(process.env.DATA_DIR ?? './data');
const { rawKey, record } = store.generateApiKey({
  plan: getArg('plan', 'free') as PlanId,
  email: getArg('email', ''),
  label: getArg('label', 'cli'),
});

console.log('\n✓ API key created\n');
console.log(`  Key:    ${rawKey}`);
console.log(`  Plan:   ${record.plan}`);
console.log(`  Prefix: ${record.prefix}`);
console.log(`  ID:     ${record.id}`);
console.log('\n  Store securely — shown once only.\n');
