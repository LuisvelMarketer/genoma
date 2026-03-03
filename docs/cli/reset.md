---
summary: "CLI reference for `genoma reset` (reset local state/config)"
read_when:
  - You want to wipe local state while keeping the CLI installed
  - You want a dry-run of what would be removed
title: "reset"
---

# `genoma reset`

Reset local config/state (keeps the CLI installed).

```bash
genoma reset
genoma reset --dry-run
genoma reset --scope config+creds+sessions --yes --non-interactive
```
