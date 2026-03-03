---
summary: "CLI reference for `genoma logs` (tail gateway logs via RPC)"
read_when:
  - You need to tail Gateway logs remotely (without SSH)
  - You want JSON log lines for tooling
title: "logs"
---

# `genoma logs`

Tail Gateway file logs over RPC (works in remote mode).

Related:

- Logging overview: [Logging](/logging)

## Examples

```bash
genoma logs
genoma logs --follow
genoma logs --json
genoma logs --limit 500
genoma logs --local-time
genoma logs --follow --local-time
```

Use `--local-time` to render timestamps in your local timezone.
