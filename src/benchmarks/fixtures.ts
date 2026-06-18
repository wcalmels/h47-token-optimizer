/**
 * Benchmark fixtures — realistic workloads for performance testing
 */

export interface BenchmarkFixture {
  name: string;
  category: string;
  text: string;
  defaultOptions?: {
    compressionLevel?: 'conservative' | 'balanced' | 'aggressive';
    targetAI?: 'claude' | 'gpt' | 'cursor' | 'generic';
    maxTokens?: number;
  };
}

function repeatBlock(block: string, times: number): string {
  return Array.from({ length: times }, (_, i) => block.replace(/\{n\}/g, String(i + 1))).join('\n');
}

export function buildConversationPrompt(turns = 100): string {
  const turns_text = Array.from({ length: turns }, (_, i) => {
    const role = i % 2 === 0 ? 'user' : 'assistant';
    const content =
      role === 'user'
        ? `Turn ${i + 1}: Please analyze the authentication module and suggest improvements for session handling, token refresh, and error recovery in production environments.`
        : `Turn ${i + 1}: The authentication module uses JWT with refresh tokens stored in httpOnly cookies. Consider adding rate limiting, rotating refresh tokens, and structured logging for failed login attempts.`;
    return `${role}: ${content}`;
  });
  return turns_text.join('\n\n');
}

export function buildCodeAnalysisPrompt(lines = 500): string {
  const fn = `function processOrder_{n}(items: Item[], config: Config) {
  if (!items.length) return null;
  const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = total * config.taxRate;
  return { total, tax, id: 'order-{n}' };
}`;
  return repeatBlock(fn, lines);
}

export function buildLogDataPrompt(records = 1000): string {
  const row = `[2024-06-18T12:{n}:00Z] INFO service=api status=200 latency_ms={n} user_id=user-{n} endpoint=/api/v1/resource action=read region=eu-west`;
  return repeatBlock(row, records);
}

export function buildLegalDocument(paragraphs = 50): string {
  const paragraph = `Section {n}. The parties agree that confidential information shall not be disclosed to third parties without prior written consent. In order to comply with applicable regulations, each party must maintain adequate security measures and report breaches within seventy-two hours of discovery.`;
  return repeatBlock(paragraph, paragraphs);
}

export const FIXTURES: BenchmarkFixture[] = [
  {
    name: 'Long conversation',
    category: 'conversation',
    text: buildConversationPrompt(100),
    defaultOptions: { compressionLevel: 'aggressive', targetAI: 'claude' },
  },
  {
    name: 'Code analysis',
    category: 'code',
    text: buildCodeAnalysisPrompt(500),
    defaultOptions: { compressionLevel: 'aggressive', targetAI: 'cursor', maxTokens: 2000 },
  },
  {
    name: 'Structured logs',
    category: 'data',
    text: buildLogDataPrompt(1000),
    defaultOptions: { compressionLevel: 'balanced', targetAI: 'generic' },
  },
  {
    name: 'Legal document',
    category: 'document',
    text: buildLegalDocument(50),
    defaultOptions: { compressionLevel: 'conservative', targetAI: 'claude' },
  },
  {
    name: 'Short prompt',
    category: 'baseline',
    text: 'Explain how token optimization reduces API costs for Claude and ChatGPT when processing long system prompts with redundant context.',
    defaultOptions: { compressionLevel: 'balanced', targetAI: 'generic' },
  },
];

export const COMPRESSION_LEVELS = ['conservative', 'balanced', 'aggressive'] as const;
export const TARGET_AIS = ['claude', 'gpt', 'cursor', 'generic'] as const;
