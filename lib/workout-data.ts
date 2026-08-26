export * from './types'
export * from './taxonomy'
export * from './workout-database'
export * from './recommendation-engine'

export const GOALS = ['체중감량', '근력강화', '유연성', '체력증진'] as const
export const ENVIRONMENTS = ['홈트', '헬스장', '야외'] as const

export const SUGGESTED_DISLIKES = ['런닝', '버피', '줄넘기', '플랭크', '스쿼트', '턱걸이']
export const SUGGESTED_BODY_PARTS = ['무릎', '허리', '어깨', '손목', '발목', '목']

export const MOCK_RECOMMENDATIONS = [
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
    badges: ['홈트 가능', '하체 강화'],
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
