# Claude Token Monitor

[English](https://github.com/nayawoonge/vscode-claude-code-token-monitor/blob/main/README.md) · **한국어**

Claude Code의 **컨텍스트 창 사용량**과 **오늘 누적 토큰 사용량**을 VS Code 하단 상태 표시줄에 **한 항목**으로 보여주는 작은 확장입니다.

```
🧠 Context ██████░░░░░░ 52% used   📊 Today 1.24M tok
```

컨텍스트 창의 남은 여유가 **25% 미만이면 노란색**, **10% 미만이면 빨간색**으로 바뀌어, 바닥나기 전에 경고를 줍니다. 두 정보가 **하나의 상태줄 항목**에 들어 있어, 사이에 다른 항목(코파일럿·인코딩·줄/열 등)이 끼지 않습니다.

> **요금제 남은 한도는요?** 어떤 스크립트·확장으로도 볼 수 없습니다 — `/usage`는 대화형 명령 전용이고, 구독 한도는 로컬 로그·환경변수·텔레메트리 어디에도 노출되지 않습니다. Claude Code에서 `/usage`를 실행하거나 [Console](https://platform.claude.com/usage)에서 확인하세요. 이 확장은 *컨텍스트 여유*와 *오늘 사용량*을 보여줄 뿐, 요금제 잔여 한도는 아닙니다.

## 동작 원리

Claude Code는 세션 로그를 `~/.claude/projects/<프로젝트>/<세션>.jsonl`에 남깁니다.

- **Context(컨텍스트)** — **현재 열려 있는 워크스페이스의 프로젝트**에서 가장 최근 세션 로그를 찾아(`scope: workspace`, 기본값 — "현재 세션"에 가장 가까움) 마지막 usage 기록을 읽고, `input + cache_read + cache_creation` 토큰을 설정한 컨텍스트 창 크기(기본 `200000`)와 비교합니다. `scope: global`로 바꾸면 모든 프로젝트 중 가장 최근 세션을 추적합니다.
- **Today(오늘)** — 오늘 하루 모든 세션에서 처리된 토큰(input + output + cache)을 *사용량* 개념으로 합산합니다.

> **참고:** 모두 로컬 로그 기반 근사치입니다. `.jsonl` 포맷은 Claude Code 내부 형식이라 버전에 따라 바뀔 수 있어, 업데이트 후 값이 안 맞을 수 있습니다.

## 설치 방법 (사용자용)

### 방법 A — 마켓플레이스에서 설치 (권장)

확장 패널(`Cmd/Ctrl+Shift+X`)에서 **"Claude Token Usage Bar"** 검색 → **설치**. 이후 업데이트는 자동입니다.

### 방법 B — `.vsix` 파일로 설치 (계정 불필요)

1. [Releases](https://github.com/nayawoonge/vscode-claude-code-token-monitor/releases)에서 최신 `.vsix` 파일을 다운로드합니다.
2. **확장 패널** → 우측 상단 `···` 메뉴 → **VSIX에서 설치…** → 받은 파일 선택.
3. 또는 명령줄: `code --install-extension claude-token-usage-bar-<버전>.vsix`

### 방법 C — 소스에서 실행 (개발용)

```bash
git clone https://github.com/nayawoonge/vscode-claude-code-token-monitor.git
cd claude-token-monitor
code .
# F5 를 눌러 "확장 개발 호스트" 창 실행
```

## 업데이트 방법 (사용자용)

- **마켓플레이스로 설치한 경우:** 자동 업데이트됩니다. 수동으로 하려면 확장 패널 → 해당 확장 → **업데이트(Update)**, 또는 우클릭 → **확장 업데이트 확인**.
- **`.vsix`로 설치한 경우:** [Releases](https://github.com/nayawoonge/vscode-claude-code-token-monitor/releases)에서 새 `.vsix`를 받아 **VSIX에서 설치…**를 다시 실행하면 기존 버전을 덮어씁니다. 안내가 뜨면 VS Code를 새로고침하세요.

## 설정

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `claudeMonitor.contextWindow` | `200000` | 모델 컨텍스트 창 크기(토큰). |
| `claudeMonitor.scope` | `workspace` | `workspace` = 현재 프로젝트의 최신 세션 / `global` = 전역 최신 세션. |
| `claudeMonitor.refreshMs` | `3000` | 갱신 주기(밀리초). |
| `claudeMonitor.barWidth` | `12` | 막대 너비(문자 수). |
| `claudeMonitor.showTodayUsage` | `true` | 오늘 누적 토큰 사용량 항목 표시. |
| `claudeMonitor.alignment` | `right` | 상태줄의 `left`/`right` 위치. |

## 명령

- **Claude Token Monitor: Refresh Now** — 즉시 갱신(막대를 클릭해도 실행됨).
- **Claude Token Monitor: Show/Hide** — 상태줄 항목 표시/숨김 토글.

## 라이선스

MIT
