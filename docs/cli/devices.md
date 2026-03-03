---
summary: "CLI reference for `genoma devices` (device pairing + token rotation/revocation)"
read_when:
  - You are approving device pairing requests
  - You need to rotate or revoke device tokens
title: "devices"
---

# `genoma devices`

Manage device pairing requests and device-scoped tokens.

## Commands

### `genoma devices list`

List pending pairing requests and paired devices.

```
genoma devices list
genoma devices list --json
```

### `genoma devices remove <deviceId>`

Remove one paired device entry.

```
genoma devices remove <deviceId>
genoma devices remove <deviceId> --json
```

### `genoma devices clear --yes [--pending]`

Clear paired devices in bulk.

```
genoma devices clear --yes
genoma devices clear --yes --pending
genoma devices clear --yes --pending --json
```

### `genoma devices approve [requestId] [--latest]`

Approve a pending device pairing request. If `requestId` is omitted, Genoma
automatically approves the most recent pending request.

```
genoma devices approve
genoma devices approve <requestId>
genoma devices approve --latest
```

### `genoma devices reject <requestId>`

Reject a pending device pairing request.

```
genoma devices reject <requestId>
```

### `genoma devices rotate --device <id> --role <role> [--scope <scope...>]`

Rotate a device token for a specific role (optionally updating scopes).

```
genoma devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

### `genoma devices revoke --device <id> --role <role>`

Revoke a device token for a specific role.

```
genoma devices revoke --device <deviceId> --role node
```

## Common options

- `--url <url>`: Gateway WebSocket URL (defaults to `gateway.remote.url` when configured).
- `--token <token>`: Gateway token (if required).
- `--password <password>`: Gateway password (password auth).
- `--timeout <ms>`: RPC timeout.
- `--json`: JSON output (recommended for scripting).

Note: when you set `--url`, the CLI does not fall back to config or environment credentials.
Pass `--token` or `--password` explicitly. Missing explicit credentials is an error.

## Notes

- Token rotation returns a new token (sensitive). Treat it like a secret.
- These commands require `operator.pairing` (or `operator.admin`) scope.
- `devices clear` is intentionally gated by `--yes`.
- If pairing scope is unavailable on local loopback (and no explicit `--url` is passed), list/approve can use a local pairing fallback.
