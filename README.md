# Claude Token Monitor

**English** · [한국어](README.ko.md)

A tiny VS Code extension that shows your **Claude Code context-window usage** and **today's token consumption** in one status bar item.

```
🧠 Context ██████░░░░░░ 52% used   📊 Today 1.24M tok
```

The item turns **yellow** when the context window drops below 25% free and **red** below 10%, so you get a warning before you run out of room. Both parts live in a **single status bar item**, so nothing (Copilot, encoding, Ln/Col…) can wedge between them.

> **What about my plan's remaining quota?** That isn't available to any script or extension — Claude Code's `/usage` command is interactive-only and the subscription allowance isn't exposed in local logs, env vars, or telemetry. Run `/usage` inside Claude Code, or check the [Console](https://platform.claude.com/usage). This extension shows *context room* and *today's consumption*, not remaining plan quota.

## How it works

Claude Code writes session logs to `~/.claude/projects/<project>/<session>.jsonl`.

- **Context** — finds the newest session log **for the project of the currently open workspace** (`scope: workspace`, the default — closest to your *current session*), reads the latest usage record, and compares `input + cache_read + cache_creation` tokens against your configured context-window size (default `200000`). Set `scope: global` to instead track the newest session across all projects.
- **Today** — sums all tokens (input + output + cache) processed today across every session, as a *consumption* figure.

> **Note:** These are local estimates. The `.jsonl` format is internal to Claude Code and may change between versions, so values can drift after a Claude Code update.

## Install (for users)

### A. From the Marketplace (recommended)

Open the **Extensions** panel (`Cmd/Ctrl+Shift+X`), search **"Claude Token Usage Bar"**, and click **Install**. Updates arrive automatically.

### B. From a `.vsix` (GitHub Releases) — no account needed

1. Download the latest `.vsix` from [Releases](../../releases).
2. **Extensions** panel → `···` menu → **Install from VSIX…** → pick the file.
3. Or from the CLI: `code --install-extension claude-token-usage-bar-<version>.vsix`

### C. From source (dev)

```bash
git clone https://github.com/nayawoonge/claude-token-monitor.git
cd claude-token-monitor
code .
# press F5 to launch an Extension Development Host
```

## Updating (for users)

- **Installed from the Marketplace:** updates are automatic. To force it: Extensions panel → the extension → **Update**, or right-click → **Check for Extension Updates**.
- **Installed from a `.vsix`:** download the newer `.vsix` from [Releases](../../releases) and **Install from VSIX…** again — it replaces the old version. Reload VS Code when prompted.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `claudeMonitor.contextWindow` | `200000` | Model context-window size in tokens. |
| `claudeMonitor.scope` | `workspace` | `workspace` = current project's newest session; `global` = newest session anywhere. |
| `claudeMonitor.refreshMs` | `3000` | Refresh interval (ms). |
| `claudeMonitor.barWidth` | `12` | Bar width in characters. |
| `claudeMonitor.showTodayUsage` | `true` | Show today's cumulative token usage next to the context bar. |
| `claudeMonitor.alignment` | `right` | `left` or `right` side of the status bar. |

## Commands

- **Claude Token Monitor: Refresh Now** — force an immediate update (also runs when you click the item).
- **Claude Token Monitor: Show/Hide** — toggle the status bar item.

## Icon

The extension icon lives at `images/icon.png` (128×128 PNG recommended). After adding it, re-enable `"icon": "images/icon.png"` in `package.json`. See [images/README.md](images/README.md).

## License

MIT
