import { GeminiApiService } from './geminiApi';
import { validateApiKey, secureStorage, maskSensitiveInfo } from '../utils/security';

export class AuthService {
  private static readonly API_KEY_STORAGE_KEY = 'gemini_api_key';

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
    
    // 환경변수에 없으면 로컬스토리지에서 확인
    return secureStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static clearApiKey(): void {
    secureStorage.removeItem(this.API_KEY_STORAGE_KEY);
    console.log('API key cleared');
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
}

export default AuthService;