# Changelog

## 0.2.0

- **Current-session aware:** the context bar now tracks the newest session of the *currently open workspace's* project instead of the globally newest log. New setting `claudeMonitor.scope` (`workspace` default, or `global`).
- **Single status bar item:** context and today's usage are merged into one item, so other status bar entries (Copilot, encoding, Ln/Col…) can no longer wedge between them.
- Context now shows **% used** instead of % left.
- Added a bundled `.vscode/launch.json` so pressing **F5** launches the Extension Development Host directly (no debugger picker).

## 0.1.0

- Added a second status bar item showing **today's cumulative token usage** (input + output + cache, summed across all sessions for the local day).
- New setting `claudeMonitor.showTodayUsage` to toggle it.

## 0.0.1

- Initial release.
- Live context-window usage bar in the status bar.
- Warning/error background colors at 25% / 10% remaining.
- Configurable context-window size, refresh interval, bar width, and alignment.
