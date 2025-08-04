/**
 * 통합 에러 핸들링 시스템
 */

import { APP_CONSTANTS } from '../config/constants';
import { AppError } from '../config/types';
import { maskSensitiveInfo } from './security';

export class CustomError extends Error implements AppError {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly timestamp: number;

  constructor(
    message: string,
    code: string,
    userMessage: string
  ) {
    super(message);
    this.name = 'CustomError';
    this.code = code;
    this.userMessage = userMessage;
    this.timestamp = Date.now();
  }
}

export enum ErrorCodes {
  // 네트워크 에러
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
  
  // API 에러
  API_KEY_INVALID = 'API_KEY_INVALID',
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  API_SERVER_ERROR = 'API_SERVER_ERROR',
  API_BAD_REQUEST = 'API_BAD_REQUEST',
  
  // 입력 검증 에러
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  IMAGE_TOO_LARGE = 'IMAGE_TOO_LARGE',
  IMAGE_INVALID_FORMAT = 'IMAGE_INVALID_FORMAT',
  NO_IMAGES = 'NO_IMAGES',
  
  // 세션 에러
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  
  // 일반 에러
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export class ErrorHandler {
  /**
   * API 에러를 사용자 친화적인 에러로 변환
   */
  static handleApiError(error: any): CustomError {
    // Axios 에러 구조 분석
    const status = error.response?.status;
    const message = error.message || 'Unknown error';
    
    if (!error.response) {
      // 네트워크 에러
      if (error.code === 'ECONNABORTED') {
        return new CustomError(
          'Request timeout',
          ErrorCodes.TIMEOUT_ERROR,
          '요청 시간이 초과되었습니다. 네트워크 상태를 확인하거나 이미지 크기를 줄여보세요.'
        );
      }
      
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return new CustomError(
          'Connection failed',
          ErrorCodes.CONNECTION_ERROR,
          APP_CONSTANTS.ERROR_MESSAGES.NETWORK
        );
      }
      
      return new CustomError(
        'Network error',
        ErrorCodes.NETWORK_ERROR,
        APP_CONSTANTS.ERROR_MESSAGES.NETWORK
      );
    }
    
    // HTTP 상태 코드별 처리
    switch (status) {
      case 400:
        return new CustomError(
          'Bad request',
          ErrorCodes.API_BAD_REQUEST,
          '잘못된 요청입니다. 이미지 형식이나 크기를 확인해 주세요.'
        );
        
      case 401:
      case 403:
        return new CustomError(
          'API key invalid',
          ErrorCodes.API_KEY_INVALID,
          APP_CONSTANTS.ERROR_MESSAGES.API_KEY_INVALID
        );
        
      case 429:
        return new CustomError(
          'Quota exceeded',
          ErrorCodes.API_QUOTA_EXCEEDED,
          APP_CONSTANTS.ERROR_MESSAGES.QUOTA_EXCEEDED
        );
        
      case 500:
      case 502:
      case 503:
      case 504:
        return new CustomError(
          'Server error',
          ErrorCodes.API_SERVER_ERROR,
          APP_CONSTANTS.ERROR_MESSAGES.SERVER_ERROR
        );
        
      default:
        return new CustomError(
          `HTTP ${status}: ${message}`,
          ErrorCodes.UNKNOWN_ERROR,
          '예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'
        );
    }
  }
  
  /**
   * 검증 에러 생성
   */
  static createValidationError(message: string, userMessage: string): CustomError {
    return new CustomError(message, ErrorCodes.VALIDATION_ERROR, userMessage);
  }
  
  /**
   * 이미지 관련 에러 생성
   */
  static createImageError(type: 'size' | 'format' | 'missing'): CustomError {
    switch (type) {
      case 'size':
        return new CustomError(
          'Image too large',
          ErrorCodes.IMAGE_TOO_LARGE,
          APP_CONSTANTS.ERROR_MESSAGES.IMAGE_TOO_LARGE
        );
        
      case 'format':
        return new CustomError(
          'Invalid image format',
          ErrorCodes.IMAGE_INVALID_FORMAT,
          '지원하지 않는 이미지 형식입니다. JPG, PNG, WebP 파일을 사용해 주세요.'
        );
        
      case 'missing':
        return new CustomError(
          'No images provided',
          ErrorCodes.NO_IMAGES,
          APP_CONSTANTS.ERROR_MESSAGES.NO_IMAGES
        );
        
      default:
        return new CustomError(
          'Image error',
          ErrorCodes.UNKNOWN_ERROR,
          '이미지 처리 중 오류가 발생했습니다.'
        );
    }
  }
  
  /**
   * 세션 관련 에러 생성
   */
  static createSessionError(): CustomError {
    return new CustomError(
      'Session expired',
      ErrorCodes.SESSION_EXPIRED,
      APP_CONSTANTS.ERROR_MESSAGES.SESSION_EXPIRED
    );
  }
  
  /**
   * 에러 로깅 (민감한 정보 마스킹 포함, 개발 환경에서만 상세 로그)
   */
  static logError(error: any, context?: string): void {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const timestamp = new Date().toISOString();
    const contextStr = context ? `[${context}]` : '';
    
    if (error instanceof CustomError) {
      // API 서버 에러는 콘솔 로그 최소화
      if (error.code === ErrorCodes.API_SERVER_ERROR) {
        if (isDevelopment) {
          console.warn(`${timestamp} ${contextStr} API 서버 일시적 문제 - 사용자에게 안내됨`);
        }
        return;
      }
      
      // 기타 에러는 기존 방식 유지
      if (isDevelopment) {
        console.error(`${timestamp} ${contextStr} CustomError:`, {
          code: error.code,
          message: maskSensitiveInfo(error.message),
          userMessage: error.userMessage,
          timestamp: error.timestamp
        });
      } else {
        console.info(`${timestamp} ${contextStr} Error handled: ${error.code}`);
      }
    } else {
      if (isDevelopment) {
        console.error(`${timestamp} ${contextStr} Error:`, {
          message: maskSensitiveInfo(error.message || 'Unknown error'),
          stack: error.stack ? maskSensitiveInfo(error.stack) : undefined
        });
      } else {
        console.info(`${timestamp} ${contextStr} Error handled gracefully`);
      }
    }
  }
  
  /**
   * 사용자에게 표시할 에러 메시지 추출
   */
  static getUserMessage(error: any): string {
    if (error instanceof CustomError) {
      return error.userMessage;
    }
    
    // 일반 에러에서 사용자 친화적 메시지 추출 시도
    if (error.message?.includes('fetch')) {
      return APP_CONSTANTS.ERROR_MESSAGES.NETWORK;
    }
    
    return '예기치 않은 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }
  
  /**
   * 에러가 재시도 가능한지 확인
   */
  static isRetryable(error: any): boolean {
    if (error instanceof CustomError) {
      return [
        ErrorCodes.NETWORK_ERROR,
        ErrorCodes.TIMEOUT_ERROR,
        ErrorCodes.CONNECTION_ERROR,
        ErrorCodes.API_SERVER_ERROR
      ].includes(error.code as ErrorCodes);
    }
    
    return false;
  }
}