import { NextResponse } from 'next/server'
import { generateAiRecommendations } from '@/lib/gemini'
import { getRecommendations } from '@/lib/recommendation-engine'
import type { RecommendationRequest } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RecommendationRequest
    const { goal, dislikes = [], bodyParts = [], environment, useAi = true, seed = 0 } = body

    if (!goal || !goal.trim()) {
      return NextResponse.json(
        {
          success: false,
          recommendations: [],
          totalCandidates: 0,
          errorCode: 'EMPTY_FIELD',
          message: '운동 목표를 선택하거나 입력해주세요.',
        },
        { status: 400 }
      )
    }

    let result
    if (useAi) {
      result = await generateAiRecommendations({
        goal,
        dislikes,
        bodyParts,
        environment,
        seed,
      })
    } else {
      result = getRecommendations({
        goal,
        dislikes,
        bodyParts,
        environment,
        seed,
      })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('API Route /api/recommend error:', error)
    return NextResponse.json(
      {
        success: false,
        recommendations: [],
        totalCandidates: 0,
        errorCode: 'NO_MATCH',
        message: '추천 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      },
      { status: 500 }
    )
  }
}
