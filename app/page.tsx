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
    <div className="min-h-screen w-full bg-[#F8F9FF] text-slate-900 selection:bg-[#E0E7FF] selection:text-[#0066FF]">
      {/* 상단 글로벌 네비게이션 바 */}
      <header className="sticky top-0 z-40 w-full border-b border-[#CBDBF5]/60 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-[#0066FF] text-white shadow-xs">
              <Dumbbell className="size-5" />
            </span>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-slate-900">FitRe</span>
              <span className="ml-1 text-xs font-semibold text-[#0066FF]">Vitality</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden rounded-lg bg-[#E0E7FF] px-3 py-1 text-xs font-semibold text-[#0066FF] sm:inline-block">
              Clinical Precision AI
            </span>
            <button
              type="button"
              onClick={scrollToTool}
              className="rounded-lg bg-[#0066FF] px-4 py-2 text-xs sm:text-sm font-semibold text-white transition-all duration-200 hover:bg-[#0052cc] hover:shadow-xs active:scale-98"
            >
              처방 시작하기
            </button>
          </div>
        </div>
      </header>

      {/* 🌟 메인 히어로 & 서비스 소개 섹션 */}
      <section className="relative overflow-hidden border-b border-[#CBDBF5]/40 bg-gradient-to-b from-white via-[#F8F9FF] to-[#F8F9FF] px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#CBDBF5] bg-white px-4 py-1.5 text-xs font-semibold text-[#0066FF] shadow-xs">
            <Sparkles className="size-3.5 text-[#0066FF]" />
            <span>임상적 정밀함 기반 운동 대체 처방 솔루션</span>
          </div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-5xl sm:leading-tight text-balance">
            통증과 부상 위험은 배제하고,
            <br />
            <span className="text-[#0066FF]">운동 목표는 100% 달성하세요</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg text-pretty">
            FitRe(핏리)는 관절 통증이나 기피 운동 등 사용자의 신체적 제약과 운동 목표를 정밀 분석하여,
            부상 위험 없이 안전하게 실행할 수 있는 <strong>최적의 1~3위 대체 운동</strong>을 즉시 처방해 드립니다.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <button
              type="button"
              onClick={scrollToTool}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-8 py-4 text-base font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#0052cc] hover:shadow-md active:scale-[0.99] sm:w-auto"
            >
              <Sparkles className="size-5" />
              지금 무료 맞춤 처방받기
            </button>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
              <span>✓ 5초 즉시 처방</span>
              <span>•</span>
              <span>✓ 회원가입/DB 불필요</span>
              <span>•</span>
              <span>✓ 100% 무료 분석</span>
            </div>
          </div>

          {/* 3대 핵심 가치 카드 */}
          <div className="mt-14 grid grid-cols-1 gap-4 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-[#CBDBF5] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0066FF]/40 hover:shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#E0E7FF] text-[#0066FF]">
                <HeartPulse className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">부상 부위 100% 배제</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                무릎, 허리, 어깨 등 통증이나 부담이 가는 관절에 충격이 실리지 않도록 정밀 필터링합니다.
              </p>
            </div>

            <div className="rounded-2xl border border-[#CBDBF5] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0066FF]/40 hover:shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#E0E7FF] text-[#0066FF]">
                <Ban className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">기피 운동 스마트 대체</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                런닝, 버피 등 하기 싫은 운동을 제외하면서도 동일한 칼로리 소모와 근력 효과를 내는 운동을 찾습니다.
              </p>
            </div>

            <div className="rounded-2xl border border-[#CBDBF5] bg-white p-6 shadow-xs transition-all duration-200 hover:border-[#0066FF]/40 hover:shadow-sm">
              <div className="flex size-10 items-center justify-center rounded-lg bg-[#E0E7FF] text-[#0066FF]">
                <Sparkles className="size-5" />
              </div>
              <h3 className="mt-4 text-base font-bold text-slate-900">Gemini AI 맞춤 코칭</h3>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">
                임상 전문가 수준의 맞춤 세트/횟수와 관절 보호 주의사항을 개인화하여 제공해 드립니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 실제 서비스 진입 영역 (대체 운동 처방 진단기) */}
      <main ref={toolRef} id="diagnosis-tool" className="mx-auto w-full max-w-[640px] px-4 pb-28 pt-12">
        <div className="text-center">
          <span className="rounded-lg bg-[#E0E7FF] px-3 py-1 text-xs font-bold text-[#0066FF]">
            STEP-BY-STEP DIAGNOSIS
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            맞춤 대체 운동 진단기
          </h2>
          <p className="mt-2 text-sm text-slate-600 text-pretty">
            4가지 조건을 선택하시면 FitRe AI가 최적의 운동 조합을 처방해 드립니다.
          </p>
        </div>

        {/* 입력 카드 */}
        <section className="mt-8 rounded-2xl border border-[#CBDBF5] bg-white p-6 shadow-xs sm:p-7">
          <div className="flex flex-col gap-7">
            <Field
              icon={<Target className="size-4" />}
              label="1. 운동 목표"
              help="가장 이루고 싶은 핵심 목표 하나를 선택해주세요."
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
              help="기피하는 운동을 입력 후 Enter를 누르거나 아래 추천 칩을 눌러주세요."
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
              help="통증이 있거나 부담을 피하고 싶은 관절/신체 부위를 알려주세요."
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
              help="운동을 진행할 주된 장소를 선택해주세요."
            >
              <ChipGroup
                ariaLabel="운동 환경"
                options={ENVIRONMENTS}
                value={environment}
                onChange={(v) => setEnvironment(v)}
              />
            </Field>
          </div>
        </section>

        {/* 실행 버튼 & 상태 피드백 영역 */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => runRecommend(0)}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-6 py-4 text-base font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#0052cc] hover:shadow-md active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="size-5" />
            {isLoading ? 'FitRe AI 임상 분석 및 처방 중…' : 'AI 맞춤 대체 운동 처방받기'}
          </button>

          <div className="mt-3.5 flex flex-col gap-3">
            {isLoading && (
              <StatusMessage variant="loading" message="FitRe AI가 제약 조건을 임상 분석하여 최적의 대체 운동을 찾고 있습니다." />
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
                <div className="rounded-2xl border border-[#0066FF]/30 bg-[#E0E7FF]/50 p-5 text-slate-800 shadow-xs">
                  <div className="flex items-center gap-2 font-bold text-sm text-[#0066FF] mb-2">
                    <Sparkles className="size-4" />
                    <span>FitRe AI 임상 종합 코칭 리포트</span>
                  </div>
                  <p className="text-sm leading-relaxed text-slate-700 text-pretty font-medium">
                    {aiCoaching}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <h3 className="text-base font-bold text-slate-900">
                  처방된 대체 운동 (효과도 1~3위)
                </h3>
                <span className="text-xs text-slate-500 font-medium">
                  {recommendations.length}개 운동 도출
                </span>
              </div>

              {recommendations.map((item, i) => (
                <ResultCard key={`${item.name}-${i}`} item={item} index={i} />
              ))}

              <button
                type="button"
                onClick={handleReRecommend}
                className="mt-3 flex items-center justify-center gap-2 rounded-lg border border-[#CBDBF5] bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition-all duration-150 hover:border-[#0066FF] hover:text-[#0066FF] hover:bg-[#F8F9FF] active:scale-[0.99] shadow-xs"
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
                className="flex items-center justify-center gap-2 rounded-lg border border-[#CBDBF5] bg-white px-6 py-3.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50 active:scale-[0.99]"
              >
                <RotateCcw className="size-4" />
                다시 시도하기
              </button>
            </div>
          )}
        </section>
      </main>

      {/* 푸터 */}
      <footer className="border-t border-[#CBDBF5]/60 bg-white py-8 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-4xl px-4">
          <p className="font-semibold text-slate-700">FitRe Vitality · Clinical Precision Exercise System</p>
          <p className="mt-1">사용자의 안전과 지속 가능한 운동 습관을 위한 전문 대체 운동 처방 서비스입니다.</p>
        </div>
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
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center gap-2">
        <span className="text-[#0066FF]">{icon}</span>
        <span className="text-sm font-bold text-slate-900">{label}</span>
      </div>
      {children}
      <p className="text-xs leading-relaxed text-slate-500">{help}</p>
    </div>
  )
}

function InitialState({ onStart }: { onStart?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#CBDBF5] bg-white px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-xl bg-[#E0E7FF] text-[#0066FF]">
        <HeartPulse className="size-7" />
      </span>
      <h4 className="mt-4 text-base font-bold text-slate-900">맞춤 처방 준비 완료</h4>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-slate-600">
        위 4가지 조건을 선택하시고 <strong>[AI 맞춤 대체 운동 처방받기]</strong>를 누르시면
        <br className="hidden sm:inline" />
        임상 분석 결과가 즉시 출력됩니다.
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-dashed border-[#CBDBF5] bg-white px-6 py-12 text-center">
      <span className="flex size-14 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
        <Ban className="size-7" />
      </span>
      <h4 className="mt-4 text-base font-bold text-slate-900">조건에 맞는 운동을 찾지 못했습니다</h4>
      <p className="mt-2 text-pretty text-sm leading-relaxed text-slate-600">
        제약 조건이 과도하게 설정되었습니다.
        <br />
        피하고 싶은 부위나 싫은 운동을 1~2개 줄여서 다시 시도해주세요.
      </p>
    </div>
  )
}
