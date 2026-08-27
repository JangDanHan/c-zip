import { GoogleGenAI } from '@google/genai'
import type { RecommendationRequest, RecommendationResponse, Recommendation } from './types'
import { getRecommendations } from './recommendation-engine'
import { WORKOUT_DATABASE } from './workout-database'
import { validateBodyPart } from './taxonomy'

// Gemini API 클라이언트 인스턴스화
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey) return null
  return new GoogleGenAI({ apiKey })
}

/**
 * 프롬프트 생성기: 사용자 조건과 카탈로그 지식을 주입하여 안전하고 정확한 추천을 유도합니다.
 */
function buildPrompt(req: RecommendationRequest): string {
  const { goal, dislikes, bodyParts, environment } = req

  const contextCatalog = WORKOUT_DATABASE.slice(0, 15)
    .map((w) => `- ${w.name} (${w.category}, 환경: ${w.environments.join('/')}, 부담부위: ${w.burdenParts.join('/') || '없음'})`)
    .join('\n')

  return `당신은 최고 수준의 운동 처방사이자 스포츠 재활 전문가입니다.
사용자의 신체 제약과 선호도를 분석하여, 위험 부담 없이 운동 목표를 달성할 수 있는 최적의 대체 운동 1~3위를 추천해주세요.

[사용자 입력 조건]
1. 운동 목표: ${goal}
2. 하기 싫은 운동 (절대 제외): ${dislikes.length > 0 ? dislikes.join(', ') : '없음'}
3. 피하고 싶은 부위 / 통증 부위 (절대 부담/충격 금지): ${bodyParts.length > 0 ? bodyParts.join(', ') : '없음'}
4. 운동 환경: ${environment}

[참고 가능한 안전 운동 데이터베이스 샘플]
${contextCatalog}

[추천 시 절대 준수 원칙]
1. '피하고 싶은 부위'에 충격이나 하중이 실리는 운동은 100% 절대 제외하세요 (예: 무릎 통증 시 런닝/스쿼트/런지 금지, 대신 실내자전거/힙브릿지/수영 등 추천).
2. '하기 싫은 운동'과 동일하거나 유사한 운동은 100% 절대 제외하세요.
3. '운동 환경'(${environment})에서 실행 가능한 운동만 추천하세요.
4. 반드시 유효한 JSON 형식으로만 응답하세요. 마크다운(\`\`\`json) 기호 없이 순수 JSON만 반환해야 합니다.

[응답 JSON 형식]
{
  "aiCoaching": "사용자의 신체 상태에 맞춘 전반적인 1~2문장의 전문 코칭 요약 코멘트",
  "recommendations": [
    {
      "rank": 1,
      "name": "운동명 (한국어)",
      "reason": "싫은 운동을 어떻게 대체하고 해당 부위에 왜 안전한지 명확한 이유",
      "volume": "구체적 세트/횟수/시간 (예: 15회 × 4세트 또는 30분 지속)",
      "caution": "해당 동작 시 관절 보호를 위한 핵심 주의사항",
      "badges": ["장점태그1", "장점태그2", "장점태그3"],
      "aiTip": "Gemini AI가 제안하는 1줄 꿀팁"
    }
  ]
}`
}

/**
 * Gemini AI 기반 지능형 운동 대체 추천 메인 함수
 * (실패 시 로컬 규칙 기반 추천 엔진으로 자동 Fallback)
 */
export async function generateAiRecommendations(
  req: RecommendationRequest
): Promise<RecommendationResponse> {
  const { goal, dislikes = [], bodyParts = [] } = req

  // 1. 기본 유효성 검사 (PRD 5-1, 5-2)
  if (!goal || !goal.trim()) {
    return {
      success: false,
      recommendations: [],
      totalCandidates: 0,
      errorCode: 'EMPTY_FIELD',
      message: '운동 목표를 선택하거나 입력해주세요.',
    }
  }

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

  const ai = getGeminiClient()

  // API 키가 없거나 설정되지 않은 경우 로컬 규칙 기반 엔진으로 즉시 실행
  if (!ai) {
    console.warn('[Gemini] API Key가 설정되지 않아 로컬 규칙 기반 엔진으로 실행합니다.')
    return {
      ...getRecommendations(req),
      isAiGenerated: false,
    }
  }

  try {
    const prompt = buildPrompt(req)

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4, // 안전하고 일관된 추천을 위해 낮은 temperature 유지
      },
    })

    const rawText = response.text?.trim()
    if (!rawText) {
      throw new Error('Gemini 응답이 비어있습니다.')
    }

    // JSON 파싱
    const parsed = JSON.parse(rawText)
    if (!parsed.recommendations || !Array.isArray(parsed.recommendations) || parsed.recommendations.length === 0) {
      throw new Error('유효한 추천 목록이 반환되지 않았습니다.')
    }

    const recommendations: Recommendation[] = parsed.recommendations.slice(0, 3).map((rec: any, idx: number) => ({
      rank: idx + 1,
      name: rec.name || '추천 운동',
      reason: rec.reason || '맞춤 추천 운동입니다.',
      volume: rec.volume || '15회 × 3세트',
      caution: rec.caution || '바른 자세를 유지하며 무리하지 마세요.',
      badges: Array.isArray(rec.badges) && rec.badges.length > 0 ? rec.badges : ['AI 맞춤 추천', '관절 보호'],
      aiTip: rec.aiTip || undefined,
    }))

    return {
      success: true,
      recommendations,
      totalCandidates: recommendations.length,
      isAiGenerated: true,
      aiCoaching: parsed.aiCoaching || `${req.goal} 목표에 맞춰 안전하게 구성된 AI 맞춤 솔루션입니다.`,
    }
  } catch (error) {
    console.error('[Gemini AI 오류, 로컬 규칙 기반 엔진으로 Fallback]:', error)
    // 100% 무중단 안정성을 위해 로컬 규칙 기반 추천으로 자동 대체
    const fallbackResult = getRecommendations(req)
    return {
      ...fallbackResult,
      isAiGenerated: false,
      aiCoaching: '💡 실시간 AI 응답 지연으로 안전한 규칙 기반 카탈로그 추천으로 즉시 전환되었습니다.',
    }
  }
}
