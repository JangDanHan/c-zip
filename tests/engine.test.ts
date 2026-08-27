import test from 'node:test'
import assert from 'node:assert/strict'
import { getRecommendations } from '../lib/recommendation-engine.ts'
import { validateBodyPart } from '../lib/taxonomy.ts'

test('Sprint 4 / E2E 검증 1: 무릎 통증 시 무릎 부담 운동 100% 제외 검증', () => {
  const res = getRecommendations({
    goal: '체중감량',
    dislikes: ['런닝'],
    bodyParts: ['무릎'],
    environment: '홈트',
  })

  assert.equal(res.success, true)
  assert.ok(res.recommendations.length > 0)
  assert.ok(res.recommendations.length <= 3)

  // 무릎에 부담이 가는 운동(스쿼트, 런닝 등)이 포함되어 있지 않은지 확인
  for (const rec of res.recommendations) {
    assert.doesNotMatch(rec.name, /스쿼트|런지|런닝|줄넘기/i)
    assert.ok(rec.rank >= 1 && rec.rank <= 3)
    assert.ok(rec.volume.length > 0)
    assert.ok(rec.caution.length > 0)
  }
})

test('Sprint 4 / E2E 검증 2: 싫은 운동(런닝, 버피) 제외 필터링 검증', () => {
  const res = getRecommendations({
    goal: '체중감량',
    dislikes: ['런닝', '버피'],
    bodyParts: [],
    environment: '헬스장',
  })

  assert.equal(res.success, true)
  for (const rec of res.recommendations) {
    assert.doesNotMatch(rec.name, /런닝|버피/i)
  }
})

test('Sprint 4 / E2E 검증 3: 홈트 환경 필터링 검증 (헬스장 전용 기구 미포함)', () => {
  const res = getRecommendations({
    goal: '근력강화',
    dislikes: [],
    bodyParts: [],
    environment: '홈트',
  })

  assert.equal(res.success, true)
  for (const rec of res.recommendations) {
    assert.doesNotMatch(rec.name, /랫풀다운|레그프레스|스미스머신|케이블/i)
  }
})

test('Sprint 4 / E2E 검증 4: 다시 추천받기(재추천 다양성 seed) 동작 검증', () => {
  const req1 = {
    goal: '근력강화',
    dislikes: [],
    bodyParts: [],
    environment: '헬스장' as const,
    seed: 0,
  }
  const req2 = {
    ...req1,
    seed: 1,
  }

  const res1 = getRecommendations(req1)
  const res2 = getRecommendations(req2)

  assert.equal(res1.success, true)
  assert.equal(res2.success, true)
  // seed가 다를 때 첫 번째 추천 항목이 순환되어 다른 결과 제공
  assert.notDeepEqual(res1.recommendations, res2.recommendations)
})

test('Sprint 4 / 예외 5-1 검증: 목표 미입력 시 EMPTY_FIELD 에러 반환', () => {
  const res = getRecommendations({
    goal: '',
    dislikes: [],
    bodyParts: [],
  })

  assert.equal(res.success, false)
  assert.equal(res.errorCode, 'EMPTY_FIELD')
})

test('Sprint 4 / 예외 5-2 검증: 추상적 부위(다리) 입력 시 TOO_BROAD 감지', () => {
  const val = validateBodyPart('다리')
  assert.equal(val.type, 'TOO_BROAD')
  assert.ok(val.suggestions.includes('무릎'))
  assert.ok(val.suggestions.includes('허벅지'))

  const res = getRecommendations({
    goal: '체중감량',
    dislikes: [],
    bodyParts: ['다리'],
  })
  assert.equal(res.success, false)
  assert.equal(res.errorCode, 'TOO_BROAD')
})

test('Sprint 4 / 예외 5-3 검증: 초세부적 부위(손목관절) 입력 시 상위어 매핑 검증', () => {
  const val = validateBodyPart('손목관절')
  assert.equal(val.type, 'TOO_NARROW')
  assert.equal(val.suggestedBroadPart, '손목')
})

test('Sprint 4 / 예외 5-4 검증: 과도한 제약으로 후보 0개 시 NO_MATCH 반환', () => {
  const res = getRecommendations({
    goal: '근력강화',
    dislikes: ['힙브릿지', '브릿지', '레그컬', '카프레이즈', '푸시업', '체스트', '딥스', '플라이', '풀업', '로우', '스쿼트', '데드리프트', '플랭크', '크런치', '레그레이즈', '버드독', '사이드', '암컬', '익스텐션', '워킹', '사이클', '로잉', '밴드', '덤벨', '바벨', '맨몸', '요가', '스트레칭', '체조', '필라테스'],
    bodyParts: ['가슴', '등', '어깨', '허벅지', '허리', '무릎', '손목', '복부', '엉덩이', '종아리', '발목', '목', '팔꿈치'],
    environment: '홈트',
  })

  assert.equal(res.success, false)
  assert.equal(res.errorCode, 'NO_MATCH')
})
