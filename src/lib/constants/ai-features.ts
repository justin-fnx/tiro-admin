import { AiFeature } from '@prisma/client'

// AIDEV-NOTE: AiFeature enum 값을 한글 라벨로 변환하는 상수
export const featureLabels: Record<AiFeature, string> = {
  EPISODE_GENERATION: '에피소드 생성',
  EPISODE_REWRITE: '에피소드 다시 쓰기',
  SETTING_SUGGESTION: '설정 제안',
  ASSISTANT: '어시스턴트',
  REVIEW: '리뷰',
  CONTEXT_SNAPSHOT: '컨텍스트 스냅샷',
  ICON_SUGGESTION: '아이콘 제안',
  JSON_FIX: 'JSON 수정',
  GRAMMAR_REVIEW: '문법 검토',
  SETTINGS_REVIEW: '설정 검토',
  ANALYZE: '분석',
}
