# Claude Token Usage Bar

[English](https://github.com/nayawoonge/vscode-claude-token-usage-bar/blob/main/README.md) · **한국어**

Claude Code의 **컨텍스트 창 사용량**과 **오늘 누적 토큰 사용량**을 VS Code 하단 상태 표시줄에 **한 항목**으로 보여주는 작은 확장입니다.

![상태줄 스크린샷](https://raw.githubusercontent.com/nayawoonge/vscode-claude-token-usage-bar/main/images/screenshot.png)

컨텍스트 창의 남은 여유가 **25% 미만이면 노란색**, **10% 미만이면 빨간색**으로 바뀌어, 바닥나기 전에 경고를 줍니다. 두 정보가 **하나의 상태줄 항목**에 들어 있어, 사이에 다른 항목(코파일럿·인코딩·줄/열 등)이 끼지 않습니다.

항목에 **마우스를 올리면** 작은 대시보드가 뜹니다: 현재 세션의 컨텍스트 창(사용/남음/모델)과 오늘 토큰을 **프로젝트별로** 나눠 보여줍니다.

> **요금제 남은 한도는요?** 어떤 확장으로도 볼 수 없습니다 — `/usage`는 대화형 명령 전용이고, 구독 한도는 스크립트가 읽을 수 있는 곳에 노출되지 않습니다. Claude Code에서 `/usage`를 실행하거나 [Console](https://platform.claude.com/usage)에서 확인하세요. 이 확장은 *컨텍스트 여유*와 *오늘 사용량*을 보여줄 뿐, 요금제 잔여 한도는 아닙니다.

## 동작 원리

- **Context(컨텍스트)** — 현재 프로젝트의 최신 Claude Code 세션을 읽어 컨텍스트 창이 얼마나 찼는지 보여줍니다. 창 크기는 세션의 모델에서 자동 감지됩니다(예: Opus 4.8 = 1M 토큰, Haiku 4.5 = 200k).
- **Today(오늘)** — 오늘 하루 모든 세션에서 처리된 토큰을 합산한 사용량입니다.

> 모두 로컬 로그 기반 근사치이며, Claude Code 업데이트 후 값이 달라질 수 있습니다.

## 설치

### 마켓플레이스에서 설치 (권장)

확장 패널(`Cmd/Ctrl+Shift+X`)에서 **"Claude Token Usage Bar"** 검색 → **설치**. 이후 업데이트는 자동입니다.

### `.vsix` 파일로 설치

1. [Releases](https://github.com/nayawoonge/vscode-claude-token-usage-bar/releases)에서 최신 `.vsix` 파일을 다운로드합니다.
2. **확장 패널** → 우측 상단 `···` 메뉴 → **VSIX에서 설치…** → 받은 파일 선택.

## 업데이트

- **마켓플레이스:** 자동 업데이트됩니다. 수동으로는 확장 패널 → 해당 확장 → **업데이트(Update)**.
- **`.vsix`:** [Releases](https://github.com/nayawoonge/vscode-claude-token-usage-bar/releases)에서 새 `.vsix`를 받아 **VSIX에서 설치…**를 다시 실행하세요. 안내가 뜨면 VS Code를 새로고침합니다.

## 설정

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `claudeMonitor.autoDetectContextWindow` | `true` | 세션 모델에서 창 크기 자동 감지(Opus 4.8 = 1M, Haiku 4.5 = 200k). |
| `claudeMonitor.contextWindow` | `1000000` | 모델을 감지하지 못할 때 쓰는 폴백 창 크기(토큰). |
| `claudeMonitor.scope` | `workspace` | `workspace` = 현재 프로젝트 세션 / `global` = 전역 최신 세션. |
| `claudeMonitor.showTodayUsage` | `true` | 오늘 누적 토큰 사용량 항목 표시. |
| `claudeMonitor.barWidth` | `12` | 막대 너비(문자 수). |
| `claudeMonitor.alignment` | `right` | 상태줄의 `left`/`right` 위치. |
| `claudeMonitor.refreshMs` | `3000` | 갱신 주기(밀리초). |

## 명령

- **Claude Token Usage Bar: Refresh Now** — 즉시 갱신(막대를 클릭해도 실행됨).
- **Claude Token Usage Bar: Show/Hide** — 상태줄 항목 표시/숨김 토글.

## 라이선스

MIT
