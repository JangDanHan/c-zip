'use client'

import { useRef, useState } from 'react'
import { Dumbbell, Target, Ban, MapPin, HeartPulse, RotateCcw, Sparkles } from 'lucide-react'
import { ChipGroup } from '@/components/chip-group'
import { TagInput } from '@/components/tag-input'
import { ResultCard } from '@/components/result-card'
import { SkeletonCard } from '@/components/skeleton-card'
import { StatusMessage, type StatusVariant } from '@/components/status-message'
import { StateSwitcher, type PreviewKey } from '@/components/state-switcher'
import {
  GOALS,
  ENVIRONMENTS,
  SUGGESTED_DISLIKES,
  SUGGESTED_BODY_PARTS,
  BROAD_PARTS,
  NARROW_PARTS,
  getRecommendations,
  validateBodyPart,
  type Goal,
  type Environment,
  type Recommendation,
  type RecommendationResponse,
} from '@/lib/workout-data'

type Phase = 'initial' | 'loading' | 'result' | 'empty'
type Notice = {
  variant: StatusVariant
  message: string
  suggestions?: string[]
} | null

export default function Page() {
  const [goal, setGoal] = useState<Goal | null>(null)
  const [dislikes, setDislikes] = useState<string[]>([])
  const [bodyParts, setBodyParts] = useState<string[]>([])
  const [environment, setEnvironment] = useState<Environment | null>(null)

  const [phase, setPhase] = useState<Phase>('initial')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [reRecommendCount, setReRecommendCount] = useState(0)
  const [notice, setNotice] = useState<Notice>(null)
  const [goalInvalid, setGoalInvalid] = useState(false)
  const [partInvalid, setPartInvalid] = useState(false)
  const [preview, setPreview] = useState<PreviewKey | null>(null)
  const [aiCoaching, setAiCoaching] = useState<string | null>(null)
  const [useAi, setUseAi] = useState(true)

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function clearNotices() {
    setNotice(null)
    setGoalInvalid(false)
    setPartInvalid(false)
  }

  async function runRecommend(seedOffset = 0) {
    setPreview(null)
    clearNotices()
    setAiCoaching(null)

    // 1. 미입력 검증 (PRD 5-1)
    if (!goal) {
      setGoalInvalid(true)
      setNotice({ variant: 'error', message: '운동 목표를 선택해주세요.' })
      return
    }

    // 2. 범위가 너무 넓은 부위 (PRD 5-2)
    for (const part of bodyParts) {
      const val = validateBodyPart(part)
      if (val.type === 'TOO_BROAD') {
        setPartInvalid(true)
        setNotice({
          variant: 'hint',
          message: `'${val.input}'는 범위가 넓어요. 아래에서 더 구체적으로 골라주세요.`,
          suggestions: val.suggestions,
        })
        return
      }
    }

    // 3. 입력이 너무 세부적 (PRD 5-3)
    for (const part of bodyParts) {
      const val = validateBodyPart(part)
      if (val.type === 'TOO_NARROW') {
        setPartInvalid(true)
        setNotice({
          variant: 'hint',
          message: `입력이 너무 세부적이에요. '${val.suggestedBroadPart}' 정도로 조금 더 넓게 입력해주세요.`,
          suggestions: [val.suggestedBroadPart],
        })
        return
      }
    }

    // 4. 로딩 → 추천 실행 (PRD 4장 & 5-5)
    setPhase('loading')
    if (timer.current) clearTimeout(timer.current)

    try {
      // 서버 API Route 호출 (Gemini AI 연동)
      const res = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal,
          dislikes,
          bodyParts,
          environment: environment || '홈트',
          seed: seedOffset,
          useAi,
        }),
      })

      const data: RecommendationResponse = await res.json()

      if (data.success && data.recommendations && data.recommendations.length > 0) {
        setRecommendations(data.recommendations)
        if (data.aiCoaching) {
          setAiCoaching(data.aiCoaching)
        }
        setPhase('result')
      } else {
        // Fallback: 로컬 규칙 기반 엔진 재시도
        const localFallback = getRecommendations({
          goal,
          dislikes,
          bodyParts,
          environment: environment || '홈트',
          seed: seedOffset,
        })

        if (localFallback.success && localFallback.recommendations.length > 0) {
          setRecommendations(localFallback.recommendations)
          setPhase('result')
        } else {
          setRecommendations([])
          setPhase('empty')
          setNotice({
            variant: 'empty',
            message: data.message || localFallback.message || '추천을 만들지 못했어요. 입력 내용을 다시 확인하고 입력해주세요.',
          })
        }
      }
    } catch {
      // 네트워크 장애 시 로컬 추천 엔진으로 완전 Fallback
      const localResult = getRecommendations({
        goal,
        dislikes,
        bodyParts,
        environment: environment || '홈트',
        seed: seedOffset,
      })

      if (localResult.success && localResult.recommendations.length > 0) {
        setRecommendations(localResult.recommendations)
        setPhase('result')
      } else {
        setRecommendations([])
        setPhase('empty')
        setNotice({
          variant: 'empty',
          message: localResult.message || '추천을 만들지 못했어요. 입력 내용을 다시 확인하고 입력해주세요.',
        })
      }
    }
  }

  function handleReRecommend() {
    const nextSeed = reRecommendCount + 1
    setReRecommendCount(nextSeed)
    runRecommend(nextSeed)
  }

  function applySuggestion(value: string) {
    setBodyParts((prev) => {
      const filtered = prev.filter((p) => !BROAD_PARTS[p] && !NARROW_PARTS[p])
      return filtered.includes(value) ? filtered : [...filtered, value]
    })
    clearNotices()
  }

  function reset() {
    if (timer.current) clearTimeout(timer.current)
    setGoal(null)
    setDislikes([])
    setBodyParts([])
    setEnvironment(null)
    setPhase('initial')
    setPreview(null)
    clearNotices()
  }

  // 미리보기 스위처: 실제 로직과 무관하게 각 UI 상태를 강제 표시
  function handlePreview(key: PreviewKey) {
    if (timer.current) clearTimeout(timer.current)
    setPreview(key)
    clearNotices()
    switch (key) {
      case 'initial':
        setPhase('initial')
        break
      case 'loading':
        setPhase('loading')
        break
      case 'result':
        setPhase('result')
        break
      case 'err-missing':
        setPhase('initial')
        setGoalInvalid(true)
        setNotice({ variant: 'error', message: '운동 목표를 선택해주세요.' })
        break
      case 'err-broad':
        setPhase('initial')
        setPartInvalid(true)
        setNotice({
          variant: 'hint',
          message: "'다리'는 범위가 넓어요. 아래에서 더 구체적으로 골라주세요.",
          suggestions: BROAD_PARTS['다리'],
        })
        break
      case 'err-narrow':
        setPhase('initial')
        setPartInvalid(true)
        setNotice({
          variant: 'hint',
          message: "입력이 너무 세부적이에요. '손목' 정도로 조금 더 넓게 입력해주세요.",
          suggestions: ['손목'],
        })
        break
      case 'empty':
        setPhase('empty')
        setNotice({
          variant: 'empty',
          message: '조건에 맞는 운동을 찾지 못했어요. 피하고 싶은 부위를 줄여보시겠어요?',
        })
        break
    }
  }

  const isLoading = phase === 'loading'
  const toolRef = useRef<HTMLDivElement>(null)

  function scrollToTool() {
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="min-h-screen w-full bg-[#f8f9ff] text-[#0b1c30] font-sans antialiased selection:bg-[#dae1ff] selection:text-[#0050cb]">
      {/* TopAppBar */}
      <header className="fixed top-0 left-0 w-full z-50 flex justify-between items-center px-4 md:px-8 h-16 bg-[#f8f9ff]/90 backdrop-blur-md border-b border-[#cbdbf5]/50 transition-all duration-300">
        <div className="flex items-center gap-2.5 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <span className="flex size-9 items-center justify-center rounded-xl bg-[#0050cb] text-white shadow-xs group-hover:scale-105 transition-transform">
            <Dumbbell className="size-5" />
          </span>
          <span className="text-xl font-extrabold text-[#0050cb] tracking-tight">FitRe</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 h-full">
          <a
            className="text-sm text-[#0050cb] font-bold border-b-2 border-[#0050cb] h-full flex items-center px-2 hover:opacity-80 transition-opacity"
            href="#"
          >
            홈
          </a>
          <a
            className="text-sm text-[#424656] hover:text-[#0050cb] transition-colors duration-200 h-full flex items-center px-2 font-medium"
            href="#how-it-works"
          >
            이용 방법
          </a>
          <a
            className="text-sm text-[#424656] hover:text-[#0050cb] transition-colors duration-200 h-full flex items-center px-2 font-medium"
            href="#science"
          >
            과학적 접근
          </a>
        </nav>

        <button
          type="button"
          onClick={scrollToTool}
          className="bg-[#0050cb] hover:bg-[#0066ff] text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-all duration-300 shadow-[0px_4px_12px_rgba(0,80,203,0.25)] hover:shadow-[0px_6px_16px_rgba(0,80,203,0.35)] active:scale-95 flex items-center gap-2"
        >
          <span>시작하기</span>
          <Sparkles className="size-4" />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center w-full pt-16">
        {/* Hero Section */}
        <section className="w-full max-w-[640px] mx-auto px-4 md:px-0 pt-12 md:pt-20 pb-12 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#dce9ff] text-[#0050cb] text-xs font-semibold mb-6 border border-[#b3c5ff]/40 shadow-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#0050cb] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0050cb]"></span>
            </span>
            Clinical Precision Engine v2.0
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-5xl font-extrabold text-[#0b1c30] tracking-tight mb-5 leading-tight break-keep">
            당신의 목표. <br /> 당신의 몸. <br />
            <span className="text-[#0050cb] relative inline-block">
              통증 없는 운동.
              <svg className="absolute w-full h-3 -bottom-1 left-0 text-[#dae1ff] opacity-60" preserveAspectRatio="none" viewBox="0 0 100 10">
                <path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="4"></path>
              </svg>
            </span>
          </h1>

          <p className="text-base sm:text-lg text-[#424656] max-w-[480px] mb-8 leading-relaxed break-keep">
            맞지 않는 운동을 억지로 하지 마세요. FitRe의 임상 엔진은 당신의 목표와 신체적 제약을 분석하여 완벽한 대체 운동을 제공합니다. 전문가의 추천으로 불확실성을 없앱니다.
          </p>

          <div className="flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={scrollToTool}
              className="bg-[#0050cb] hover:bg-[#0066ff] text-white text-base font-bold px-8 py-4 rounded-full transition-all duration-300 shadow-[0px_8px_24px_rgba(0,80,203,0.3)] hover:shadow-[0px_12px_32px_rgba(0,80,203,0.4)] hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>나의 대체 운동 찾기</span>
              <Sparkles className="size-4" />
            </button>
            <a
              href="#how-it-works"
              className="bg-transparent border-2 border-[#c2c6d8] hover:border-[#0050cb] hover:text-[#0050cb] text-[#5d5e61] text-base font-semibold px-8 py-4 rounded-full transition-all duration-300 flex items-center justify-center gap-2 w-full sm:w-auto group"
            >
              <span>이용 방법</span>
              <span className="group-hover:translate-y-1 transition-transform">↓</span>
            </a>
          </div>

          {/* Hero Image Context & Floating Comparison Card */}
          <div className="mt-12 w-full relative rounded-[24px] overflow-hidden shadow-[0px_12px_32px_rgba(0,0,0,0.08)] bg-white border border-[#c2c6d8]/30 aspect-[4/3] md:aspect-video">
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10 rounded-[24px]"></div>
            <img
              className="w-full h-full object-cover rounded-[24px]"
              alt="FitRe Clinical Exercise Formulation"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCUCp_qyIWyAiK6OxquXzIqZeJRPOCUnNUSQMtYIRxNz_Urz9k9nb6mIW13mRyA6VNcRiYTA1CnhfObwj-kpffCleyDHjti81OEa7TQTKy6ltZlwK8yU02FJp-Lxa9D_uLsj4IimoBFbh1QvWXTbLxFjAeoL2DhHXu42I7ACsMTTu97qGmPKjnF4XGwiAm0a47Q2B7FdCMNQYHXJ-dCxG9PV8oe3_hE7eGBxQvuhuPiWtlrvRHlYcTiNA"
            />
            {/* Floating UI Element over Hero Image */}
            <div className="absolute bottom-5 left-5 right-5 z-20 flex flex-col sm:flex-row gap-3 justify-between items-end">
              <div className="bg-[#f8f9ff]/95 backdrop-blur-md p-4 rounded-xl shadow-lg border border-white/40 w-full sm:w-auto text-left">
                <div className="flex items-center gap-2 mb-1.5 text-xs sm:text-sm font-medium text-[#ba1a1a]">
                  <Ban className="size-4 shrink-0 text-[#ba1a1a]" />
                  <span>피할 운동: 바벨 스쿼트</span>
                </div>
                <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0050cb]">
                  <HeartPulse className="size-4 shrink-0 text-[#0050cb]" />
                  <span>추천 운동: 불가리안 스플릿 스쿼트</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Proposition / Bento Grid Section */}
        <section id="science" className="w-full bg-[#eff4ff] py-16 border-y border-[#cbdbf5]/50">
          <div className="max-w-[640px] mx-auto px-4 md:px-0">
            <div className="text-center mb-10">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30] mb-3">
                당신의 현실을 고려한 설계
              </h2>
              <p className="text-sm sm:text-base text-[#424656] max-w-[420px] mx-auto break-keep">
                우리는 단순히 인기 있는 운동을 추천하지 않습니다. 임상 데이터를 기반으로 유해한 운동을 필터링합니다.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card 1 */}
              <div className="bg-white rounded-[20px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/30 flex flex-col gap-3 hover:shadow-[0px_12px_28px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="size-11 rounded-full bg-[#0066ff] text-white flex items-center justify-center mb-1 shadow-xs">
                  <Target className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#0b1c30]">개인별 맞춤형 회피</h3>
                <p className="text-sm text-[#424656] leading-relaxed break-keep">
                  어디가 아픈지, 어떤 운동이 싫은지, 혹은 어떤 장비가 없는지 알려주세요. 엔진이 부적합한 동작을 추천 전에 적극적으로 제외합니다.
                </p>
              </div>

              {/* Card 2 */}
              <div className="bg-white rounded-[20px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/30 flex flex-col gap-3 hover:shadow-[0px_12px_28px_rgba(0,0,0,0.08)] transition-all duration-300">
                <div className="size-11 rounded-full bg-[#0050cb] text-white flex items-center justify-center mb-1 shadow-xs">
                  <Sparkles className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-[#0b1c30]">과학적 정밀함</h3>
                <p className="text-sm text-[#424656] leading-relaxed break-keep">
                  추천은 생체 역학적 유사성, 근육 관여 중복도, 임상적 안전성 프로필 및 Gemini AI 모델에 따라 정밀하게 순위가 매겨집니다.
                </p>
              </div>

              {/* Card 3 (Full width) */}
              <div className="md:col-span-2 bg-white rounded-[20px] p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-[#c2c6d8]/30 flex flex-col md:flex-row gap-6 items-center hover:shadow-[0px_12px_28px_rgba(0,0,0,0.08)] transition-all duration-300 relative overflow-hidden">
                <div className="flex-1 flex flex-col gap-3 relative z-10">
                  <div className="size-11 rounded-full bg-[#c84600] text-white flex items-center justify-center mb-1 shadow-xs">
                    <MapPin className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold text-[#0b1c30]">언제 어디서나</h3>
                  <p className="text-sm text-[#424656] leading-relaxed break-keep">
                    완벽하게 갖춰진 헬스장, 호텔 방, 혹은 공원 등 어디에 있든 현재 환경에 맞춰 최적의 운동을 조정합니다.
                  </p>
                </div>
                <div className="w-full md:w-52 flex flex-col gap-2 relative z-10">
                  <div className="bg-[#f8f9ff] py-2 px-3.5 rounded-lg border border-[#c2c6d8]/40 flex items-center gap-2 text-xs font-semibold text-[#0b1c30]">
                    <span className="text-[#0050cb]">✓</span>
                    <span>홈 트레이닝</span>
                  </div>
                  <div className="bg-[#f8f9ff] py-2 px-3.5 rounded-lg border border-[#c2c6d8]/40 flex items-center gap-2 text-xs font-semibold text-[#0b1c30]">
                    <span className="text-[#0050cb]">✓</span>
                    <span>피트니스 센터</span>
                  </div>
                  <div className="bg-[#f8f9ff] py-2 px-3.5 rounded-lg border border-[#c2c6d8]/40 flex items-center gap-2 text-xs font-semibold text-[#0b1c30]">
                    <span className="text-[#0050cb]">✓</span>
                    <span>맨몸 야외 운동</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 🎯 실제 서비스 진입 영역 (대체 운동 처방 진단기) */}
        <section ref={toolRef} id="how-it-works" className="w-full max-w-[640px] px-4 md:px-0 py-16">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#dce9ff] text-[#0050cb] text-xs font-bold mb-3">
              <Sparkles className="size-3.5" />
              STEP-BY-STEP DIAGNOSIS
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0b1c30]">
              맞춤 대체 운동 처방 진단기
            </h2>
            <p className="mt-2 text-sm text-[#424656] text-pretty">
              4가지 조건을 입력하시면 FitRe 임상 AI 엔진이 즉시 최적의 대체 운동을 도출해 드립니다.
            </p>
          </div>

          {/* 입력 카드 */}
          <div className="rounded-[24px] border border-[#cbdbf5] bg-white p-6 sm:p-8 shadow-[0px_8px_24px_rgba(0,0,0,0.04)]">
            <div className="flex flex-col gap-7">
              <Field
                icon={<Target className="size-4" />}
                label="1. 운동 목표"
                help="달성하고자 하는 가장 주된 목표를 선택해주세요."
              >
                <ChipGroup
                  ariaLabel="운동 목표"
                  options={GOALS}
                  value={goal}
                  invalid={goalInvalid}
                  onChange={(v) => {
                    setGoal(v)
                    setGoalInvalid(false)
                    setNotice(null)
                  }}
                />
              </Field>

              <Field
                icon={<Ban className="size-4" />}
                label="2. 하기 싫은 운동"
                help="기피하거나 하기 싫은 운동을 입력 후 Enter를 누르거나 추천 태그를 선택해주세요."
              >
                <TagInput
                  ariaLabel="싫은 운동 입력"
                  tags={dislikes}
                  onChange={setDislikes}
                  placeholder="예: 런닝, 버피"
                  suggestions={SUGGESTED_DISLIKES}
                />
              </Field>

              <Field
                icon={<HeartPulse className="size-4" />}
                label="3. 피하고 싶은 부위 (통증 부위)"
                help="부담을 주지 말아야 할 관절이나 통증 부위를 알려주세요."
              >
                <TagInput
                  ariaLabel="피하고 싶은 부위 입력"
                  tags={bodyParts}
                  onChange={(next) => {
                    setBodyParts(next)
                    setPartInvalid(false)
                  }}
                  placeholder="예: 무릎, 허리"
                  suggestions={SUGGESTED_BODY_PARTS}
                  invalid={partInvalid}
                />
              </Field>

              <Field
                icon={<MapPin className="size-4" />}
                label="4. 운동 환경"
                help="주로 운동을 수행할 장소를 선택해주세요."
              >
                <ChipGroup
                  ariaLabel="운동 환경"
                  options={ENVIRONMENTS}
                  value={environment}
                  onChange={(v) => setEnvironment(v)}
                />
              </Field>
            </div>
          </div>

          {/* 실행 버튼 & 상태 피드백 영역 */}
          <div className="mt-6">
            <button
              type="button"
              onClick={() => runRecommend(0)}
              disabled={isLoading}
              className="w-full bg-[#0050cb] hover:bg-[#0066ff] text-white text-base font-bold py-4 px-6 rounded-full transition-all duration-300 shadow-[0px_8px_24px_rgba(0,80,203,0.3)] hover:shadow-[0px_12px_32px_rgba(0,80,203,0.4)] active:scale-98 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Sparkles className="size-5" />
              {isLoading ? 'FitRe AI 임상 분석 및 처방 중…' : 'AI 맞춤 대체 운동 처방받기'}
            </button>

            <div className="mt-4 flex flex-col gap-3">
              {isLoading && (
                <StatusMessage variant="loading" message="FitRe AI가 제약 조건을 분석하여 관절에 안전한 최적의 대체 운동을 찾고 있습니다." />
              )}
              {notice && (
                <StatusMessage
                  variant={notice.variant}
                  message={notice.message}
                  suggestions={notice.suggestions}
                  onSuggestion={applySuggestion}
                />
              )}
            </div>
          </div>

          {/* 결과 영역 */}
          <section className="mt-8" aria-live="polite">
            {phase === 'initial' && <InitialState onStart={scrollToTool} />}

            {phase === 'loading' && (
              <div className="flex flex-col gap-3.5">
                {[0, 1, 2].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            )}

            {phase === 'result' && (
              <div className="flex flex-col gap-4">
                {aiCoaching && (
                  <div className="rounded-[20px] border border-[#0050cb]/30 bg-[#dce9ff]/60 p-5 text-[#0b1c30] shadow-xs">
                    <div className="flex items-center gap-2 font-bold text-sm text-[#0050cb] mb-2">
                      <Sparkles className="size-4" />
                      <span>FitRe AI 임상 종합 코칭 리포트</span>
                    </div>
                    <p className="text-sm leading-relaxed text-[#424656] text-pretty font-medium">
                      {aiCoaching}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <h3 className="text-base font-bold text-[#0b1c30]">
                    처방된 대체 운동 (효과도 1~3위)
                  </h3>
                  <span className="text-xs text-[#424656] font-medium">
                    {recommendations.length}개 운동 도출
                  </span>
                </div>

                {recommendations.map((item, i) => (
                  <ResultCard key={`${item.name}-${i}`} item={item} index={i} />
                ))}

                <button
                  type="button"
                  onClick={handleReRecommend}
                  className="mt-3 flex items-center justify-center gap-2 rounded-full border border-[#cbdbf5] bg-white px-6 py-3.5 text-sm font-semibold text-[#0b1c30] transition-all duration-200 hover:border-[#0050cb] hover:text-[#0050cb] hover:bg-[#f8f9ff] active:scale-98 shadow-xs"
                >
                  <RotateCcw className="size-4" />
                  다른 대체 운동 조합 추천받기
                </button>
              </div>
            )}

            {phase === 'empty' && (
              <div className="flex flex-col gap-3">
                <EmptyState />
                <button
                  type="button"
                  onClick={() => runRecommend(0)}
                  className="flex items-center justify-center gap-2 rounded-full border border-[#cbdbf5] bg-white px-6 py-3.5 text-sm font-semibold text-[#0b1c30] transition-colors hover:bg-slate-50 active:scale-98"
                >
                  <RotateCcw className="size-4" />
                  다시 시도하기
                </button>
              </div>
            )}
          </section>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full bg-[#eff4ff] py-10 px-4 flex flex-col items-center gap-4 mt-12 border-t border-[#c2c6d8]/30">
        <div className="text-sm font-bold text-[#0050cb] flex items-center gap-2">
          <Dumbbell className="size-4" />
          FitRe
        </div>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-[#5d5e61]">
          <a className="hover:text-[#0050cb] underline transition-colors" href="#">이용약관</a>
          <a className="hover:text-[#0050cb] underline transition-colors" href="#">개인정보처리방침</a>
          <a className="hover:text-[#0050cb] underline transition-colors" href="#">고객 지원</a>
        </nav>
        <p className="text-xs text-[#5d5e61] text-center max-w-xs">
          © 2026 FitRe. Athletic Precision & Clinical Reliability.
        </p>
      </footer>

      <StateSwitcher active={preview} onSelect={handlePreview} />
    </div>
  )
}

function Field({
  icon,
  label,
  help,
  children,
}: {
  icon: React.ReactNode
  label: string
  help: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2.5 text-left">
      <div className="flex items-center gap-2">
        <span className="text-[#0050cb]">{icon}</span>
        <span className="text-sm font-bold text-[#0b1c30]">{label}</span>
      </div>
      {children}
      <p className="text-xs leading-relaxed text-[#424656]">{help}</p>
    </div>
  )
}

function InitialState({ onStart }: { onStart?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-[#cbdbf5] bg-white px-6 py-12 text-center shadow-xs">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[#dce9ff] text-[#0050cb]">
        <HeartPulse className="size-7" />
      </span>
      <h4 className="mt-4 text-base font-bold text-[#0b1c30]">맞춤 처방 준비 완료</h4>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-[#424656]">
        위 4가지 조건을 선택하시고 <strong>[AI 맞춤 대체 운동 처방받기]</strong>를 누르시면
        <br className="hidden sm:inline" />
        임상 분석 결과가 즉시 출력됩니다.
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-[20px] border border-dashed border-[#cbdbf5] bg-white px-6 py-12 text-center shadow-xs">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-[#e2e2e5] text-[#5d5e61]">
        <Ban className="size-7" />
      </span>
      <h4 className="mt-4 text-base font-bold text-[#0b1c30]">조건에 맞는 운동을 찾지 못했습니다</h4>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-[#424656]">
        제약 조건이 과도하게 설정되었습니다.
        <br />
        피하고 싶은 부위나 싫은 운동을 1~2개 줄여서 다시 시도해주세요.
      </p>
    </div>
  )
}
