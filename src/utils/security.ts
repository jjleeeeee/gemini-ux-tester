/**
 * 보안 유틸리티 함수들
 * XSS 방지, 입력 검증, 보안 헤더 설정 등
 */

// XSS 방지를 위한 HTML 이스케이프 함수
export const escapeHtml = (text: string): string => {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (s) => map[s]);
};

// API 키 검증 - 기본적인 형식 확인
export const validateApiKey = (apiKey: string): { isValid: boolean; error?: string } => {
  if (!apiKey || typeof apiKey !== 'string') {
    return { isValid: false, error: 'API 키가 제공되지 않았습니다.' };
  }

  // API 키 길이 및 형식 확인
  const trimmedKey = apiKey.trim();
  
  if (trimmedKey.length < 20) {
    return { isValid: false, error: 'API 키가 너무 짧습니다.' };
  }

  if (trimmedKey.length > 200) {
    return { isValid: false, error: 'API 키가 너무 깁니다.' };
  }

  // 기본적인 영숫자 및 특수문자 확인
  const validPattern = /^[A-Za-z0-9\-_.]+$/;
  if (!validPattern.test(trimmedKey)) {
    return { isValid: false, error: 'API 키에 유효하지 않은 문자가 포함되어 있습니다.' };
  }

  return { isValid: true };
};

// 파일 이름 검증 (업로드 시 안전한 파일명 보장)
export const sanitizeFileName = (fileName: string): string => {
  // 위험한 문자들 제거
  return fileName
    // eslint-disable-next-line no-control-regex
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, '')
    .replace(/^\.+/, '') // 시작 점들 제거
    .replace(/\.+$/, '') // 끝 점들 제거
    .substring(0, 255); // 길이 제한
};

// Content Security Policy 설정을 위한 nonce 생성
export const generateNonce = (): string => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// 민감한 정보 마스킹 (로깅 시 사용)
export const maskSensitiveInfo = (text: string): string => {
  // API 키 패턴 마스킹
  return text
    .replace(/AIza[A-Za-z0-9_-]{35}/g, 'AIza***MASKED***')
    .replace(/sk-[A-Za-z0-9]{20,}/g, 'sk-***MASKED***')
    .replace(/Bearer\s+[A-Za-z0-9_-]+/gi, 'Bearer ***MASKED***');
};

// URL 검증 (외부 링크 보안)
export const validateUrl = (url: string): boolean => {
  try {
    const parsedUrl = new URL(url);
    // HTTPS만 허용하고, 안전한 도메인만 허용
    return parsedUrl.protocol === 'https:' && 
           !parsedUrl.hostname.includes('localhost') &&
           !parsedUrl.hostname.startsWith('192.168.') &&
           !parsedUrl.hostname.startsWith('10.') &&
           !parsedUrl.hostname.startsWith('172.');
  } catch {
    return false;
  }
};

// 로컬 스토리지 보안 래퍼
export const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      // 값 검증
      if (typeof value !== 'string' || value.length > 10000) {
        throw new Error('Invalid value for storage');
      }
      localStorage.setItem(key, value);
    } catch (error) {
      console.error('Secure storage error:', error);
    }
  },

  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (error) {
      console.error('Secure storage error:', error);
      return null;
    }
  },

  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Secure storage error:', error);
    }
  }
};

// 입력 값 검증을 위한 일반적인 함수
export const validateInput = {
  // 이메일 형식 검증
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  },

  // 텍스트 길이 검증
  textLength: (text: string, min: number = 0, max: number = 1000): boolean => {
    return text.length >= min && text.length <= max;
  },

  // 숫자 범위 검증
  numberRange: (num: number, min: number, max: number): boolean => {
    return !isNaN(num) && num >= min && num <= max;
  }
};

// CSP 헤더 설정 (개발 참고용)
export const getCSPHeader = (): string => {
  return [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'", // React 개발 모드에서 필요
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    "connect-src 'self' https://generativelanguage.googleapis.com https://www.google.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
};

