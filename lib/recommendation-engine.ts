import type {
  Exercise,
  Recommendation,
  RecommendationRequest,
  RecommendationResponse,
  StandardBodyPart,
} from './types'
import { validateBodyPart, STANDARD_BODY_PARTS } from './taxonomy'
import { WORKOUT_DATABASE } from './workout-database'

/**
 * 텍스트 정규화 (공백 제거 및 소문자화)
 */
function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, '')
}

/**
 * 특정 운동이 사용자가 입력한 '싫은 운동'에 해당하는지 검사합니다.
 */
function isDisliked(exercise: Exercise, dislikes: string[]): boolean {
  if (!dislikes || dislikes.length === 0) return false

  const normalizedExerciseName = normalizeText(exercise.name)
  const normalizedAliases = exercise.aliases.map(normalizeText)

  return dislikes.some((dislike) => {
    const normDislike = normalizeText(dislike)
    if (!normDislike) return false

    if (normalizedExerciseName.includes(normDislike) || normDislike.includes(normalizedExerciseName)) {
      return true
    }

    return normalizedAliases.some(
      (alias) => alias.includes(normDislike) || normDislike.includes(alias)
    )
  })
}

/**
 * 피하고 싶은 부위 리스트를 표준 신체 부위 집합으로 변환합니다.
 */
function resolveBurdenParts(parts: string[]): Set<StandardBodyPart> {
  const standardSet = new Set<StandardBodyPart>()

  for (const rawPart of parts) {
    const val = validateBodyPart(rawPart)
    if (val.type === 'VALID') {
      standardSet.add(val.part)
    } else if (val.type === 'TOO_NARROW') {
      const broadPart = val.suggestedBroadPart as StandardBodyPart
      if (STANDARD_BODY_PARTS.includes(broadPart)) {
        standardSet.add(broadPart)
      }
    }
  }

  return standardSet
}

/**
 * 특정 운동이 피하고 싶은 부위에 부담을 주는지 검사합니다.
 */
function hasBurdenOnAvoidedParts(
  exercise: Exercise,
  avoidedParts: Set<StandardBodyPart>
): boolean {
  if (avoidedParts.size === 0) return false

  return exercise.burdenParts.some((part) => avoidedParts.has(part))
}

/**
 * 환경 적합성 검사
 */
function matchesEnvironment(exercise: Exercise, userEnv: string): boolean {
  if (!userEnv) return true
  // '집'과 '홈트' 동의어 처리
  const mappedEnv = userEnv === '집' ? '홈트' : userEnv
  return exercise.environments.includes(mappedEnv as any)
}

/**
 * 목표 적합도 점수 계산 (기본 effectiveness + 목표 일치 가산점)
 */
function calculateScore(exercise: Exercise, userGoal: string): number {
  let score = exercise.effectiveness

  const normalizedGoal = normalizeText(userGoal)
  const isDirectGoalMatch = exercise.targetGoals.some((g) =>
    normalizeText(g).includes(normalizedGoal) || normalizedGoal.includes(normalizeText(g))
  )

  if (isDirectGoalMatch) {
    score += 5
  }

  return score
}

/**
 * 추천 사유 텍스트를 생성합니다.
 */
function generateReason(exercise: Exercise, req: RecommendationRequest): string {
  const partsNotice =
    req.bodyParts && req.bodyParts.length > 0
      ? `${req.bodyParts.slice(0, 2).join('·')} 부담 없이 `
      : ''
  return `${partsNotice}${exercise.description}`
}

/**
 * 규칙 기반 추천 엔진 실행 메인 함수 (PRD 4장 & 5장)
 */
export function getRecommendations(req: RecommendationRequest): RecommendationResponse {
  const { goal, dislikes = [], bodyParts = [], environment, seed = 0 } = req

  // 1. 유효성 검증: 빈 입력값 확인 (PRD 5-1)
  if (!goal || !goal.trim()) {
    return {
      success: false,
      recommendations: [],
      totalCandidates: 0,
      errorCode: 'EMPTY_FIELD',
      message: '운동 목표를 선택하거나 입력해주세요.',
    }
  }

  // 2. 부위 유효성 검사 (대분류/소분류 감지 - PRD 5-2, 5-3)
  for (const part of bodyParts) {
    const val = validateBodyPart(part)
    if (val.type === 'TOO_BROAD') {
      return {
        success: false,
        recommendations: [],
        totalCandidates: 0,
        errorCode: 'TOO_BROAD',
        message: `'${val.input}'는 범위가 넓어요. ${val.suggestions.join(' / ')} 중 더 구체적으로 입력해주세요.`,
      }
    }
  }

  // 3. 피하고 싶은 부위 집합 추출
  const avoidedPartsSet = resolveBurdenParts(bodyParts)

  // 4. 규칙 기반 후보 운동 필터링 (PRD 4장 단계 3)
  const filteredCandidates = WORKOUT_DATABASE.filter((exercise) => {
    // 4-1. 환경 불가 운동 제외
    if (environment && !matchesEnvironment(exercise, environment)) {
      return false
    }

    // 4-2. 싫은 운동 제외
    if (isDisliked(exercise, dislikes)) {
      return false
    }

    // 4-3. 피할 부위에 부담 가는 운동 제외
    if (hasBurdenOnAvoidedParts(exercise, avoidedPartsSet)) {
      return false
    }

    return true
  })

  // 5. 후보가 0개인 경우 (PRD 5-4 매칭 실패)
  if (filteredCandidates.length === 0) {
    return {
      success: false,
      recommendations: [],
      totalCandidates: 0,
      errorCode: 'NO_MATCH',
      message: '추천을 만들지 못했어요. 입력 내용을 다시 확인하고 입력해주세요.',
    }
  }

  // 6. 목표 달성 효과도 기준 정렬 (PRD 4장 단계 4)
  const scoredCandidates = filteredCandidates
    .map((exercise) => ({
      exercise,
      score: calculateScore(exercise, goal),
    }))
    .sort((a, b) => b.score - a.score)

  // 7. "다시 추천받기" 다양성 로직 (PRD 5-6): seed에 따라 후보 풀을 순환하거나 상위 풀 내에서 다양하게 제공
  const total = scoredCandidates.length
  const pageSize = 3
  const startIndex = (seed * pageSize) % total

  let selected: Exercise[] = []
  if (total <= pageSize) {
    selected = scoredCandidates.map((c) => c.exercise)
  } else {
    for (let i = 0; i < pageSize; i++) {
      const idx = (startIndex + i) % total
      selected.push(scoredCandidates[idx].exercise)
    }
  }

  // 8. 최종 결과 포맷팅 (순위, 세트/횟수, 주의사항 텍스트 포함 - PRD 4장 단계 5)
  const recommendations: Recommendation[] = selected.map((exercise, idx) => ({
    rank: idx + 1,
    name: exercise.name,
    reason: generateReason(exercise, req),
    volume: exercise.volume,
    caution: exercise.caution,
    badges: exercise.badges,
    category: exercise.category,
  }))

  return {
    success: true,
    recommendations,
    totalCandidates: total,
  }
}
