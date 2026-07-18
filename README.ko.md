# Claude Token Monitor

[English](README.md) · **한국어**

Claude Code의 **컨텍스트 창 사용량**과 **오늘 누적 토큰 사용량**을 VS Code 하단 상태 표시줄에 보여주는 작은 확장입니다.

```
🤖 Ctx ██████░░░░░░ 48% left   ·   📊 Today 1.24M tok
```

컨텍스트 막대는 남은 양이 **25% 미만이면 노란색**, **10% 미만이면 빨간색**으로 바뀌어, 바닥나기 전에 경고를 줍니다. 두 번째 항목은 오늘 하루 모든 세션에서 처리된 토큰을 합산합니다.

> **요금제 남은 한도는요?** 어떤 스크립트·확장으로도 볼 수 없습니다 — `/usage`는 대화형 명령 전용이고, 구독 한도는 로컬 로그·환경변수·텔레메트리 어디에도 노출되지 않습니다. Claude Code에서 `/usage`를 실행하거나 [Console](https://platform.claude.com/usage)에서 확인하세요. 이 확장은 *컨텍스트 여유*와 *오늘 사용량*을 보여줄 뿐, 요금제 잔여 한도는 아닙니다.

## 동작 원리

Claude Code는 세션 로그를 `~/.claude/projects/**/*.jsonl`에 남깁니다. 이 확장은 가장 최근에 수정된 로그를 읽어 마지막 usage 기록을 파싱하고, 아래 값을 기준으로 막대를 그립니다.

```
컨텍스트 토큰 ≈ input_tokens + cache_read_input_tokens + cache_creation_input_tokens
```

이 값을 설정한 컨텍스트 창 크기(기본 `200000`)와 비교합니다.

> **참고:** 이 확장이 보여주는 것은 현재 **세션의 컨텍스트 창** 사용률입니다("얼마나 여유가 남았는가"에 가장 가까운 지표). 요금제의 **주간 사용 한도**는 로컬 로그만으로 계산할 수 없으니, 그건 `/usage`나 `ccusage`를 사용하세요.

## 설치 방법 (사용자용)

### 방법 A — `.vsix` 파일로 설치 (계정 불필요)

1. 이 저장소의 [Releases](../../releases)에서 `.vsix` 파일을 다운로드합니다.
2. VS Code에서 **확장(Extensions) 패널** 열기 → 우측 상단 `···` 메뉴 → **VSIX에서 설치…(Install from VSIX…)** → 받은 파일 선택.
3. 설치되면 하단 상태 표시줄에 막대가 나타납니다. (안 보이면 VS Code 새로고침 또는 `Claude Token Monitor: Show/Hide` 명령 실행)

> 명령줄로도 설치할 수 있습니다: `code --install-extension claude-token-monitor-0.0.1.vsix`

### 방법 B — 마켓플레이스에서 설치 (게시된 경우)

확장 패널에서 **"Claude Token Monitor"** 검색 후 **설치**. 이후 업데이트는 자동입니다.

### 방법 C — 소스에서 실행 (개발용)

```bash
git clone https://github.com/nayawoonge/claude-token-monitor.git
cd claude-token-monitor
code .
# F5 를 눌러 "확장 개발 호스트" 창 실행
```

## 설정

| 설정 | 기본값 | 설명 |
| --- | --- | --- |
| `claudeMonitor.contextWindow` | `200000` | 모델 컨텍스트 창 크기(토큰). |
| `claudeMonitor.refreshMs` | `3000` | 갱신 주기(밀리초). |
| `claudeMonitor.barWidth` | `12` | 막대 너비(문자 수). |
| `claudeMonitor.showTodayUsage` | `true` | 오늘 누적 토큰 사용량 항목 표시. |
| `claudeMonitor.alignment` | `right` | 상태줄의 `left`/`right` 위치. |

## 명령

- **Claude Token Monitor: Refresh Now** — 즉시 갱신(막대를 클릭해도 실행됨).
- **Claude Token Monitor: Show/Hide** — 상태줄 항목 표시/숨김 토글.

## 라이선스

MIT
