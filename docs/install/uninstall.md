---
summary: "Uninstall Genoma completely (CLI, service, state, workspace)"
read_when:
  - You want to remove Genoma from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

# Uninstall

Two paths:

- **Easy path** if `genoma` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
genoma uninstall
```

Non-interactive (automation / npx):

```bash
genoma uninstall --all --yes --non-interactive
npx -y genoma uninstall --all --yes --non-interactive
```

Manual steps (same result):

1. Stop the gateway service:

```bash
genoma gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
genoma gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${GENOMA_STATE_DIR:-$HOME/.genoma}"
```

If you set `GENOMA_CONFIG_PATH` to a custom location outside the state dir, delete that file too.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.genoma/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g genoma
pnpm remove -g genoma
bun remove -g genoma
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/Genoma.app
```

Notes:

- If you used profiles (`--profile` / `GENOMA_PROFILE`), repeat step 3 for each state dir (defaults are `~/.genoma-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `genoma` is missing.

### macOS (launchd)

Default label is `ai.genoma.gateway` (or `ai.genoma.<profile>`; legacy `com.genoma.*` may still exist):

```bash
launchctl bootout gui/$UID/ai.genoma.gateway
rm -f ~/Library/LaunchAgents/ai.genoma.gateway.plist
```

If you used a profile, replace the label and plist name with `ai.genoma.<profile>`. Remove any legacy `com.genoma.*` plists if present.

### Linux (systemd user unit)

Default unit name is `genoma-gateway.service` (or `genoma-gateway-<profile>.service`):

```bash
systemctl --user disable --now genoma-gateway.service
rm -f ~/.config/systemd/user/genoma-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `Genoma Gateway` (or `Genoma Gateway (<profile>)`).
The task script lives under your state dir.

```powershell
schtasks /Delete /F /TN "Genoma Gateway"
Remove-Item -Force "$env:USERPROFILE\.genoma\gateway.cmd"
```

If you used a profile, delete the matching task name and `~\.genoma-<profile>\gateway.cmd`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://genoma.ai/install.sh` or `install.ps1`, the CLI was installed with `npm install -g genoma@latest`.
Remove it with `npm rm -g genoma` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `genoma ...` / `bun run genoma ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.
