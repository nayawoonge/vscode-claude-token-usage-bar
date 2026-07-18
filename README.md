# Claude Token Monitor

**English** · [한국어](README.ko.md)

A tiny VS Code extension that shows your **Claude Code context-window usage** as a live bar graph in the status bar.

```
🤖 Ctx ██████░░░░░░ 48% left
```

The bar turns **yellow** below 25% remaining and **red** below 10%, so you get a warning before you run out of context.

## How it works

Claude Code writes session logs to `~/.claude/projects/**/*.jsonl`. This extension reads the most recently modified log, parses the latest usage record, and renders a bar from:

```
context tokens ≈ input_tokens + cache_read_input_tokens + cache_creation_input_tokens
```

compared against your configured context-window size (default `200000`).

> **Note:** This visualizes the current **session's context-window** usage — the most natural "how much room is left" metric. It does **not** compute your plan's weekly quota (that isn't available from the local logs); use `/usage` or `ccusage` for that.

## Install (for users)

### A. From a `.vsix` (GitHub Releases) — no account needed

1. Download the `.vsix` from this repo's [Releases](../../releases).
2. In VS Code: **Extensions** panel → `···` menu → **Install from VSIX…** → pick the file.
3. The bar appears in the status bar. If not, reload VS Code or run the `Claude Token Monitor: Show/Hide` command.

> Or from the CLI: `code --install-extension claude-token-monitor-0.0.1.vsix`

### B. From the Marketplace (once published)

Search **"Claude Token Monitor"** in the Extensions panel and click **Install**. Updates are automatic.

### C. From source (dev)

```bash
git clone https://github.com/nayawoonge/claude-token-monitor.git
cd claude-token-monitor
code .
# press F5 to launch an Extension Development Host
```

## Settings

| Setting | Default | Description |
| --- | --- | --- |
| `claudeMonitor.contextWindow` | `200000` | Model context-window size in tokens. |
| `claudeMonitor.refreshMs` | `3000` | Refresh interval (ms). |
| `claudeMonitor.barWidth` | `12` | Bar width in characters. |
| `claudeMonitor.alignment` | `right` | `left` or `right` side of the status bar. |

## Commands

- **Claude Token Monitor: Refresh Now** — force an immediate update (also runs when you click the item).
- **Claude Token Monitor: Show/Hide** — toggle the status bar item.

## Icon

The extension icon lives at `images/icon.png` (128×128 PNG recommended). After adding it, re-enable `"icon": "images/icon.png"` in `package.json`. See [images/README.md](images/README.md).

## License

MIT
