# Changelog

## 0.5.0

- **Hover dashboard.** The tooltip is now a mini dashboard: current session context (used / remaining / model, auto-detected window) plus today's tokens broken down **per project** with mini bars.

## 0.4.2

- Cleaner status bar: removed the `$(thinking)` / `$(graph)` icons and switched the gauge to segmented `▰▱` pills (filled segments render in the theme's foreground — light/white on dark themes), with a `·` separator between the context and today parts.

## 0.4.1

- Added a screenshot to the README and trimmed it to user-facing content.
- Renamed the command and settings labels to "Claude Token Usage Bar" to match the extension.

## 0.4.0

- **Fixed the context bar reading 100% on 1M-context models.** The window size is now auto-detected from the session's model (Opus 4.8/4.7/4.6/4.5, Sonnet 5/4.6/4.5, Fable/Mythos 5 = 1M; Haiku 4.5 = 200k) instead of assuming 200k. New setting `claudeMonitor.autoDetectContextWindow` (default on); `claudeMonitor.contextWindow` default raised to 1,000,000 and is now the fallback when the model is unknown. The tooltip shows the model and whether the window was auto-detected.

## 0.3.1

- Fixed `repository`/`bugs`/`homepage` URLs to the actual GitHub repo, and made README links absolute, so links on the Marketplace page no longer 404.

## 0.3.0

- Added the extension icon.
- Marketplace release of the current feature set (current-session scope, single status bar item, % used, today's usage).

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
