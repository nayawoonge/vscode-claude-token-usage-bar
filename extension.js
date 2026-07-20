const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

let item; // single combined status bar item
let timer;
let visible = true;
// path -> { mtime, tokens }: per-file all-time token total, cached by mtime so
// unchanged logs aren't re-read on every refresh.
const fileTokenCache = new Map();

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

// Known model context-window sizes (tokens). Used to auto-pick the right
// denominator instead of assuming 200k. Matched by substring on the model id.
const MODEL_WINDOWS = [
  [/opus-4-8|opus-4-7|opus-4-6|opus-4-5/, 1000000],
  [/sonnet-5|sonnet-4-6|sonnet-4-5/, 1000000],
  [/fable-5|mythos-5/, 1000000],
  [/haiku-4-5/, 200000],
];

function windowForModel(model) {
  if (!model) return null;
  for (const [re, win] of MODEL_WINDOWS) {
    if (re.test(model)) return win;
  }
  return null;
}

// Tokens currently sitting in the context window (last usage record), plus the
// model that produced it. Returns { tokens, model } or null.
function lastContext(file) {
  let lines;
  try {
    lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  } catch (_) {
    return null;
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const o = JSON.parse(lines[i]);
      const u = usageOf(o);
      if (u && u.input_tokens != null) {
        return {
          tokens:
            (u.input_tokens || 0) +
            (u.cache_read_input_tokens || 0) +
            (u.cache_creation_input_tokens || 0),
          model: (o.message && o.message.model) || o.model || null,
        };
      }
    } catch (_) {
      /* skip malformed line */
    }
  }
  return null;
}

// Tokens processed today, total and broken down per project.
// "Today" is the local date; entries are matched by their `timestamp` field.
// Returns { total, byProject: [{project, tokens}] } or null when nothing today.
function todayStats(logs) {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  let total = 0;
  let counted = false;
  const perProject = {};

  for (const l of logs) {
    // Skip files not touched today at all (cheap pre-filter).
    if (l.mtime < startOfDay) continue;
    let lines;
    try {
      lines = fs.readFileSync(l.path, 'utf8').trim().split('\n');
    } catch (_) {
      continue;
    }
    let sub = 0;
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
      sub +=
        (u.input_tokens || 0) +
        (u.output_tokens || 0) +
        (u.cache_creation_input_tokens || 0) +
        (u.cache_read_input_tokens || 0);
    }
    if (sub > 0) {
      perProject[l.project] = (perProject[l.project] || 0) + sub;
      total += sub;
      counted = true;
    }
  }
  if (!counted) return null;
  const byProject = Object.entries(perProject)
    .map(([project, tokens]) => ({ project, tokens }))
    .sort((a, b) => b.tokens - a.tokens);
  return { total, byProject };
}

// Turn a Claude Code project-dir name (e.g. "-Users-me-src-my-app") into a
// short, readable label. We can't perfectly decode (folder names contain
// dashes), so show the tail.
function projectLabel(dir) {
  let s = String(dir).replace(/^-+/, '');
  if (s.length > 26) s = '…' + s.slice(-26);
  return s;
}

// All-time token totals for every project (input+output+cache across all
// sessions). Per-file results are cached by mtime, so only changed logs are
// re-read on each refresh.
function allProjectStats(logs) {
  const per = {};
  for (const l of logs) {
    let entry = fileTokenCache.get(l.path);
    if (!entry || entry.mtime !== l.mtime) {
      let tokens = 0;
      let lines = [];
      try {
        lines = fs.readFileSync(l.path, 'utf8').trim().split('\n');
      } catch (_) {
        /* unreadable — treat as 0 */
      }
      for (const line of lines) {
        let u;
        try {
          u = usageOf(JSON.parse(line));
        } catch (_) {
          continue;
        }
        if (!u || u.input_tokens == null) continue;
        tokens +=
          (u.input_tokens || 0) +
          (u.output_tokens || 0) +
          (u.cache_creation_input_tokens || 0) +
          (u.cache_read_input_tokens || 0);
      }
      entry = { mtime: l.mtime, tokens };
      fileTokenCache.set(l.path, entry);
    }
    if (entry.tokens > 0) per[l.project] = (per[l.project] || 0) + entry.tokens;
  }
  return Object.entries(per)
    .map(([project, tokens]) => ({ project, tokens }))
    .sort((a, b) => b.tokens - a.tokens);
}

function bar(pct, width) {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)));
  // ▰ filled / ▱ empty — reads as a segmented gauge; filled segments take the
  // status bar foreground color (light/white on dark themes).
  return '▰'.repeat(filled) + '▱'.repeat(width - filled);
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
  const cfgMax = cfg.get('contextWindow', 1000000);
  const autoDetect = cfg.get('autoDetectContextWindow', true);
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
    ctxText = 'Claude: no log';
    ctxTip = 'No ~/.claude/projects/**/*.jsonl found yet.';
  } else {
    const ctx = lastContext(file);
    if (ctx == null) {
      ctxText = 'Claude: --';
      ctxTip = 'No usage record found in the latest session log.';
    } else {
      const used = ctx.tokens;
      const detected = autoDetect ? windowForModel(ctx.model) : null;
      const max = detected || cfgMax;
      const usedPct = Math.min(100, (used / max) * 100);
      const leftPct = 100 - usedPct;
      ctxText = `Context ${bar(usedPct, width)} ${usedPct.toFixed(0)}% used`;
      ctxTip =
        `**Claude context window**\n\n` +
        `- Used: ${used.toLocaleString()} / ${max.toLocaleString()} tokens (${usedPct.toFixed(1)}%)\n` +
        `- Remaining: ${(max - used).toLocaleString()} tokens (${leftPct.toFixed(1)}%)\n` +
        `- Model: \`${ctx.model || 'unknown'}\`${detected ? ' (window auto-detected)' : ''}\n` +
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
  let todayLine = '';
  if (showToday) {
    const stats = todayStats(logs);
    if (stats == null) {
      todayText = '  ·  Today --';
    } else {
      todayText = `  ·  Today ${fmt(stats.total)} tok`;
      todayLine = `\n\n**Today:** ${stats.total.toLocaleString()} tokens`;
    }
  }

  // --- All-projects breakdown (visualized) ---
  let dashTip = '';
  const projects = allProjectStats(logs);
  if (projects.length) {
    const maxTok = projects[0].tokens || 1;
    const rows = projects.map((p) => {
      const b = bar(Math.round((p.tokens / maxTok) * 100), 10);
      return `${b}  ${fmt(p.tokens).padStart(7)}  ${projectLabel(p.project)}`;
    });
    dashTip =
      `\n\n**All projects — token usage** (${projects.length})\n\n` +
      '```\n' +
      rows.join('\n') +
      '\n```' +
      `\n\n_Consumption (input+output+cache), not remaining plan quota — run \`/usage\` for that._`;
  }

  // Combine into ONE item so nothing can be inserted between the two parts.
  item.text = ctxText + todayText;
  item.tooltip = new vscode.MarkdownString(
    `### Claude Token Usage\n\n` +
      ctxTip +
      todayLine +
      dashTip +
      `\n\n_Click the item to refresh._`
  );
  item.backgroundColor = bg;
  item.show();
}

function deactivate() {
  if (timer) clearInterval(timer);
}

module.exports = { activate, deactivate };
