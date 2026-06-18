# Limitations

An honest list of what this project does **not** do. Read this before deploying to production.

## 1. Quality is not empirically validated

The `quality` field in API responses is a heuristic derived from compression ratio, not from:

- human evaluation
- downstream task accuracy (e.g., does the model still answer correctly?)
- embedding similarity to the original

**Recommendation:** For critical workflows (legal, medical, financial), run A/B tests on your actual tasks before trusting aggressive compression.

## 2. Token counts are estimates

We use `max(⌈chars/4⌉, ⌈1.3·words⌉)`, not `tiktoken`, `claude-tokenizer`, or provider APIs. Budget enforcement may be off by 10–30% depending on language and content type.

## 3. Compression is extractive, not abstractive

The pipeline **selects and shortens** existing text. It does not:

- paraphrase for clarity
- merge concepts across distant paragraphs
- resolve coreferences
- generate summaries of numerical data

For highly structured repetitive data (logs, code), compression is strong. For nuanced prose with distributed arguments, it is weaker.

## 4. No semantic understanding

Keyword frequency ≠ importance. A sentence with rare but critical terms (e.g., a negation: "do **not** delete production data") may be dropped if it lacks high-frequency keywords.

## 5. Head/tail truncation is lossy

When over budget, the middle of the text is discarded entirely. Long documents with key information in the middle will suffer.

## 6. Multi-AI adaptation is cosmetic

The adapter adds prefixes/suffixes; it does not restructure prompts per model best practices beyond minimal formatting.

## 7. Not a replacement for provider context features

Anthropic, OpenAI, and others offer prompt caching, context editing, and native summarization. This tool complements — not replaces — those features.

## When to use this

| Good fit                          | Poor fit                              |
|-----------------------------------|---------------------------------------|
| Long repetitive logs/code         | Short prompts (< 200 tokens)          |
| Pre-processing before API calls   | Tasks requiring full verbatim text    |
| Cost reduction on bulk batch jobs | Legal/compliance verbatim retention   |
| Local, deterministic compression  | Highest semantic fidelity             |

## Reporting issues

If you find a case where compression destroys task performance, please open an issue with:

1. Input text (or synthetic equivalent)
2. Target AI and compression level
3. Expected vs actual model behavior

This helps us improve the pipeline with real failure cases.
