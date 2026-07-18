const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

let ctxItem; // context-window bar
let usageItem; // today's cumulative usage
let timer;
let visible = true;

function activate(context) {
  const align =
    getCfg().get('alignment', 'right') === 'left'
      ? vscode.StatusBarAlignment.Left
      : vscode.StatusBarAlignment.Right;

  ctxItem = vscode.window.createStatusBarItem(align, 101);
  ctxItem.command = 'claudeMonitor.refresh';

  usageItem = vscode.window.createStatusBarItem(align, 100);
  usageItem.command = 'claudeMonitor.refresh';

  context.subscriptions.push(ctxItem, usageItem);

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
        out.push({ path: p, mtime: fs.statSync(p).mtimeMs });
      } catch (_) {
        /* ignore */
      }
    }
  }
  return out;
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

function hide() {
  ctxItem.hide();
  usageItem.hide();
}

function update() {
  if (!visible) {
    hide();
    return;
  }

  const cfg = getCfg();
  const max = cfg.get('contextWindow', 200000);
  const width = cfg.get('barWidth', 12);
  const showToday = cfg.get('showTodayUsage', true);

  const logs = allLogs();
  const file = latestLog(logs);

  // --- Context-window item ---
  if (!file) {
    ctxItem.text = '$(hubot) Claude: no log';
    ctxItem.tooltip = 'No ~/.claude/projects/**/*.jsonl found yet.';
    ctxItem.backgroundColor = undefined;
  } else {
    const used = lastContextTokens(file);
    if (used == null) {
      ctxItem.text = '$(hubot) Claude: --';
      ctxItem.tooltip = 'No usage record found in the latest session log.';
      ctxItem.backgroundColor = undefined;
    } else {
      const usedPct = Math.min(100, (used / max) * 100);
      const leftPct = 100 - usedPct;
      ctxItem.text = `$(hubot) Ctx ${bar(usedPct, width)} ${leftPct.toFixed(0)}% left`;
      ctxItem.tooltip = new vscode.MarkdownString(
        `**Claude context window**\n\n` +
          `- Used: ${used.toLocaleString()} / ${max.toLocaleString()} tokens (${usedPct.toFixed(1)}%)\n` +
          `- Remaining: ${(max - used).toLocaleString()} tokens (${leftPct.toFixed(1)}%)\n` +
          `- Source: \`${path.basename(file)}\`\n\n` +
          `_Click to refresh._`
      );
      ctxItem.backgroundColor =
        leftPct < 10
          ? new vscode.ThemeColor('statusBarItem.errorBackground')
          : leftPct < 25
            ? new vscode.ThemeColor('statusBarItem.warningBackground')
            : undefined;
    }
  }
  ctxItem.show();

  // --- Today's cumulative usage item ---
  if (!showToday) {
    usageItem.hide();
    return;
  }
  const today = todayTokens(logs);
  if (today == null) {
    usageItem.text = '$(graph) Today --';
    usageItem.tooltip = 'No token usage recorded today yet.';
  } else {
    usageItem.text = `$(graph) Today ${fmt(today)} tok`;
    usageItem.tooltip = new vscode.MarkdownString(
      `**Tokens processed today** (local date)\n\n` +
        `- Total: ${today.toLocaleString()} tokens\n` +
        `- Includes input + output + cache read/write across all sessions.\n` +
        `- This is *consumption*, not your plan's remaining quota — for that run \`/usage\`.\n\n` +
        `_Click to refresh._`
    );
  }
  usageItem.show();
}

function deactivate() {
  if (timer) clearInterval(timer);
}

module.exports = { activate, deactivate };
