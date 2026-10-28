# 일하는 외국인 공제회 — 프로토타입 v2 (gongjehoe-app)

단기순환 외국인력(E-9·H-2)을 위한 개인계좌형 공제회의 시연 프로토타입입니다. 설계 기준은 [`docs/설계서_v2.md`](docs/설계서_v2.md) 하나이고, 근거는 이성옥·김태희(2025), 다문화콘텐츠연구 54집 89-119와 정책제안서(2026.10)입니다.
모든 인물과 금액은 시연 데이터입니다. 제안 제도에는 "(제안)" 라벨을 붙였습니다. v0.5 단일 파일 데모는 [`legacy/index.html`](legacy/index.html)에 그대로 보존했습니다.

## 실행

```bash
npm ci
npm run dev            # 개발 서버 → http://localhost:5173/gongjehoe-app/
npm run build          # i18n 검사 + 타입 검사 + 빌드 → dist/
npm run preview        # 빌드 결과 → http://localhost:4173/gongjehoe-app/
```

| 명령 | 내용 |
|---|---|
| `npm test` | 규칙 엔진 단위 테스트(Vitest) |
| `npm run report:rules` | 위 결과 → `reports/rules.json` |
| `npm run gen:fixtures` | 고용 이력·월 보수 → 부과·수납·원장·배당 생성 → `fixtures/demo.json` |
| `npm run check:i18n` | 키 누락·자리표시자·(제안) 라벨·비한국어 한글·화면 코드 한글/인라인 스타일 검사 → `reports/i18n.json` |
| `npm run e2e` | Playwright E2E(과업 T1~T5 포함, `npm run build` 뒤 실행) |
| `npm run test:screens` | 5개 언어 × 근로자 전 화면 + 데스크톱: axe·가로 넘침·한글 검사, 스크린샷 → `reports/a11y.json`, `reports/screens.json`, `reports/screens/` |
| `npm run lighthouse` | Lighthouse 모바일(@lhci/cli) → `reports/lighthouse/summary.json`. 크롬 경로가 필요하면 `CHROME_PATH=...` |

## 화면 주소(해시 라우터)

| 주소 | 화면 |
|---|---|
| `#/` | 데모 런처: 인물 4명, 사업주, 운영자, 컴포넌트 미리보기, 시연 초기화 |
| `#/w/W001/start` | 근로자 앱 첫 실행(W-01 언어 선택). W001 Ramesh, W002 Nguyen, W003 Siti, W004 김해란 |
| `#/w/:id` … | 홈 · 내역 · 받기 · 내 정보 4탭(§8.1) |
| `#/e` | 사업주 포털(E-10~E-40) |
| `#/a` | 운영자(A-10 기금 현황, A-20 환급 처리함, A-30 재정 시뮬레이터) |
| `#/ui` | 디자인 시스템 미리보기 |
| `?study=1#/w/W001/start` | 사용성 테스트 모드: 데모 칩을 숨기고 화면 전환·클릭을 이 브라우저에만 기록. `#/study`에서 JSON 내보내기 |

근로자 앱 오른쪽 아래의 작은 "데모" 칩에서 런처로 돌아가거나, 시연을 초기화하거나, 신청을 다음 단계로 넘길 수 있습니다.

## 구조

```
policy/      제도 수치의 유일한 출처(값마다 source·label·verified) — 코드에 숫자 금지
fixtures/    생성 스크립트 결과(직접 수정 금지)
locales/     ko(기준)·en·vi·ne·id. portal.*(사업주·운영자)은 ko·en만
src/domain/  순수 계산·상태 전이(요율·원장·배당·시뮬레이션·국민연금 비교·보장 지도·신청 상태). Date 직접 사용 금지(clock.ts만)
src/data/    Repository 인터페이스 + MockRepository(fixtures + localStorage). 나중에 HttpRepository로 바꾸는 지점
src/ui/      디자인 토큰·컴포넌트(§9.4), SVG 차트 직접 구현
src/apps/    worker(모바일) · employer · admin(데스크톱). 한글·인라인 스타일 직접 입력 금지(빌드 검사)
src/demo/    런처·미리보기·연구 기록 화면(앱 밖)
tests/       rules(Vitest) · e2e · a11y(Playwright)
reports/     자동 생성 평가 결과
docs/        설계서·검증 기록·확인필요 목록·레거시 문서
```

원장 원칙: 화면의 모든 잔액은 원장 기입의 합입니다. 원장에는 추가만 하며 수정은 ADJUST 기입으로 합니다. 부과(BILL) → 수납(PAYMENT) → 원장 순서이고, 배당은 연 1회 확정할 때만 기입합니다. 미래 금액은 `projection`에서만 계산하고 "예시" 라벨을 붙입니다.

## 평가 결과 요약 (2026-10-28, 기준일 2026-10-15)

