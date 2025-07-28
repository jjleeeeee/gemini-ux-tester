// 간소화된 분석 타입 정의

/**
 * 업로드된 이미지 정보
 */
export interface UploadedImage {
  /** 이미지 ID */
  id: string;
  
  /** 파일 객체 */
  file: File;
  
  /** Base64 인코딩된 이미지 데이터 */
  base64: string;
  
  /** 미리보기 URL */
  previewUrl: string;
  
  /** 업로드 순서 */
  order: number;
}

/**
 * 분석 결과 인터페이스
 */
export interface AnalysisResult {
  /** 분석 ID */
  id: string;
  
  /** 분석 타임스탬프 */
  timestamp: number;
  
  /** 분석 타입 */
  type: 'general' | 'ab-test';
  
  /** 퍼소나 (선택사항) */
  persona?: string;
  
  /** 상황 (선택사항) */
  situation?: string;
  
  /** 분석 결과 텍스트 */
  results: string;
  
  /** 분석에 사용된 이미지 수 */
  imageCount: number;
  
  /** A/B 테스트 분석인 경우 개별 화면 분석 결과 */
  screenAnalysis?: ScreenAnalysis[];
}

/**
 * 개별 화면 분석 결과 (A/B 테스트용)
 */
export interface ScreenAnalysis {
  /** 화면 라벨 (A, B, C 또는 화면 1, 화면 2, 화면 3) */
  label: string;
  
  /** 화면의 장점들 */
  strengths: string[];
  
  /** 화면의 단점들 */
  weaknesses: string[];
  
  /** 개선 제안 */
  suggestions: string[];
  
  /** 전체 점수 (1-10) */
  score: number;
}