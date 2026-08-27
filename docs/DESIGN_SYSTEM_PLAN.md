# 🎨 디자인 시스템 톤앤매너 개편 계획서 (FitRe Vitality UI/UX Refactoring)
> **관련 문서**: [design.md](file:///c:/zip/design.md) | [PRD.md](file:///c:/zip/PRD.md)
> **버전**: v1.0.0 (FitRe Vitality)
> **목표**: design.md에 정의된 FitRe Vitality 디자인 시스템을 기반으로 전체 서비스의 브랜드 아이덴티티, 컬러 팔레트, 타이포그래피, 컴포넌트 룩앤필 및 전문적 톤앤매너 전면 개편

---

## 1. 개편 배경 및 핵심 목표

기존의 캐주얼하고 둥근 톤(스위치핏 / 민트-틸 계열)에서, **임상적 정밀함(Clinical Precision)**, **신뢰(Trust)**, **전문성(Professional)**을 핵심 가치로 삼는 **FitRe Vitality** 디자인 시스템으로 전면 전환합니다.

### 🎯 핵심 5대 개편 축
1. **Brand & Identity**: 스위치핏 ➔ **FitRe (핏리)** 브랜드명 및 전문 헬스케어 카피라이팅 전환
2. **Color Palette**: 고채도 FitRe Blue (#0066FF), Primary Container (#E0E7FF), 클린 Surface (#F8F9FF) 적용
3. **Typography**: Inter + Noto Sans KR 계층 구조 (Headline Large 40px, Medium 32px, Body 18/16px, Label 14px)
4. **Shape & Radius (Round Eight)**: 버튼/입력필드/칩에 **8px 라운드**, 카드 요소에 **16px 라운드** 적용
5. **Tone & Manner**: 신뢰감 있는 전문 의료/피트니스 어조 (~해 드립니다, ~하세요) 및 절제된 마이크로 인터랙션 (0.3s)

---

## 2. 세부 디자인 시스템 토큰 매핑

| 구분 | 이전 스타일 | FitRe Vitality 신규 토큰 (design.md) | 매핑 클래스 / CSS 변수 |
|---|---|---|---|
| **Brand Primary** | Teal (oklch 0.52 0.078 187) | **FitRe Blue (#0066FF)** | --primary: #0066FF / bg-primary |
| **Primary Container** | Secondary Teal (#E6F4F1) | **Light Blue (#E0E7FF)** | --primary-container: #E0E7FF |
| **Surface (배경)** | Light Gray-Green (#F2F7F5) | **Clean Soft Blue (#F8F9FF)** | --background: #F8F9FF |
| **Surface Dim** | Muted Slate | **Subtle Blue Border (#CBDBF5)** | --border: #CBDBF5 / --surface-dim |
| **Cards / Inputs BG** | White (#FFFFFF) | **Surface Lowest (#FFFFFF)** | --card: #FFFFFF |
| **Border Radius** | 24px~32px (Pill/Very Round) | **8px (Buttons/Inputs) / 16px (Cards)** | rounded-lg (8px), rounded-2xl (16px) |
| **Typography** | Noto Sans KR (24px Title) | **Inter + Noto Sans KR (40px/32px/18px/16px/14px)** | font-sans, text-4xl, text-2xl, text-lg |
| **Placeholder** | Generic Gray | **Slate 400 (#94A3B8)** | placeholder:text-[#94A3B8] |

---

## 3. 컴포넌트별 개편 작업 계획

### 3.1 글로벌 테마 및 레이아웃 (app/globals.css, app/layout.tsx)
- app/globals.css: FitRe Blue (#0066FF), Surface (#F8F9FF), Primary Container (#E0E7FF), Radius 8px/16px 토큰 재정의
- app/layout.tsx: 메타데이터 타이틀(FitRe · 임상 기반 운동 대체 추천), 테마 색상(#0066FF) 및 Inter 폰트 설정

### 3.2 메인 히어로 및 헤더 (app/page.tsx)
- 브랜드명 FitRe (핏리) 및 Headline Large (40px) 히어로 섹션 구축
- 신뢰감을 주는 서브헤드: 임상적 정밀함으로 분석하는 나만의 안전한 대체 운동 솔루션

### 3.3 입력 컴포넌트 (components/chip-group.tsx, components/tag-input.tsx)
- **ChipGroup**: 8px 라운드, 미선택 시 #FFFFFF 배경 + #CBDBF5 보더, 선택 시 FitRe Blue (#0066FF) 배경/텍스트 강조
- **TagInput**: 8px 라운드, 1px 보더 (#E0E0E0), Focus 시 FitRe Blue 보더, 태그 뱃지에 8px 라운드 및 #E0E7FF 배경 적용

### 3.4 실행 버튼 및 상태 피드백 (app/page.tsx, components/status-message.tsx)
- **Primary CTA 버튼**: FitRe Blue (#0066FF) 배경, White 텍스트, 8px 라운드, Elevation 1 섀도우, 0.3s 인터랙션
- **StatusMessage**: 전문적 안내 톤앤매너로 카피 정비, 8px 라운드 박스 디자인

### 3.5 결과 카드 및 AI 코칭 영역 (components/result-card.tsx, components/skeleton-card.tsx)
- **ResultCard**: 16px 라운드, Surface Container Lowest (#FFFFFF) 배경, Elevation 1 섀도우, 24px 패딩
- 순위 뱃지: 8px 라운드 또는 세련된 미니멀 뱃지 적용
- 주의사항: 깔끔한 소프트 앰버/블루 하이라이트 박스 (#E0E7FF / #FEF3C7)
- AI 코칭 카드: FitRe Blue 테두리와 #E0E7FF 소프트 배경으로 임상적 전문성 강화

---

## 4. 실행 순서 (Phased Execution)

1. **Step 1: 디자인 토큰 구축 (app/globals.css, app/layout.tsx)**
   - FitRe Vitality CSS 변수 및 Tailwind 설정 갱신
2. **Step 2: 핵심 컴포넌트 스타일링 (chip-group.tsx, tag-input.tsx, result-card.tsx)**
   - 8px/16px 라운드 및 FitRe Blue 컬러 시스템 적용
3. **Step 3: 메인 페이지 및 카피라이팅 전면 개편 (app/page.tsx)**
   - FitRe 브랜드 전환 및 전문 헬스케어 어조 일괄 적용
4. **Step 4: 테스트 및 빌드 검증 (npm test, npm run build)**
   - 기능/회귀 테스트 100% 통과 검증
5. **Step 5: Vercel 프로덕션 배포 및 라이브 확인**
