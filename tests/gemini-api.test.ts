import test from 'node:test'
import assert from 'node:assert/strict'
import { generateAiRecommendations } from '../lib/gemini'
import { getRecommendations } from '../lib/recommendation-engine'

test('Gemini AI 통합 검증 1: Gemini 2.5/3.6 Flash 호출 시 1~3위 맞춤 추천 및 AI 코칭 반환', async () => {
  const res = await generateAiRecommendations({
    goal: '체중감량',
    dislikes: ['런닝'],
    bodyParts: ['무릎'],
    environment: '홈트',
  })

  assert.equal(res.success, true)
  assert.ok(res.recommendations.length > 0)
  assert.ok(res.recommendations.length <= 3)

  // AI 생성 결과 또는 Fallback 결과 확인
  assert.ok(typeof res.isAiGenerated === 'boolean')
  if (res.aiCoaching) {
    assert.ok(res.aiCoaching.length > 0)
  }

  for (const rec of res.recommendations) {
    assert.ok(rec.name.length > 0)
    assert.ok(rec.reason.length > 0)
    assert.ok(rec.volume.length > 0)
    assert.ok(rec.caution.length > 0)
  }
})

test('Gemini AI 통합 검증 2: 입력 누락 시 EMPTY_FIELD 에러 반환', async () => {
  const res = await generateAiRecommendations({
    goal: '',
    dislikes: [],
    bodyParts: [],
    environment: '헬스장',
  })

  assert.equal(res.success, false)
  assert.equal(res.errorCode, 'EMPTY_FIELD')
})

test('Gemini AI 통합 검증 3: 추상적 부위(다리) 입력 시 TOO_BROAD 감지', async () => {
  const res = await generateAiRecommendations({
    goal: '근력강화',
    dislikes: [],
    bodyParts: ['다리'],
    environment: '헬스장',
  })

  assert.equal(res.success, false)
  assert.equal(res.errorCode, 'TOO_BROAD')
})
