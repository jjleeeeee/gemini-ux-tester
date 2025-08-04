/**
 * 공통 타입 정의
 */

// API 응답 관련 타입
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface GeminiApiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

// 에러 관련 타입
export interface AppError {
  message: string;
  code: string;
  userMessage: string;
  timestamp: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  errors?: string[];
}

// 진행상황 관련 타입
export type ProgressCallback = (message: string, progress: number) => void;
export type FallbackCallback = (originalModel: string, fallbackModel: string, reason: string) => void;

// 모델 관련 타입
export interface ModelInfo {
  name: string;
  description: string;
  speed: 'fast' | 'medium' | 'slow';
  cost: 'low' | 'medium' | 'high';
}

// 세션 관련 타입
export interface SessionStatus {
  isActive: boolean;
  remainingMinutes: number;
  remainingSeconds: number;
  lastActivity: Date | null;
}

// 보안 관련 타입
export interface SecurityStatus {
  isSecureStorage: boolean;
  isSessionBased: boolean;
  isEncrypted: boolean;
  isMigrated: boolean;
  usingEnvKey: boolean;
}

// 이미지 관련 타입
export interface ImageValidationResult {
  isValid: boolean;
  size: number;
  sizeKB: number;
  errors: string[];
}

// 분석 관련 타입
export interface AnalysisRequest {
  images: string[];
  persona: string;
  situation: string;
  model: string;
}

export interface AnalysisResult {
  content: string;
  timestamp: number;
  model: string;
  imageCount: number;
}

// 네트워크 관련 타입
export interface NetworkQuality {
  isConnected: boolean;
  latency: number;
  quality: 'excellent' | 'good' | 'poor' | 'disconnected';
}

// 컴포넌트 Props 타입
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// 업로드된 이미지 타입 (기존과 호환성 유지)
export interface UploadedImage {
  file: File;
  previewUrl: string;
  base64: string;
}