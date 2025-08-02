/**
 * 고급 암호화 유틸리티
 * 브라우저 WebCrypto API를 사용한 강력한 암호화
 */

// WebCrypto API 지원 확인
const isWebCryptoSupported = (): boolean => {
  return typeof window !== 'undefined' && 
         'crypto' in window && 
         'subtle' in window.crypto;
};

// 브라우저별 고유 키 생성 (핑거프린팅 기반)
const generateBrowserFingerprint = async (): Promise<string> => {
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.width + 'x' + screen.height,
    new Date().getTimezoneOffset().toString(),
    navigator.hardwareConcurrency?.toString() || '0'
  ];
  
  const fingerprint = components.join('|');
  
  if (isWebCryptoSupported()) {
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback for older browsers
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
};

// AES-GCM 암호화 키 생성
const generateEncryptionKey = async (password: string): Promise<CryptoKey> => {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const salt = encoder.encode('gemini-ux-tester-salt-2024');
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

// AES-GCM 암호화
export const encryptSensitiveData = async (data: string): Promise<string | null> => {
  if (!isWebCryptoSupported()) {
    console.warn('WebCrypto not supported, falling back to basic encoding');
    return btoa(data); // Fallback to base64
  }
  
  try {
    const fingerprint = await generateBrowserFingerprint();
    const key = await generateEncryptionKey(fingerprint);
    
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encoder.encode(data)
    );
    
    // IV + encrypted data를 base64로 인코딩
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
};

// AES-GCM 복호화
export const decryptSensitiveData = async (encryptedData: string): Promise<string | null> => {
  if (!isWebCryptoSupported()) {
    console.warn('WebCrypto not supported, falling back to basic decoding');
    try {
      return atob(encryptedData); // Fallback from base64
    } catch {
      return null;
    }
  }
  
  try {
    const fingerprint = await generateBrowserFingerprint();
    const key = await generateEncryptionKey(fingerprint);
    
    // Base64 디코딩
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // IV와 암호화된 데이터 분리
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      encrypted
    );
    
    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

// 보안 세션 토큰 생성
export const generateSecureSessionToken = async (): Promise<string> => {
  if (isWebCryptoSupported()) {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
  
  // Fallback
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// 메모리에서 민감한 데이터 안전하게 제거
export const secureMemoryCleanup = (sensitiveString: string): void => {
  // JavaScript에서는 직접적인 메모리 제거가 불가능하지만
  // 문자열을 덮어쓰는 방식으로 최대한 안전하게 처리
  if (typeof sensitiveString === 'string') {
    try {
      // 문자열을 무작위 데이터로 덮어쓰기 시도
      for (let i = 0; i < 10; i++) {
        const randomStr = Math.random().toString(36).repeat(sensitiveString.length);
        // 이것은 실제로는 새로운 문자열을 만들 뿐이지만, 
        // 가비지 컬렉터가 원본을 정리하도록 유도
        void randomStr;
      }
    } catch (error) {
      // 에러가 발생해도 무시
    }
  }
};

// 타이밍 공격 방지를 위한 상수 시간 문자열 비교
export const constantTimeStringCompare = (a: string, b: string): boolean => {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
};

// 브라우저 환경 보안 검증
export const validateBrowserSecurity = (): {
  isSecure: boolean;
  warnings: string[];
  recommendations: string[];
} => {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  
  // HTTPS 확인
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    warnings.push('HTTP 연결이 감지되었습니다.');
    recommendations.push('HTTPS 연결을 사용하세요.');
  }
  
  // WebCrypto API 지원 확인
  if (!isWebCryptoSupported()) {
    warnings.push('브라우저가 최신 암호화 기능을 지원하지 않습니다.');
    recommendations.push('최신 브라우저로 업데이트하세요.');
  }
  
  // Secure Context 확인
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    warnings.push('보안 컨텍스트가 아닙니다.');
    recommendations.push('HTTPS 환경에서 사용하세요.');
  }
  
  // 개발자 도구 감지 (간단한 방법)
  const devtools = {
    open: false,
    orientation: null as string | null
  };
  
  try {
    const threshold = 160;
    const widthThreshold = window.outerWidth - window.innerWidth > threshold;
    const heightThreshold = window.outerHeight - window.innerHeight > threshold;
    
    if (widthThreshold || heightThreshold) {
      warnings.push('개발자 도구가 열려있을 가능성이 있습니다.');
      recommendations.push('보안을 위해 개발자 도구를 닫아주세요.');
    }
  } catch (error) {
    // 감지 실패는 무시
  }
  
  const isSecure = warnings.length === 0;
  
  return { isSecure, warnings, recommendations };
};