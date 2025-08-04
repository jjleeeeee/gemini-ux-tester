/**
 * API 관련 설정 통합
 */

export const API_CONFIG = {
  GEMINI_BASE_URL: 'https://generativelanguage.googleapis.com/v1beta',
  
  // 타임아웃 설정 (밀리초)
  TIMEOUT: {
    VALIDATION: 10000,      // API 키 검증: 10초
    FIRST_ATTEMPT: 45000,   // 첫 번째 시도: 45초
    RETRY_ATTEMPT: 60000,   // 재시도: 60초
    FINAL_ATTEMPT: 90000    // 최종 시도: 90초  
  },
  
  // 재시도 설정
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY: 2000,            // 2초 대기
    BACKOFF_MULTIPLIER: 1.5 // 지수 백오프
  },
  
  // 모델 설정 (안정적인 순서로 재배치)
  MODELS: [
    'gemini-1.5-flash',    // 안정적인 모델 (우선 사용)
    'gemini-1.5-pro',      // 안정적인 고성능 모델
    'gemini-2.5-flash',    // 최신 모델 (fallback)
    'gemini-2.5-pro'       // 최신 고성능 모델 (fallback)
  ] as const,
  
  // 이미지 제한
  IMAGE: {
    MAX_SIZE_KB: 4000,      // 단일 이미지 최대 4MB
    MAX_TOTAL_SIZE_KB: 8000, // 전체 이미지 최대 8MB
    MAX_COUNT: 3,           // 최대 3개 이미지
    SUPPORTED_TYPES: ['image/jpeg', 'image/png', 'image/webp'] as const
  }
} as const;

export type GeminiModel = typeof API_CONFIG.MODELS[number];
export type SupportedImageType = typeof API_CONFIG.IMAGE.SUPPORTED_TYPES[number];