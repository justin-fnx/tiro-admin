// AIDEV-NOTE: 시스템 설정 타입 정의. 새로운 설정 타입 추가 시 이 파일 수정

/**
 * 시스템 설정 타입 enum
 * 각 설정 키에 대해 어떤 편집기를 사용할지 결정
 */
export enum SettingType {
  /** 법률 문서 (개인정보처리방침, 이용약관 등) */
  LEGAL_DOCUMENT = 'LEGAL_DOCUMENT',
  /** 일반 JSON 형식 */
  JSON = 'JSON',
}

/**
 * 법률 문서 설정 값의 타입
 */
export interface LegalDocumentValue {
  title: string
  content: string
  version: string
  effectiveDate: string
}

/**
 * 설정 키별 타입 매핑
 * 새로운 설정 키가 추가되면 여기에 타입을 지정
 */
export const SETTING_TYPE_MAP: Record<string, SettingType> = {
  PRIVACY_POLICY: SettingType.LEGAL_DOCUMENT,
  TERMS_OF_SERVICE: SettingType.LEGAL_DOCUMENT,
}

/**
 * 설정 키에 대한 타입 반환
 * 매핑에 없는 키는 기본값으로 JSON 타입 반환
 */
export function getSettingType(key: string): SettingType {
  return SETTING_TYPE_MAP[key] || SettingType.JSON
}

/**
 * 설정 타입별 기본값
 */
export const DEFAULT_VALUES: Record<SettingType, unknown> = {
  [SettingType.LEGAL_DOCUMENT]: {
    title: '',
    content: '',
    version: '1.0',
    effectiveDate: new Date().toISOString().split('T')[0],
  },
  [SettingType.JSON]: {},
}

/**
 * 설정 타입별 라벨
 */
export const SETTING_TYPE_LABELS: Record<SettingType, string> = {
  [SettingType.LEGAL_DOCUMENT]: '법률 문서',
  [SettingType.JSON]: 'JSON',
}

/**
 * 법률 문서 값인지 검증하는 타입 가드
 */
export function isLegalDocumentValue(value: unknown): value is LegalDocumentValue {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.title === 'string' &&
    typeof v.content === 'string' &&
    typeof v.version === 'string' &&
    typeof v.effectiveDate === 'string'
  )
}
