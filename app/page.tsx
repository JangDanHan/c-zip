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

  return (
    <div className="min-h-screen w-full bg-background px-4 pb-28 pt-10 sm:pt-14">
      <div className="mx-auto w-full max-w-[640px]">
        {/* ① 헤더 */}
        <header className="flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Dumbbell className="size-6" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            스위치핏
          </h1>
          <p className="mt-2 text-pretty text-sm text-muted-foreground sm:text-base">
            피하고 싶은 운동은 빼고, 목표는 그대로
          </p>
        </header>

        {/* ② 입력 카드 */}
        <section className="mt-8 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-7">
            <Field
              icon={<Target className="size-4" />}
              label="운동 목표"
              help="가장 이루고 싶은 목표 하나를 골라주세요."
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
              label="싫은 운동"
              help="입력 후 Enter를 누르면 추가돼요. 추천 태그를 눌러도 돼요."
            >
              <TagInput
                ariaLabel="싫은 운동 입력"
                tags={dislikes}
                onChange={setDislikes}
                placeholder="예: 런닝"
                suggestions={SUGGESTED_DISLIKES}
              />
            </Field>

            <Field
              icon={<HeartPulse className="size-4" />}
              label="피하고 싶은 부위"
              help="아프거나 부담되는 부위를 알려주세요."
            >
              <TagInput
                ariaLabel="피하고 싶은 부위 입력"
                tags={bodyParts}
                onChange={(next) => {
                  setBodyParts(next)
                  setPartInvalid(false)
                }}
                placeholder="예: 무릎"
                suggestions={SUGGESTED_BODY_PARTS}
                invalid={partInvalid}
              />
            </Field>

            <Field
              icon={<MapPin className="size-4" />}
              label="운동 환경"
              help="주로 운동하는 장소를 선택해주세요."
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

        {/* ③ 실행 + 상태 */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => runRecommend(0)}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-base font-bold text-primary-foreground shadow-sm transition-all hover:brightness-105 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="size-5" />
            {isLoading ? 'AI 맞춤 분석 및 추천 중…' : 'AI 맞춤 추천받기'}
          </button>

          <div className="mt-3 flex flex-col gap-3">
            {isLoading && (
              <StatusMessage variant="loading" message="Gemini AI가 제약 조건을 분석하여 최적의 대체 운동을 찾고 있어요." />
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

        {/* ④ 결과 */}
        <section className="mt-6" aria-live="polite">
          {phase === 'initial' && <InitialState />}

          {phase === 'loading' && (
            <div className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {phase === 'result' && (
            <div className="flex flex-col gap-3">
              {aiCoaching && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-primary shadow-xs">
                  <div className="flex items-center gap-1.5 font-bold text-sm mb-1.5">
                    <Sparkles className="size-4" />
                    <span>Gemini AI 종합 맞춤 코칭</span>
                  </div>
                  <p className="text-sm leading-relaxed text-foreground text-pretty">
                    {aiCoaching}
                  </p>
                </div>
              )}

              {recommendations.map((item, i) => (
                <ResultCard key={`${item.name}-${i}`} item={item} index={i} />
              ))}
              <button
                type="button"
                onClick={handleReRecommend}
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary active:scale-[0.99]"
              >
                <RotateCcw className="size-4" />
                다시 추천받기
              </button>
            </div>
          )}

          {phase === 'empty' && (
            <div className="flex flex-col gap-3">
              <EmptyState />
              <button
                type="button"
                onClick={() => runRecommend(0)}
                className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-secondary active:scale-[0.99]"
              >
                <RotateCcw className="size-4" />
                다시 추천받기
              </button>
            </div>
          )}
        </section>
      </div>

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
        <span className="text-primary">{icon}</span>
        <span className="text-sm font-semibold text-foreground">{label}</span>
      </div>
      {children}
      <p className="text-xs leading-relaxed text-muted-foreground">{help}</p>
    </div>
  )
}

function InitialState() {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary">
        <HeartPulse className="size-7" />
      </span>
      <p className="mt-4 text-pretty text-sm font-medium leading-relaxed text-muted-foreground">
        4가지를 입력하면
        <br />
        나에게 맞는 운동을 찾아드려요.
      </p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
        <Ban className="size-7" />
      </span>
      <p className="mt-4 text-pretty text-sm font-medium leading-relaxed text-muted-foreground">
        조건에 맞는 운동을 찾지 못했어요.
        <br />
        피하고 싶은 부위를 줄여보시겠어요?
      </p>
    </div>
  )
}