| 항목 | 결과 | 산출물 |
|---|---|---|
| 규칙 엔진 테스트(§6.4) | **113 / 113 통과**, 24개 규칙 묶음(BR-01~22, 상태 전이, 원장 무결성, 시연 인물 스냅숏) | `reports/rules.json` |
| E2E | **15 / 15 통과**: T1~T5 과업, BR-11 지분 검증, 계좌 하이픈 허용, 데모 칩으로 끝까지 지급, W-31→A-20→W-32 데이터 공유, 반려, 재정 시뮬레이터, 오프라인(PWA) | `tests/e2e/` |
| 접근성(NFR-01) | **axe(WCAG 2.2 AA) 위반 0건**: 133개 화면(5개 언어 × 근로자 23화면 + 데스크톱 9화면 × ko·en) | `reports/a11y.json` |
| 화면 검수(P10) | 가로 넘침 **0건**, ko 외 언어 DOM의 한글 **0자**(언어 선택의 원어 표기 `lang="ko"`는 제외) | `reports/screens.json`, `reports/screens/`(생성물, 저장소에는 넣지 않음) |
| 다국어(NFR-02) | 키 누락 0 · 자리표시자 불일치 0 · (제안) 라벨 누락 0 · 화면 코드의 한글 0 / ko·en 521키, vi·ne·id 386키(portal 제외). ko 외 4개 언어는 **AI 검수 완료(`ai-reviewed`), 원어민 검수 전** — 질문 목록 `docs/번역_검수메모.md` | `reports/i18n.json` |
| Lighthouse 모바일(NFR-03) | 홈: 성능 **88~90**(실행마다 변동), 접근성 100 / 환급 신청: 성능 **93~94**, 접근성 100(3회 중앙값). LCP 3.3초·2.9초(느린 4G 에뮬레이션), FCP 1.7초 | `reports/lighthouse/summary.json` |
| KLM(§11.3) | T3 2단계(약 5.3초), T4 8단계(약 15.8초), 키 입력 0 | `reports/klm.md` |

NFR-03의 "첫 화면 2초 이내"는 Lighthouse 에뮬레이션 LCP 기준으로는 아직 충족하지 못했습니다(3.3초). 실제 중저가 기기 측정이 필요합니다.

## 시연 인물 총액 — v0.5와 다른 이유

| 인물 | 가입(2026-09 기준) | v2 총액(원장 합계) | 비고 |
|---|---|---|---|
| Ramesh Gurung(네팔·E-9) | 36개월 | 5,436,835원 | v0.5 화면설계서 값은 5,723,627원 |
| Nguyen Van An(베트남·E-9) | 18개월 | 2,791,912원 | 13개월째 사업장 변경, 2026.03 공백. 새 사업장에서도 13개월째로 이어짐(BR-03) |
| Siti Rahma(인도네시아·E-9) | 52개월 | 8,543,842원 | 건보 미납 30만 원 알림(건보공단 정보) |
| 김해란(중국 동포·H-2) | 70개월 | 13,511,303원 | 만기 초과·계속 적립 |

v2 값이 v0.5보다 낮은 이유는 두 가지입니다.
1. **운용수익.** v0.5는 연 3%를 매달 복리로 붙여 확정 금액처럼 보여 주었습니다. v2는 연 1회 확정 배당만 원장에 넣습니다(BR-05). 그래서 2026년 1~9월분 수익은 아직 잔액에 없습니다.
2. **월급.** v0.5는 고정 월급 하나로 계산했습니다. v2는 2026년 월급을 기준으로 이전 연도를 최저임금 인상률만큼 낮춰 생성합니다(§5.3).

## 디자인 토큰
색상은 KRDS 공식 토큰(npm `krds-uiux@1.1.0`, NIA)을 `src/ui/tokens.css`에 옮겼다. 서체는 성능 때문에 Pretendard GOV 대신 Pretendard를 쓴다(`docs/확인필요.md`).

## 사용성 테스트 자료
`docs/usability/`: 동의서 초안, 과업 시나리오(T1~T5, `?study=1` 기록 방법), 참여자 정보표, SUS 설문, 실기기 점검표.

## 팩트 규율과 확인 필요 항목

- 제도 수치는 모두 `policy/*.json`에 있고, 각 값에 출처(`source`)와 라벨(`법령/제안/가정/결정`)이 붙어 있습니다. 1차 출처로 확인하지 못한 값(`verified: false`)은 화면에 숫자로 내지 않습니다.
- 반환일시금 이자 2.2%는 공식 자료에서 찾지 못했습니다. 그래서 국민연금 비교 막대는 **이자를 뺀 원금 기준 약식 예시**로만 표시합니다.
- 국민연금 적용국(베트남·인도네시아·중국) 근로자는 원금만 비교해도 현행 반환일시금이 공제회 적립액보다 큽니다(공제회/국민연금 0.66~0.82). 차이의 대부분은 사업주 몫에서 납니다. 해석과 정책 선택지는 [`docs/분석_국민연금비교.md`](docs/분석_국민연금비교.md)에 정리했습니다. 화면은 결과를 그대로 보여 주고, 이유 한 줄을 덧붙였습니다.
- 남은 확인 항목과 P11 배포 방법은 [`docs/확인필요.md`](docs/확인필요.md)에, 2026-10-28 웹 검증 기록은 [`docs/정책수치_검증_2026-10-28.md`](docs/정책수치_검증_2026-10-28.md)에 있습니다.

## 배포

`.github/workflows/ci.yml`이 모든 push에서 타입 검사·규칙 테스트·빌드를 실행합니다. `main`에 push되면 GitHub Pages로 배포합니다(저장소 Settings → Pages → Source: GitHub Actions). 공개 주소는 `https://gamer-217.github.io/gongjehoe-app/`입니다.
