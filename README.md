# Claude Token Usage Bar

**English** · [한국어](https://github.com/nayawoonge/vscode-claude-token-usage-bar/blob/main/README.ko.md)

A tiny VS Code extension that shows your **Claude Code context-window usage** and **today's token consumption** in one status bar item.

![Status bar screenshot](https://raw.githubusercontent.com/nayawoonge/vscode-claude-token-usage-bar/main/images/screenshot.png)

The item turns **yellow** when the context window drops below 25% free and **red** below 10%, so you get a warning before you run out of room. Both parts live in a **single status bar item**, so nothing (Copilot, encoding, Ln/Col…) can wedge between them.

**Hover** the item for a mini dashboard: the current session's context window (used / remaining / model) and today's tokens broken down per project.

> **What about my plan's remaining quota?** That isn't available to any extension — Claude Code's `/usage` command is interactive-only and the subscription allowance isn't exposed anywhere a script can read. Run `/usage` inside Claude Code, or check the [Console](https://platform.claude.com/usage). This extension shows *context room* and *today's consumption*, not remaining plan quota.

## How it works

- **Context** — reads the newest Claude Code session for your current project and shows how full its context window is. The window size is detected from the session's model automatically (e.g. Opus 4.8 = 1M tokens, Haiku 4.5 = 200k).
- **Today** — sums all tokens processed today across your sessions, as a running consumption figure.

> These are local estimates and may drift after a Claude Code update.

## Install

### From the Marketplace (recommended)

Open the **Extensions** panel (`Cmd/Ctrl+Shift+X`), search **"Claude Token Usage Bar"**, and click **Install**. Updates arrive automatically.

### From a `.vsix`

1. Download the latest `.vsix` from [Releases](https://github.com/nayawoonge/vscode-claude-token-usage-bar/releases).
2. **Extensions** panel → `···` menu → **Install from VSIX…** → pick the file.

## Updating

- **Marketplace:** updates are automatic. To force it: Extensions panel → the extension → **Update**.
- **`.vsix`:** download the newer `.vsix` from [Releases](https://github.com/nayawoonge/vscode-claude-token-usage-bar/releases) and **Install from VSIX…** again. Reload VS Code when prompted.

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `claudeMonitor.autoDetectContextWindow` | `true` | Detect the window size from the session's model (Opus 4.8 = 1M, Haiku 4.5 = 200k). |
| `claudeMonitor.contextWindow` | `1000000` | Fallback window size (tokens) used when the model can't be detected. |
| `claudeMonitor.scope` | `workspace` | `workspace` = current project's session; `global` = newest session anywhere. |
| `claudeMonitor.showTodayUsage` | `true` | Show today's cumulative token usage next to the context bar. |
| `claudeMonitor.barWidth` | `12` | Bar width in characters. |
| `claudeMonitor.alignment` | `right` | `left` or `right` side of the status bar. |
| `claudeMonitor.refreshMs` | `3000` | Refresh interval (ms). |

## Commands

- **Claude Token Usage Bar: Refresh Now** — force an immediate update (also runs when you click the item).
- **Claude Token Usage Bar: Show/Hide** — toggle the status bar item.

## License

MIT
