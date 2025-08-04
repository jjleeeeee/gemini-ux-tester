/**
 * 애플리케이션 상수값들 통합
 */

export const APP_CONSTANTS = {
  // 애플리케이션 정보
  APP: {
    NAME: 'Gemini UX Tester',
    VERSION: '0.1.0',
    DESCRIPTION: 'AI 기반 UX 분석 도구'
  },
  
  // 세션 관리
  SESSION: {
    TIMEOUT: 30 * 60 * 1000,        // 30분
    CLEANUP_INTERVAL: 5 * 60 * 1000, // 5분
    STORAGE_KEY: 'session_last_activity'
  },
  
  // 스토리지 키
  STORAGE_KEYS: {
    API_KEY: 'gemini_api_key',
    LEGACY_API_KEY: 'gemini_api_key_legacy',
    SESSION_CRYPTO_KEY: 'session_crypto_key'
  },
  
  // UI 설정
  UI: {
    ANIMATION_DELAY: {
      FAST: 100,
      NORMAL: 200,
      SLOW: 300
    },
    PROGRESS: {
      UPDATE_INTERVAL: 100,
      SMOOTH_TRANSITION: 300
    }
  },
  
  // 분석 설정
  ANALYSIS: {
    MAX_IMAGES: 3,
    SUPPORTED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'] as const,
    DEFAULT_MODEL: 'gemini-2.5-flash' as const
  },
  
  // 에러 메시지
  ERROR_MESSAGES: {
    NETWORK: '인터넷 연결을 확인해 주세요.',
    API_KEY_INVALID: 'API 키가 유효하지 않습니다. 올바른 Gemini API 키를 입력해 주세요.',
    QUOTA_EXCEEDED: 'API 사용량 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.',
    SERVER_ERROR: '서버에 일시적인 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    IMAGE_TOO_LARGE: '이미지 크기가 너무 큽니다. 4MB 이하의 이미지를 사용해 주세요.',
    NO_IMAGES: '이미지를 먼저 업로드해 주세요.',
    SESSION_EXPIRED: '세션이 만료되었습니다. 다시 로그인해 주세요.'
  },
  
  // 성공 메시지
  SUCCESS_MESSAGES: {
    API_KEY_SAVED: 'API 키가 성공적으로 저장되었습니다.',
    ANALYSIS_COMPLETE: '분석이 완료되었습니다!',
    SESSION_EXTENDED: '세션이 연장되었습니다.'
  }
} as const;

export type SupportedFormat = typeof APP_CONSTANTS.ANALYSIS.SUPPORTED_FORMATS[number];
export type DefaultModel = typeof APP_CONSTANTS.ANALYSIS.DEFAULT_MODEL;