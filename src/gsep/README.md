# GSEP Integration

## Status: Pending Integration

This directory will contain the integration layer between Genome and
[`@gsep/core`](https://github.com/gsepcore/gsep) (Genomic Self-Evolving Prompts).

## Migration from PGA

The legacy PGA (Prompt Genomico Autoevolutivo) code has been removed.
GSEP is the production-ready evolution of PGA with:

- **5 chromosomes** (C0-C4) instead of 3
- **Content Firewall** (C3) — 57 injection patterns
- **Behavioral Immune System** (C4) — output infection detection
- **LLM-powered mutations** — not just regex
- **Drift detection** — 5 drift types with immediate evolution
- **Middleware pattern** — two-hook integration (`before`/`after`)
- **30 intelligence systems** — consciousness, autonomy, skills, proactive engine

## Planned Integration

```typescript
import { GSEPMiddleware } from "@gsep/core";

// Create middleware instance
const mw = await GSEPMiddleware.create({
  llm: genomeLLMAdapter,
  name: "genome-agent",
});

// Hook into Genome's agent pipeline
// before() enhances the prompt + scans for threats
// after() records feedback + triggers evolution
```

## Install

```bash
pnpm add @gsep/core
```
