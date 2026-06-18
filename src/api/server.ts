/**
 * H47 Token Optimizer API Server
 * REST API for token optimization
 */

import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { H47TokenOptimizer, OptimizationOptions } from '../core/tokenOptimizer';
import { v4 as uuidv4 } from 'uuid';
import { rateLimiter } from './middleware/rateLimiter';

dotenv.config();

const app: Express = express();
const optimizer = new H47TokenOptimizer();
const RATE_LIMIT = parseInt(process.env.RATE_LIMIT ?? '100', 10);

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/api', rateLimiter(RATE_LIMIT));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Optimize endpoint
app.post('/api/optimize', async (req: Request, res: Response) => {
  try {
    const { text, options } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required and must be a string' });
    }

    const result = await optimizer.optimize(text, options as OptimizationOptions);

    res.json({
      success: true,
      requestId: uuidv4(),
      data: result,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Batch optimize endpoint
app.post('/api/batch', async (req: Request, res: Response) => {
  try {
    const { texts, options } = req.body;

    if (!Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Texts array is required and must not be empty' });
    }

    const results = await optimizer.optimizeBatch(texts, options as OptimizationOptions);

    res.json({
      success: true,
      requestId: uuidv4(),
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Stats endpoint
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const stats = optimizer.getStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Optimize for specific AI
app.post('/api/optimize-for-ai', async (req: Request, res: Response) => {
  try {
    const { text, ai } = req.body;

    if (!text || !ai) {
      return res.status(400).json({ error: 'Text and AI model are required' });
    }

    const result = await optimizer.optimize(text, {
      targetAI: ai as any,
      compressionLevel: 'balanced',
    });

    res.json({
      success: true,
      requestId: uuidv4(),
      data: result,
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: Request, res: Response) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🚀 H47 Token Optimizer API running on http://localhost:${PORT}`);
  console.log(`📚 API Documentation:`);
  console.log(`   POST /api/optimize - Optimize a single prompt`);
  console.log(`   POST /api/batch - Optimize multiple prompts`);
  console.log(`   GET /api/stats - Get optimizer statistics`);
  console.log(`   POST /api/optimize-for-ai - Optimize for specific AI`);
  console.log(`\n`);
});

export default app;
