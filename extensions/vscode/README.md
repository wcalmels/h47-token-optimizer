# H47 Token Optimizer

Compress LLM prompts **locally** — no API calls, no inference cost.

Select text in the editor, run **H47: Optimize Selected Text**, and get a shorter version ready to paste into Claude, ChatGPT, or Cursor.

## Features

- **Local & deterministic** — runs in-process, ~1–15 ms typical
- **Context menu** — right-click selected text → H47 commands
- **Configurable** — compression level, target AI, token budget in Settings
- **Keyboard shortcuts** — `Ctrl+Shift+O` (optimize), `Ctrl+Shift+Alt+O` (replace)

## Commands

| Command | Action |
|---------|--------|
| H47: Optimize Selected Text | Preview result in new markdown tab |
| H47: Optimize and Replace Selection | Replace selection in place |
| H47: Optimize for Claude | Claude-optimized output, replaces selection |
| H47: Show Optimizer Info | Version and supported models |

## Settings

Search `h47` in VS Code Settings:

- `h47.compressionLevel` — `conservative` | `balanced` | `aggressive`
- `h47.targetAI` — `generic` | `claude` | `gpt` | `cursor`
- `h47.maxTokens` — output token budget (default 2000)
- `h47.showPreview` — preview vs replace for main optimize command

## Limitations

Extractive compression works best on long, repetitive text (logs, code, conversations). Short selections may not compress. See [limitations](https://github.com/wcalmels/h47-token-optimizer/blob/main/docs/LIMITATIONS.md).

## Also works in Cursor

Install the `.vsix` file: **Extensions → … → Install from VSIX**.

## License

MIT · Copyright © 2024-2026 H47 Team
