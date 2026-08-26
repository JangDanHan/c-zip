export type Goal = '체중감량' | '근력강화' | '유연성' | '체력증진'
export type Environment = '집' | '헬스장' | '야외'

export const GOALS: Goal[] = ['체중감량', '근력강화', '유연성', '체력증진']
export const ENVIRONMENTS: Environment[] = ['집', '헬스장', '야외']

export const SUGGESTED_DISLIKES = ['런닝', '버피', '줄넘기', '플랭크']
export const SUGGESTED_BODY_PARTS = ['무릎', '허리', '어깨', '손목', '발목']

export type Recommendation = {
  rank: number
  name: string
  reason: string
  volume: string
  caution: string
  badges: string[]
}

export const MOCK_RECOMMENDATIONS: Recommendation[] = [
  {
    rank: 1,
    name: '수영 (자유형)',
    reason: '무릎 충격 없이 전신을 쓰는 유산소 운동이에요.',
    volume: '30분 × 주 3회',
    caution: '어깨 통증이 있다면 배영으로 대체하세요.',
    badges: ['무릎 부담 없음', '전신 유산소'],
  },
  {
    rank: 2,
    name: '실내 자전거',
    reason: '하체 근력과 심폐지구력을 동시에 올릴 수 있어요.',
    volume: '20분 × 3세트',
    caution: '안장 높이를 낮추면 무릎 각도가 커져 부담이 늘어요.',
    badges: ['집에서 가능', '하체 강화'],
  },
  {
    rank: 3,
    name: '힙 브릿지',
    reason: '무릎을 굽히지 않고 둔근을 강화할 수 있어요.',
    volume: '15회 × 3세트',
    caution: '허리가 과하게 꺾이지 않게 복부에 힘을 주세요.',
    badges: ['무릎 부담 없음', '맨몸 운동'],
  },
]

// 범위가 너무 넓은 부위 입력 → 세분화 제안
export const BROAD_PARTS: Record<string, string[]> = {
  다리: ['허벅지', '종아리', '발목'],
  팔: ['어깨', '팔꿈치', '손목'],
  상체: ['어깨', '가슴', '등'],
  하체: ['허벅지', '종아리', '무릎'],
}

// 너무 세부적인 입력 → 넓히기 제안
export const NARROW_PARTS: Record<string, string> = {
  손목관절: '손목',
  손목인대: '손목',
  아킬레스건: '발목',
  전방십자인대: '무릎',
  요추4번: '허리',
}
