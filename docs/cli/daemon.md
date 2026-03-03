---
summary: "CLI reference for `genoma daemon` (legacy alias for gateway service management)"
read_when:
  - You still use `genoma daemon ...` in scripts
  - You need service lifecycle commands (install/start/stop/restart/status)
title: "daemon"
---

# `genoma daemon`

Legacy alias for Gateway service management commands.

`genoma daemon ...` maps to the same service control surface as `genoma gateway ...` service commands.

## Usage

```bash
genoma daemon status
genoma daemon install
genoma daemon start
genoma daemon stop
genoma daemon restart
genoma daemon uninstall
```

## Subcommands

- `status`: show service install state and probe Gateway health
- `install`: install service (`launchd`/`systemd`/`schtasks`)
- `uninstall`: remove service
- `start`: start service
- `stop`: stop service
- `restart`: restart service

## Common options

- `status`: `--url`, `--token`, `--password`, `--timeout`, `--no-probe`, `--deep`, `--json`
- `install`: `--port`, `--runtime <node|bun>`, `--token`, `--force`, `--json`
- lifecycle (`uninstall|start|stop|restart`): `--json`

## Prefer

Use [`genoma gateway`](/cli/gateway) for current docs and examples.
