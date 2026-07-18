const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

let item;
let timer;
let visible = true;

function activate(context) {
  const align =
    getCfg().get('alignment', 'right') === 'left'
      ? vscode.StatusBarAlignment.Left
      : vscode.StatusBarAlignment.Right;

  item = vscode.window.createStatusBarItem(align, 100);
  item.command = 'claudeMonitor.refresh';
  context.subscriptions.push(item);

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeMonitor.refresh', update),
    vscode.commands.registerCommand('claudeMonitor.toggle', () => {
      visible = !visible;
      visible ? item.show() : item.hide();
    }),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('claudeMonitor')) restartTimer();
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

// Find the most recently modified .jsonl session log.
function latestLog() {
  const root = projectsDir();
  if (!fs.existsSync(root)) return null;
  let best = null;
  let bestT = 0;
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
        const t = fs.statSync(p).mtimeMs;
        if (t > bestT) {
          bestT = t;
          best = p;
        }
      } catch (_) {
        /* ignore */
      }
    }
  }
  return best;
}

// Read the last usage record and return tokens currently in the context window.
function lastContextTokens(file) {
  let lines;
  try {
    lines = fs.readFileSync(file, 'utf8').trim().split('\n');
  } catch (_) {
    return null;
  }
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const o = JSON.parse(lines[i]);
      const u = (o.message && o.message.usage) || o.usage;
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

function bar(pct, width) {
  const filled = Math.max(0, Math.min(width, Math.round((pct / 100) * width)));
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

const k = (n) => (n / 1000).toFixed(n >= 100000 ? 0 : 1) + 'k';

function update() {
  const cfg = getCfg();
  const max = cfg.get('contextWindow', 200000);
  const width = cfg.get('barWidth', 12);

  const file = latestLog();
  if (!file) {
    item.text = '$(hubot) Claude: no log';
    item.tooltip = 'No ~/.claude/projects/**/*.jsonl found yet.';
    item.backgroundColor = undefined;
    if (visible) item.show();
    return;
  }

  const used = lastContextTokens(file);
  if (used == null) {
    item.text = '$(hubot) Claude: --';
    item.tooltip = 'No usage record found in the latest session log.';
    item.backgroundColor = undefined;
    if (visible) item.show();
    return;
  }

  const usedPct = Math.min(100, (used / max) * 100);
  const leftPct = 100 - usedPct;

  item.text = `$(hubot) Ctx ${bar(usedPct, width)} ${leftPct.toFixed(0)}% left`;
  item.tooltip = new vscode.MarkdownString(
    `**Claude context window**\n\n` +
      `- Used: ${used.toLocaleString()} / ${max.toLocaleString()} tokens (${usedPct.toFixed(1)}%)\n` +
      `- Remaining: ${(max - used).toLocaleString()} tokens (${leftPct.toFixed(1)}%)\n` +
      `- Source: \`${path.basename(file)}\`\n\n` +
      `_Click to refresh._`
  );

  item.backgroundColor =
    leftPct < 10
      ? new vscode.ThemeColor('statusBarItem.errorBackground')
      : leftPct < 25
        ? new vscode.ThemeColor('statusBarItem.warningBackground')
        : undefined;

  if (visible) item.show();
}

function deactivate() {
  if (timer) clearInterval(timer);
}

module.exports = { activate, deactivate };
