const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

let item; // single combined status bar item
let timer;
let visible = true;

function activate(context) {
  const align =
    getCfg().get('alignment', 'right') === 'left'
      ? vscode.StatusBarAlignment.Left
      : vscode.StatusBarAlignment.Right;

  // A single item so nothing (Copilot, encoding, Ln/Col…) can wedge between the parts.
  item = vscode.window.createStatusBarItem(align, 100);
  item.command = 'claudeMonitor.refresh';

  context.subscriptions.push(item);

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeMonitor.refresh', update),
    vscode.commands.registerCommand('claudeMonitor.toggle', () => {
      visible = !visible;
      update();
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('claudeMonitor')) {
        restartTimer();
        update();
      }
    })
  );

  restartTimer();
  update();
}

function getCfg() {
  return vscode.workspace.getConfiguration('claudeMonitor');
}

function restartTimer() {
  if (timer) clearInterval(timer);
  const ms = getCfg().get('refreshMs', 3000);
  timer = setInterval(update, ms);
}

function projectsDir() {
  return path.join(os.homedir(), '.claude', 'projects');
}

// All *.jsonl session logs under ~/.claude/projects, with mtime.
function allLogs() {
  const root = projectsDir();
  const out = [];
  if (!fs.existsSync(root)) return out;
  for (const d of fs.readdirSync(root)) {
    const dir = path.join(root, d);
    let st;
    try {
      st = fs.statSync(dir);
    } catch (_) {
      continue;
    }
    if (!st.isDirectory()) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.jsonl')) continue;
      const p = path.join(dir, f);
      try {
        out.push({ path: p, mtime: fs.statSync(p).mtimeMs, project: d });
      } catch (_) {
        /* ignore */
      }
    }
  }
  return out;
}

// Claude Code stores a project's sessions under a folder whose name is the
// project path with every non-alphanumeric char replaced by '-'.
// e.g. /Users/me/src/app  ->  -Users-me-src-app
function workspaceProjectDir() {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || !folders.length) return null;
  const p = folders[0].uri.fsPath;
  return p.replace(/[^A-Za-z0-9]/g, '-');
}

// Logs limited to the current VS Code workspace's project, if we can find it.
// Falls back to all logs when there is no workspace or no matching folder.
function scopedLogs(logs) {
  if (getCfg().get('scope', 'workspace') !== 'workspace') return logs;
  const target = workspaceProjectDir();
  if (!target) return logs;
  const matched = logs.filter((l) => l.project === target);
  return matched.length ? matched : logs;
}

function latestLog(logs) {
  let best = null;
  let bestT = 0;
  for (const l of logs) {
    if (l.mtime > bestT) {
      bestT = l.mtime;
      best = l.path;
    }
  }
  return best;
}

function usageOf(o) {
  return (o && o.message && o.message.usage) || (o && o.usage) || null;
}

// Tokens currently sitting in the context window (last usage record).
function lastContextTokens(file) {
  let lines;
  try {
    lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  } catch (_) {
    return null;
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const u = usageOf(JSON.parse(lines[i]));
      if (u && u.input_tokens != null) {
        return (
          (u.input_tokens || 0) +
          (u.cache_read_input_tokens || 0) +
          (u.cache_creation_input_tokens || 0)
        );
      }
    } catch (_) {
      /* skip malformed line */
    }
  }
  return null;
}

// Sum of all tokens processed today across every session log.
// "Today" is the local date; entries are matched by their `timestamp` field.
function todayTokens(logs) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const startOfDay = new Date(y, m, d).getTime();

  let total = 0;
  let counted = false;

  for (const l of logs) {
    // Skip files not touched today at all (cheap pre-filter).
    if (l.mtime < startOfDay) continue;
    let lines;
    try {
      lines = fs.readFileSync(l.path, 'utf8').trim().split('\n');
    } catch (_) {
      continue;
    }
    for (const line of lines) {
      let o;
      try {
        o = JSON.parse(line);
      } catch (_) {
        continue;
      }
      const u = usageOf(o);
      if (!u || u.input_tokens == null) continue;

      // Only count entries whose timestamp is today.
      if (o.timestamp) {
        const t = Date.parse(o.timestamp);
        if (isNaN(t) || t < startOfDay) continue;
      }
      total +=
        (u.input_tokens || 0) +
        (u.output_tokens || 0) +
        (u.cache_creation_input_tokens || 0) +
        (u.cache_read_input_tokens || 0);
      counted = true;
    }
  }
  return counted ? total : null;
}

function bar(pct, width) {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)));
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function fmt(n) {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return String(n);
}

function update() {
  if (!visible) {
    item.hide();
    return;
  }

  const cfg = getCfg();
  const max = cfg.get('contextWindow', 200000);
  const width = cfg.get('barWidth', 12);
  const showToday = cfg.get('showTodayUsage', true);

  const logs = allLogs();
  // Context = the current session: newest log in THIS workspace's project.
  const file = latestLog(scopedLogs(logs));

  // --- Context-window part ---
  let ctxText;
  let ctxTip;
  let bg;
  if (!file) {
    ctxText = '$(thinking) Claude: no log';
    ctxTip = 'No ~/.claude/projects/**/*.jsonl found yet.';
  } else {
    const used = lastContextTokens(file);
    if (used == null) {
      ctxText = '$(thinking) Claude: --';
      ctxTip = 'No usage record found in the latest session log.';
    } else {
      const usedPct = Math.min(100, (used / max) * 100);
      const leftPct = 100 - usedPct;
      ctxText = `$(thinking) Context ${bar(usedPct, width)} ${usedPct.toFixed(0)}% used`;
      ctxTip =
        `**Claude context window**\n\n` +
        `- Used: ${used.toLocaleString()} / ${max.toLocaleString()} tokens (${usedPct.toFixed(1)}%)\n` +
        `- Remaining: ${(max - used).toLocaleString()} tokens (${leftPct.toFixed(1)}%)\n` +
        `- Source: \`${path.basename(file)}\``;
      bg =
        leftPct < 10
          ? new vscode.ThemeColor('statusBarItem.errorBackground')
          : leftPct < 25
            ? new vscode.ThemeColor('statusBarItem.warningBackground')
            : undefined;
    }
  }

  // --- Today's cumulative usage part ---
  let todayText = '';
  let todayTip = '';
  if (showToday) {
    const today = todayTokens(logs);
    if (today == null) {
      todayText = ' $(graph) Today --';
      todayTip = '\n\n**Tokens today:** none recorded yet.';
    } else {
      todayText = ` $(graph) Today ${fmt(today)} tok`;
      todayTip =
        `\n\n**Tokens processed today** (local date)\n\n` +
        `- Total: ${today.toLocaleString()} tokens\n` +
        `- Includes input + output + cache read/write across all sessions.\n` +
        `- This is *consumption*, not your plan's remaining quota — for that run \`/usage\`.`;
    }
  }

  // Combine into ONE item so nothing can be inserted between the two parts.
  item.text = ctxText + todayText;
  item.tooltip = new vscode.MarkdownString(ctxTip + todayTip + `\n\n_Click to refresh._`);
  item.backgroundColor = bg;
  item.show();
}

function deactivate() {
  if (timer) clearInterval(timer);
}

module.exports = { activate, deactivate };
