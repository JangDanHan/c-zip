import type { StandardBodyPart, BodyPartValidationResult } from './types'

// 대분류 (범위가 너무 넓음 - PRD 5-2 예외 처리)
export const BROAD_PARTS: Record<string, string[]> = {
  다리: ['허벅지', '종아리', '발목', '무릎'],
  팔: ['어깨', '팔꿈치', '손목'],
  상체: ['어깨', '가슴', '등', '허리', '목', '손목'],
  하체: ['허벅지', '종아리', '무릎', '발목', '엉덩이'],
  코어: ['복부', '허리'],
  몸통: ['가슴', '등', '복부', '허리'],
  전신: ['상체', '하체'],
}

// 소분류 (범위가 너무 세부적임 - PRD 5-3 예외 처리)
export const NARROW_PARTS: Record<string, string> = {
  손목관절: '손목',
  손목인대: '손목',
  손바닥: '손목',
  손가락: '손목',
  아킬레스건: '발목',
  복사뼈: '발목',
  발뒤꿈치: '발목',
  발가락: '발목',
  발바닥: '발목',
  전방십자인대: '무릎',
  후방십자인대: '무릎',
  십자인대: '무릎',
  반월판: '무릎',
  슬개골: '무릎',
  요추: '허리',
  요추4번: '허리',
  요추5번: '허리',
  디스크: '허리',
  척추기립근: '허리',
  회전근개: '어깨',
  견봉: '어깨',
  쇄골: '어깨',
  승모근: '목',
  경추: '목',
  대퇴사두: '허벅지',
  햄스트링: '허벅지',
  비복근: '종아리',
  둔근: '엉덩이',
}

// 표준 신체 부위 목록 (PRD 기준 매칭 단위)
export const STANDARD_BODY_PARTS: StandardBodyPart[] = [
  '무릎',
  '허벅지',
  '종아리',
  '발목',
  '허리',
  '어깨',
  '손목',
  '팔꿈치',
  '목',
  '가슴',
  '등',
  '복부',
  '엉덩이',
]

// 동의어/유의어 매핑 사전
export const SYNONYMS: Record<string, StandardBodyPart> = {
  무릅: '무릎',
  도가니: '무릎',
  배: '복부',
  뱃살: '복부',
  옆구리: '복부',
  힙: '엉덩이',
  엉덩: '엉덩이',
  엉치: '엉덩이',
  허벅다리: '허벅지',
  종아리살: '종아리',
  목덜미: '목',
  목뼈: '목',
  등판: '등',
  가슴살: '가슴',
}

/**
 * 사용자 입력 문자열을 검증하여 적절한 분류 결과를 반환합니다.
 */
export function validateBodyPart(input: string): BodyPartValidationResult {
  const trimmed = input.trim()
  if (!trimmed) {
    return { type: 'UNKNOWN', input }
  }

  // 1. 대분류 검사 (PRD 5-2)
  if (BROAD_PARTS[trimmed]) {
    return {
      type: 'TOO_BROAD',
      input: trimmed,
      suggestions: BROAD_PARTS[trimmed],
    }
  }

  // 2. 소분류 검사 (PRD 5-3)
  if (NARROW_PARTS[trimmed]) {
    return {
      type: 'TOO_NARROW',
      input: trimmed,
      suggestedBroadPart: NARROW_PARTS[trimmed],
    }
  }

  // 3. 표준 부위 일치 검사
  if (STANDARD_BODY_PARTS.includes(trimmed as StandardBodyPart)) {
    return { type: 'VALID', part: trimmed as StandardBodyPart }
  }

  // 4. 동의어 매핑
  if (SYNONYMS[trimmed]) {
    return { type: 'VALID', part: SYNONYMS[trimmed] }
  }

  // 5. 부분 일치 탐색
  for (const [broad, subs] of Object.entries(BROAD_PARTS)) {
    if (trimmed.includes(broad)) {
      return { type: 'TOO_BROAD', input: trimmed, suggestions: subs }
    }
  }

  for (const [narrow, target] of Object.entries(NARROW_PARTS)) {
    if (trimmed.includes(narrow)) {
      return { type: 'TOO_NARROW', input: trimmed, suggestedBroadPart: target }
    }
  }

  return { type: 'UNKNOWN', input: trimmed }
}
