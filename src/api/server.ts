/**
 * H47 Token Optimizer API Server
 * Copyright (c) 2024-2026 H47 Team · SPDX-License-Identifier: MIT
 */

import dotenv from 'dotenv';
import { createApp, bootstrapMonetization } from './app';

dotenv.config();

const app = createApp();
bootstrapMonetization();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  const monetization = process.env.MONETIZATION_ENABLED === 'true';
  console.log(`\n🚀 H47 Token Optimizer API → http://localhost:${PORT}`);
  console.log(`   Monetization: ${monetization ? 'ENABLED (API keys required)' : 'disabled (open)'}`);
  if (monetization) {
    console.log(`   Plans:    GET /api/plans`);
    console.log(`   Usage:    GET /api/usage  (Bearer token)`);
    console.log(`   Checkout: POST /api/checkout`);
  }
  console.log(`   Optimize: POST /api/optimize\n`);
});

export default app;
