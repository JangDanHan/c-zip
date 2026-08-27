export type Goal = '체중감량' | '근력강화' | '유연성' | '체력증진' | string
export type Environment = '홈트' | '헬스장' | '야외'

export type StandardBodyPart =
  | '무릎'
  | '허벅지'
  | '종아리'
  | '발목'
  | '허리'
  | '어깨'
  | '손목'
  | '팔꿈치'
  | '목'
  | '가슴'
  | '등'
  | '복부'
  | '엉덩이'

export interface Exercise {
  id: string
  name: string
  category: '유산소' | '하체근력' | '상체근력' | '코어' | '스트레칭' | '전신'
  targetGoals: string[]
  environments: Environment[]
  burdenParts: StandardBodyPart[]
  effectiveness: number // 1 ~ 10 점수
  volume: string // 예: '20분 × 3세트', '15회 × 3세트'
  caution: string
  badges: string[]
  aliases: string[]
  description: string
}

export interface Recommendation {
  rank: number
  name: string
  reason: string
  volume: string
  caution: string
  badges: string[]
  category?: string
  aiTip?: string
}

export type BodyPartValidationResult =
  | { type: 'VALID'; part: StandardBodyPart }
  | { type: 'TOO_BROAD'; input: string; suggestions: string[] }
  | { type: 'TOO_NARROW'; input: string; suggestedBroadPart: string }
  | { type: 'UNKNOWN'; input: string }

export interface RecommendationRequest {
  goal: string
  dislikes: string[]
  bodyParts: string[]
  environment: Environment
  seed?: number
  useAi?: boolean
}

export interface RecommendationResponse {
  success: boolean
  recommendations: Recommendation[]
  totalCandidates: number
  message?: string
  errorCode?: 'EMPTY_FIELD' | 'TOO_BROAD' | 'TOO_NARROW' | 'NO_MATCH' | 'DELAY'
  isAiGenerated?: boolean
  aiCoaching?: string
}
