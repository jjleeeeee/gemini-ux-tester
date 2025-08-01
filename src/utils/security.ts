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

// 브라우저 세션별 고유 암호화 키 생성 (보안 강화)
const getSessionKey = (): string => {
  const sessionId = sessionStorage.getItem('session_crypto_key');
  if (sessionId) return sessionId;
  
  // 브라우저 세션별 고유 키 생성 (더 강력한 키 생성)
  const browserFingerprint = getBrowserFingerprint();
  const timestamp = Date.now().toString(36);
  const randomPart = generateNonce();
  
  const newKey = `${browserFingerprint}_${timestamp}_${randomPart}`;
  sessionStorage.setItem('session_crypto_key', newKey);
  return newKey;
};

// 브라우저 지문 생성 (세션별 고유성 향상)
const getBrowserFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Security fingerprint', 2, 2);
  }
  
  const fingerprint = [
    navigator.userAgent,
    navigator.language,
    window.screen.width + 'x' + window.screen.height,
    new Date().getTimezoneOffset(),
    canvas.toDataURL()
  ].join('|');
  
  // 간단한 해시 생성
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // 32비트 정수로 변환
  }
  
  return Math.abs(hash).toString(36);
};

// 강화된 XOR 암호화/복호화 (다중 키 + 솔트)
const enhancedEncrypt = (text: string, key: string): string => {
  try {
    // 솔트 생성 (4바이트)
    const salt = new Uint8Array(4);
    crypto.getRandomValues(salt);
    const saltString = Array.from(salt, byte => byte.toString(16).padStart(2, '0')).join('');
    
    // 키와 솔트 결합
    const combinedKey = key + saltString;
    
    // 다중 라운드 XOR 암호화
    let result = text;
    for (let round = 0; round < 3; round++) {
      let roundResult = '';
      for (let i = 0; i < result.length; i++) {
        const keyChar = combinedKey.charCodeAt((i + round * 7) % combinedKey.length);
        const textChar = result.charCodeAt(i);
        roundResult += String.fromCharCode(textChar ^ keyChar ^ (round + 1));
      }
      result = roundResult;
    }
    
    // 솔트 + 암호화된 데이터를 Base64로 인코딩
    return btoa(saltString + '::' + result);
  } catch (error: any) {
    console.error('Encryption error:', error);
    return btoa(text); // 실패 시 단순 Base64만
  }
};

const enhancedDecrypt = (encrypted: string, key: string): string => {
  try {
    const decoded = atob(encrypted);
    const parts = decoded.split('::');
    
    if (parts.length !== 2) {
      // 이전 단순 암호화 형식인 경우 호환성 유지
      return simpleDecrypt(encrypted, key);
    }
    
    const saltString = parts[0];
    const encryptedData = parts[1];
    
    // 키와 솔트 결합
    const combinedKey = key + saltString;
    
    // 다중 라운드 XOR 복호화 (역순)
    let result = encryptedData;
    for (let round = 2; round >= 0; round--) {
      let roundResult = '';
      for (let i = 0; i < result.length; i++) {
        const keyChar = combinedKey.charCodeAt((i + round * 7) % combinedKey.length);
        const encryptedChar = result.charCodeAt(i);
        roundResult += String.fromCharCode(encryptedChar ^ keyChar ^ (round + 1));
      }
      result = roundResult;
    }
    
    return result;
  } catch (error: any) {
    console.error('Decryption error:', error);
    return '';
  }
};

// 기존 단순 암호화 (호환성 유지)
const simpleDecrypt = (encrypted: string, key: string): string => {
  try {
    const decoded = atob(encrypted);
    let result = '';
    for (let i = 0; i < decoded.length; i++) {
      result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch {
    return '';
  }
};

// 보안 강화된 스토리지 래퍼
export const secureStorage = {
  setItem: (key: string, value: string): void => {
    try {
      // 값 검증
      if (typeof value !== 'string' || value.length > 10000) {
        throw new Error('Invalid value for storage');
      }
      
      // 세션 키로 강화된 암호화하여 저장
      const sessionKey = getSessionKey();
      const encrypted = enhancedEncrypt(value, sessionKey);
      
      // localStorage 대신 sessionStorage 사용 (브라우저 종료 시 자동 삭제)
      sessionStorage.setItem(key, encrypted);
      
      // 추가 보안: localStorage에는 해시된 키로만 존재 여부 저장
      const hashedKey = btoa(key + '_exists');
      localStorage.setItem(hashedKey, 'true');
      
    } catch (error: any) {
      console.error('Secure storage error:', maskSensitiveInfo(error?.message || 'Unknown error'));
    }
  },

  getItem: (key: string): string | null => {
    try {
      // sessionStorage에서 암호화된 값 가져오기
      const encrypted = sessionStorage.getItem(key);
      if (!encrypted) return null;
      
      // 세션 키로 강화된 복호화
      const sessionKey = getSessionKey();
      const decrypted = enhancedDecrypt(encrypted, sessionKey);
      
      return decrypted || null;
    } catch (error: any) {
      console.error('Secure storage error:', maskSensitiveInfo(error?.message || 'Unknown error'));
      return null;
    }
  },

  removeItem: (key: string): void => {
    try {
      // sessionStorage에서 삭제
      sessionStorage.removeItem(key);
      
      // localStorage에서도 존재 여부 플래그 삭제
      const hashedKey = btoa(key + '_exists');
      localStorage.removeItem(hashedKey);
      
    } catch (error: any) {
      console.error('Secure storage error:', maskSensitiveInfo(error?.message || 'Unknown error'));
    }
  },

  // 보안 세션 초기화
  clearSession: (): void => {
    try {
      sessionStorage.removeItem('session_crypto_key');
      // API 키 관련 항목들 정리
      sessionStorage.removeItem('gemini_api_key');
    } catch (error: any) {
      console.error('Session clear error:', error);
    }
  }
};

// 민감한 데이터 메모리 관리 클래스
export class SecureMemory {
  private static sensitiveData = new Map<string, { value: string; timestamp: number }>();
  private static readonly EXPIRY_TIME = 30 * 60 * 1000; // 30분
  
  // 민감한 데이터 임시 저장
  static store(key: string, value: string): void {
    this.sensitiveData.set(key, {
      value,
      timestamp: Date.now()
    });
    
    // 만료된 데이터 정리
    this.cleanup();
  }
  
  // 민감한 데이터 조회
  static retrieve(key: string): string | null {
    const data = this.sensitiveData.get(key);
    if (!data) return null;
    
    // 만료 확인
    if (Date.now() - data.timestamp > this.EXPIRY_TIME) {
      this.sensitiveData.delete(key);
      return null;
    }
    
    return data.value;
  }
  
  // 민감한 데이터 즉시 삭제
  static delete(key: string): void {
    this.sensitiveData.delete(key);
  }
  
  // 만료된 데이터 정리
  private static cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    this.sensitiveData.forEach((data, key) => {
      if (now - data.timestamp > this.EXPIRY_TIME) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => {
      this.sensitiveData.delete(key);
    });
  }
  
  // 전체 민감한 데이터 정리
  static clearAll(): void {
    this.sensitiveData.clear();
  }
}

// 자동 메모리 정리 (5분마다)
if (typeof window !== 'undefined') {
  setInterval(() => {
    SecureMemory.clearAll();
  }, 5 * 60 * 1000);
}

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

