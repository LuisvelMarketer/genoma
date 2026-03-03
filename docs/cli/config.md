---
summary: "CLI reference for `genoma config` (get/set/unset/file/validate)"
read_when:
  - You want to read or edit config non-interactively
title: "config"
---

# `genoma config`

Config helpers: get/set/unset/validate values by path and print the active
config file. Run without a subcommand to open
the configure wizard (same as `genoma configure`).

## Examples

```bash
genoma config file
genoma config get browser.executablePath
genoma config set browser.executablePath "/usr/bin/google-chrome"
genoma config set agents.defaults.heartbeat.every "2h"
genoma config set agents.list[0].tools.exec.node "node-id-or-name"
genoma config unset tools.web.search.apiKey
genoma config validate
genoma config validate --json
```

## Paths

Paths use dot or bracket notation:

```bash
genoma config get agents.defaults.workspace
genoma config get agents.list[0].id
```

Use the agent list index to target a specific agent:

```bash
genoma config get agents.list
genoma config set agents.list[1].tools.exec.node "node-id-or-name"
```

## Values

Values are parsed as JSON5 when possible; otherwise they are treated as strings.
Use `--strict-json` to require JSON5 parsing. `--json` remains supported as a legacy alias.

```bash
genoma config set agents.defaults.heartbeat.every "0m"
genoma config set gateway.port 19001 --strict-json
genoma config set channels.whatsapp.groups '["*"]' --strict-json
```

## Subcommands

- `config file`: Print the active config file path (resolved from `GENOMA_CONFIG_PATH` or default location).

Restart the gateway after edits.

## Validate

Validate the current config against the active schema without starting the
gateway.

```bash
genoma config validate
genoma config validate --json
```
