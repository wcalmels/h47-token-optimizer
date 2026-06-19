#!/usr/bin/env node
/**
 * Generate secrets for Railway / production trial deploy
 */

import { randomBytes } from 'crypto';

const apiKey = `h47_${randomBytes(24).toString('hex')}`;
const adminSecret = randomBytes(32).toString('hex');

console.log('\n🔐 Secrets for Railway (copy to Variables)\n');
console.log(`BOOTSTRAP_API_KEY=${apiKey}`);
console.log(`ADMIN_SECRET=${adminSecret}`);
console.log('\nSave these — they will not be shown again.\n');
