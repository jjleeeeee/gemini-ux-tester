export const APP_CONFIG = {
  name: 'Gemini UX Tester',
  version: '1.0.0',
  description: 'AI 기반 UX 이미지 분석 도구'
};

export const API_CONFIG = {
  geminiApiBaseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  models: {
    textOnly: 'gemini-pro',
    vision: 'gemini-pro-vision'
  }
};

export const UPLOAD_CONFIG = {
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpeg', '.jpg', '.png', '.webp']
};

export const ANALYSIS_TYPES = {
  general: {
    id: 'general',
    name: '일반 UX 분석',
    description: 'AI의 관점에서 전반적인 사용자 경험을 분석합니다.',
    icon: '🔍'
  },
  weversePickup: {
    id: 'weverse-pickup',
    name: '위버스 픽업 플로우 분석',
    description: '굿즈 픽업 예약 상황에 특화된 분석을 제공합니다.',
    icon: '📦'
  }
} as const;

export const UI_MESSAGES = {
  auth: {
    title: '🤖 Gemini UX Tester',
    subtitle: 'AI 기반 UX 이미지 분석 도구',
    apiKeyPlaceholder: 'API 키를 입력하세요',
    validating: '검증 중...',
    authenticate: 'API 키 인증',
    invalidApiKey: '유효하지 않은 API 키입니다. 다시 확인해 주세요.',
    validationError: 'API 키 검증 중 오류가 발생했습니다.'
  },
  upload: {
    prompt: 'UX 이미지를 업로드하세요',
    dragActive: '이미지를 놓아주세요',
    dragInactive: '이미지를 드래그하거나 클릭하여 선택',
    uploaded: '📸 이미지 업로드됨',
    replace: '새 이미지를 드래그하거나 클릭하여 교체'
  },
  analysis: {
    analyzing: 'AI가 분석 중...',
    startAnalysis: '🤖 AI 분석 시작',
    noResults: '분석 결과가 여기에 표시됩니다',
    uploadPrompt: '이미지를 업로드하고 분석을 시작해 보세요!'
  },
  errors: {
    uploadFailed: '이미지 업로드에 실패했습니다.',
    analysisFailed: '이미지 분석에 실패했습니다. API 키를 확인해 주세요.',
    networkError: '네트워크 오류가 발생했습니다. 다시 시도해 주세요.'
  }
};