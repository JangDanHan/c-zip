# Design System: FitRe Vitality

## Brand Identity
FitRe는 사용자의 신체적 제약과 운동 목표를 분석하여 최적의 대체 운동을 제안하는 서비스입니다. 디자인 시스템은 '임상적 정밀함(Clinical Precision)', '신뢰(Trust)', '전문성(Professional)'을 핵심 가치로 삼아 구축되었습니다.

## Color Palette
브랜드의 신뢰감과 활기를 동시에 전달하기 위해 고채도의 블루와 깨끗한 서피스 컬러를 조합합니다.

### Primary Colors
- **Brand Primary**: `#0066FF` (FitRe Blue) - 신뢰와 전문성을 상징하는 메인 컬러
- **Primary Container**: `#E0E7FF` - 강조 영역 및 보조 배경색

### Surface Colors
- **Surface**: `#F8F9FF` - 깨끗하고 넓은 공간감을 주는 배경색
- **Surface Dim**: `#CBDBF5` - 요소 간의 구분을 위한 보조 서피스 컬러
- **Surface Container Lowest**: `#FFFFFF` - 카드 및 입력 필드 배경

### Typography
정보의 명확한 전달과 가독성을 최우선으로 합니다.

- **Font Family**: `Inter`, `sans-serif` (국문/영문 공용)
- **Hierarchy**:
  - **Headline Large**: 40px, Bold, Tight line-height (메인 히어로 메시지)
  - **Headline Medium**: 32px, Bold (섹션 타이틀)
  - **Body Large**: 18px, Regular (주요 설명 문구)
  - **Body Medium**: 16px, Regular (기본 본문 및 입력 필드)
  - **Label Medium**: 14px, Medium (버튼 및 태그)

## Layout & Spacing
- **Grid**: 12컬럼 그리드 (Desktop 기준)
- **Container Max-width**: 1200px
- **Border Radius**: `8px` (Round Eight) - 모든 버튼, 카드, 입력 필드에 일관되게 적용
- **Spacing Scale**: 4px 단위를 기반으로 한 8, 16, 24, 32, 48, 64px 간격 사용

## Component Styles
### Buttons
- **Primary**: FitRe Blue 배경, White 텍스트, 8px 라운드, 좌우 여유 있는 패딩
- **Outline**: FitRe Blue 보더, FitRe Blue 텍스트, 8px 라운드
- **Hover State**: Opacity 90% 또는 미세한 Shadow 강화

### Cards
- **Style**: Surface Container Lowest 배경, 미세한 Shadow (Elevation 1), 16px~24px 내외 패딩
- **Radius**: 16px (카드 요소에는 강조를 위해 8px의 배수 사용 가능)

### Inputs
- **Style**: 1px 보더 (`#E0E0E0`), 8px 라운드, Focus 시 FitRe Blue 보더 적용
- **Placeholder**: `#94A3B8` (Slate 400)

## Tone & Manner
- **Visual**: 정제된 사진 이미지와 깔끔한 아이콘 사용, 충분한 여백(Whitespace) 확보
- **Copy**: 신뢰감을 주는 정중하고 전문적인 어조 사용 ("~해 드립니다", "~하세요")
- **Interaction**: 부드러운 페이드 인 및 슬라이드 전환 효과 사용 (0.3s duration)
