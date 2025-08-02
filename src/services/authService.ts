import { GeminiApiService } from './geminiApi';
import { validateApiKey, secureStorage, maskSensitiveInfo } from '../utils/security';

export class AuthService {
  private static readonly API_KEY_STORAGE_KEY = 'gemini_api_key';
  private static readonly LEGACY_STORAGE_KEY = 'gemini_api_key_legacy';

  static saveApiKey(apiKey: string): void {
    // 보안 검증 후 저장
    const validation = validateApiKey(apiKey);
    if (!validation.isValid) {
      throw new Error(validation.error || 'Invalid API key format');
    }
    
    secureStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    console.log('API key saved successfully');
  }

  static getApiKey(): string | null {
    // 먼저 환경변수에서 확인
    const envApiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (envApiKey && envApiKey.trim() !== '') {
      return envApiKey.trim();
    }
    
    // 기존 localStorage에서 마이그레이션 체크
    this.migrateFromLegacyStorage();
    
    // 보안 강화된 sessionStorage에서 확인
    return secureStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  // 기존 localStorage에서 새로운 암호화된 sessionStorage로 마이그레이션
  private static migrateFromLegacyStorage(): void {
    try {
      // 기존 localStorage에서 API 키 확인
      const legacyKey = localStorage.getItem(this.API_KEY_STORAGE_KEY);
      if (legacyKey && !secureStorage.getItem(this.API_KEY_STORAGE_KEY)) {
        console.log('Migrating API key from localStorage to secure sessionStorage...');
        
        // 새로운 보안 스토리지로 이동
        secureStorage.setItem(this.API_KEY_STORAGE_KEY, legacyKey);
        
        // 기존 localStorage에서 제거
        localStorage.removeItem(this.API_KEY_STORAGE_KEY);
        
        // 마이그레이션 완료 플래그 설정
        localStorage.setItem(this.LEGACY_STORAGE_KEY, 'migrated');
        
        console.log('Migration completed. API key is now securely stored.');
      }
    } catch (error: any) {
      console.error('Migration error:', maskSensitiveInfo(error?.message || 'Unknown error'));
    }
  }

  static clearApiKey(): void {
    secureStorage.removeItem(this.API_KEY_STORAGE_KEY);
    // 보안 세션 전체 정리
    secureStorage.clearSession();
    console.log('API key and session cleared');
  }

  static async validateAndSaveApiKey(apiKey: string): Promise<boolean> {
    try {
      // 입력 검증
      const trimmedKey = apiKey.trim();
      const validation = validateApiKey(trimmedKey);
      
      if (!validation.isValid) {
        console.error('API key validation failed:', validation.error);
        return false;
      }

      // Gemini API 실제 검증
      const geminiService = new GeminiApiService(trimmedKey);
      const isValid = await geminiService.validateApiKey();
      
      if (isValid) {
        this.saveApiKey(trimmedKey);
        return true;
      }
      return false;
    } catch (error: any) {
      // 민감한 정보 마스킹하여 로깅
      const maskedError = maskSensitiveInfo(error.message || 'Unknown error');
      console.error('API Key validation error:', maskedError);
      return false;
    }
  }

  static isAuthenticated(): boolean {
    const apiKey = this.getApiKey();
    if (!apiKey) return false;
    
    // 저장된 API 키의 기본 형식 검증
    const validation = validateApiKey(apiKey);
    return validation.isValid;
  }

  // 환경변수 API 키 사용 여부 확인
  static isUsingEnvApiKey(): boolean {
    const envApiKey = process.env.REACT_APP_GEMINI_API_KEY;
    return !!(envApiKey && envApiKey.trim() !== '');
  }

  // 보안 상태 확인
  static getSecurityStatus(): {
    isSecureStorage: boolean;
    isSessionBased: boolean;
    isEncrypted: boolean;
    isMigrated: boolean;
    usingEnvKey: boolean;
  } {
    return {
      isSecureStorage: true, // 항상 secureStorage 사용
      isSessionBased: true, // sessionStorage 기반
      isEncrypted: true, // 암호화된 저장
      isMigrated: localStorage.getItem(this.LEGACY_STORAGE_KEY) === 'migrated',
      usingEnvKey: this.isUsingEnvApiKey()
    };
  }

  // 보안 상태 로깅 (디버깅용)
  static logSecurityStatus(): void {
    const status = this.getSecurityStatus();
    console.log('🔒 API Key Security Status:', {
      '✅ 보안 스토리지': status.isSecureStorage,
      '✅ 세션 기반': status.isSessionBased, 
      '✅ 암호화 저장': status.isEncrypted,
      '✅ 마이그레이션 완료': status.isMigrated,
      '🔑 환경변수 사용': status.usingEnvKey
    });
  }
}

export default AuthService;