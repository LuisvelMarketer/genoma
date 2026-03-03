---
summary: "CLI reference for `genoma agents` (list/add/delete/bindings/bind/unbind/set identity)"
read_when:
  - You want multiple isolated agents (workspaces + routing + auth)
title: "agents"
---

# `genoma agents`

Manage isolated agents (workspaces + auth + routing).

Related:

- Multi-agent routing: [Multi-Agent Routing](/concepts/multi-agent)
- Agent workspace: [Agent workspace](/concepts/agent-workspace)

## Examples

```bash
genoma agents list
genoma agents add work --workspace ~/.genoma/workspace-work
genoma agents bindings
genoma agents bind --agent work --bind telegram:ops
genoma agents unbind --agent work --bind telegram:ops
genoma agents set-identity --workspace ~/.genoma/workspace --from-identity
genoma agents set-identity --agent main --avatar avatars/genoma.png
genoma agents delete work
```

## Routing bindings

Use routing bindings to pin inbound channel traffic to a specific agent.

List bindings:

```bash
genoma agents bindings
genoma agents bindings --agent work
genoma agents bindings --json
```

Add bindings:

```bash
genoma agents bind --agent work --bind telegram:ops --bind discord:guild-a
```

If you omit `accountId` (`--bind <channel>`), Genoma resolves it from channel defaults and plugin setup hooks when available.

### Binding scope behavior

- A binding without `accountId` matches the channel default account only.
- `accountId: "*"` is the channel-wide fallback (all accounts) and is less specific than an explicit account binding.
- If the same agent already has a matching channel binding without `accountId`, and you later bind with an explicit or resolved `accountId`, Genoma upgrades that existing binding in place instead of adding a duplicate.

Example:

```bash
# initial channel-only binding
genoma agents bind --agent work --bind telegram

# later upgrade to account-scoped binding
genoma agents bind --agent work --bind telegram:ops
```

After the upgrade, routing for that binding is scoped to `telegram:ops`. If you also want default-account routing, add it explicitly (for example `--bind telegram:default`).

Remove bindings:

```bash
genoma agents unbind --agent work --bind telegram:ops
genoma agents unbind --agent work --all
```

## Identity files

Each agent workspace can include an `IDENTITY.md` at the workspace root:

- Example path: `~/.genoma/workspace/IDENTITY.md`
- `set-identity --from-identity` reads from the workspace root (or an explicit `--identity-file`)

Avatar paths resolve relative to the workspace root.

## Set identity

`set-identity` writes fields into `agents.list[].identity`:

- `name`
- `theme`
- `emoji`
- `avatar` (workspace-relative path, http(s) URL, or data URI)

Load from `IDENTITY.md`:

```bash
genoma agents set-identity --workspace ~/.genoma/workspace --from-identity
```

Override fields explicitly:

```bash
genoma agents set-identity --agent main --name "Genoma" --emoji "🦞" --avatar avatars/genoma.png
```

Config sample:

```json5
{
  agents: {
    list: [
      {
        id: "main",
        identity: {
          name: "Genoma",
          theme: "space lobster",
          emoji: "🦞",
          avatar: "avatars/genoma.png",
        },
      },
    ],
  },
}
```
