import axios from 'axios';
import { API_CONFIG } from '../config/api';
import type { 
  ProgressCallback, 
  FallbackCallback, 
  ModelInfo, 
  ImageValidationResult,
  NetworkQuality
} from '../config/types';
import { ErrorHandler } from '../utils/errorHandler';

// 모델 정보 맵핑
const MODEL_INFO: Record<string, ModelInfo> = {
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    description: '빠르고 효율적인 분석 (권장)',
    speed: 'fast',
    cost: 'low'
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    description: '고품질 상세 분석',
    speed: 'medium',
    cost: 'high'
  },
  'gemini-1.5-flash': {
    name: 'Gemini 1.5 Flash',
    description: '이전 버전 Flash',
    speed: 'fast',
    cost: 'low'
  },
  'gemini-1.5-pro': {
    name: 'Gemini 1.5 Pro',
    description: '이전 버전 Pro',
    speed: 'medium',
    cost: 'high'
  }
};

export type ModelKey = keyof typeof MODEL_INFO;
export { type ModelInfo, type ProgressCallback, type FallbackCallback };

export class GeminiApiService {
  private apiKey: string;
  private workingModel: string | null = null;
  private selectedModel: string | null = null;
  private fallbackCallback: FallbackCallback | null = null;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // 선호 모델 설정
  setSelectedModel(model: string | null): void {
    this.selectedModel = model;
  }

  // Fallback 콜백 설정
  setFallbackCallback(callback: FallbackCallback | null): void {
    this.fallbackCallback = callback;
  }

  // 작동 모델 초기화 (재검증을 위해)
  resetWorkingModel(): void {
    this.workingModel = null;
  }

  // 사용 가능한 모델을 찾아서 API 키를 검증
  async validateApiKey(): Promise<boolean> {
    try {
      // 이미 작동하는 모델이 있다면 그것을 사용
      if (this.workingModel) {
        return await this.testModel(this.workingModel);
      }

      // 선택된 모델이 있다면 우선 테스트
      if (this.selectedModel) {
        try {
          const isWorking = await this.testModel(this.selectedModel);
          if (isWorking) {
            this.workingModel = this.selectedModel;
            console.log(`Selected model is working: ${this.selectedModel}`);
            return true;
          }
        } catch (error) {
          console.log(`Selected model ${this.selectedModel} failed, trying fallbacks...`);
        }
      }

      // 모든 모델을 순서대로 테스트
      for (const model of API_CONFIG.MODELS) {
        // 이미 테스트한 선택된 모델은 건너뛰기
        if (model === this.selectedModel) continue;
        
        try {
          const isWorking = await this.testModel(model);
          if (isWorking) {
            this.workingModel = model;
            console.log(`Working model found: ${model}`);
            return true;
          }
        } catch (error) {
          console.log(`Model ${model} failed, trying next...`);
        }
      }

      console.error('No working model found with the provided API key');
      return false;
    } catch (error) {
      ErrorHandler.logError(error, 'validateApiKey');
      return false;
    }
  }

  private async testModel(model: string): Promise<boolean> {
    try {
      const response = await axios.post(
        `${API_CONFIG.GEMINI_BASE_URL}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          contents: [{
            parts: [{
              text: "Hello"
            }]
          }]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: API_CONFIG.TIMEOUT.VALIDATION
        }
      );
      return response.status === 200;
    } catch (error: any) {
      ErrorHandler.logError(error, `testModel:${model}`);
      return false;
    }
  }

  // 네트워크 상태 체크
  private async checkNetworkConnection(): Promise<boolean> {
    try {
      // 브라우저 환경에서는 navigator.onLine을 우선 사용
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        return false;
      }

      // 실제 Gemini API 서버로 간단한 요청을 보내서 네트워크 상태 확인
      const response = await axios.get(
        `${API_CONFIG.GEMINI_BASE_URL}/models?key=${this.apiKey}`,
        { 
          timeout: 5000,
          headers: { 'Cache-Control': 'no-cache' }
        }
      );
      return response.status === 200;
    } catch (error: any) {
      // 401/403 에러는 네트워크는 연결되어 있지만 인증 문제
      if (error.response?.status === 401 || error.response?.status === 403) {
        return true; // 네트워크는 연결된 상태
      }
      // 그 외 에러는 네트워크 문제로 간주
      return false;
    }
  }

  // 모델 fallback 로직
  private async tryFallbackModel(originalError: any, context: string): Promise<string | null> {
    if (!this.workingModel) return null;
    
    const currentModelIndex = API_CONFIG.MODELS.indexOf(this.workingModel as any);
    
    // 사용량 초과 에러인지 확인
    const isQuotaExceeded = originalError.response?.status === 429 || 
                           originalError.message?.toLowerCase().includes('quota') ||
                           originalError.message?.toLowerCase().includes('limit');
    
    if (isQuotaExceeded && currentModelIndex !== -1) {
      // 다음 가용한 모델로 fallback 시도
      for (let i = currentModelIndex + 1; i < API_CONFIG.MODELS.length; i++) {
        const fallbackModel = API_CONFIG.MODELS[i];
        try {
          const isWorking = await this.testModel(fallbackModel);
          if (isWorking) {
            const originalModel = this.workingModel;
            this.workingModel = fallbackModel;
            
            // Fallback 콜백 호출
            if (this.fallbackCallback) {
              this.fallbackCallback(
                originalModel,
                fallbackModel,
                `${MODEL_INFO[originalModel]?.name || originalModel} 사용량 초과로 ${MODEL_INFO[fallbackModel]?.name || fallbackModel}로 전환되었습니다.`
              );
            }
            
            console.log(`Fallback to model: ${fallbackModel} due to quota exceeded`);
            return fallbackModel;
          }
        } catch (error) {
          console.log(`Fallback model ${fallbackModel} also failed, trying next...`);
        }
      }
    }
    
    return null;
  }

  // 재시도 로직이 포함된 API 호출
  private async makeApiCallWithRetry<T>(
    apiCall: () => Promise<T>,
    progressCallback?: ProgressCallback,
    retryContext: string = 'API 호출'
  ): Promise<T> {
    let lastError: any;
    
    for (let attempt = 0; attempt <= API_CONFIG.RETRY.MAX_ATTEMPTS; attempt++) {
      try {
        if (progressCallback) {
          const progress = (attempt / (API_CONFIG.RETRY.MAX_ATTEMPTS + 1)) * 50; // 첫 50%는 시도 진행률
          progressCallback(
            attempt === 0 
              ? `${retryContext} 중...` 
              : `${retryContext} 재시도 중... (${attempt}/${API_CONFIG.RETRY.MAX_ATTEMPTS})`,
            progress
          );
        }

        const result = await apiCall();
        
        if (progressCallback) {
          progressCallback(`${retryContext} 완료`, 100);
        }
        
        return result;
      } catch (error: any) {
        lastError = error;
        
        // 재시도하지 않을 에러들 (즉시 실패)
        if (error.response?.status === 401 || error.response?.status === 403) {
          throw ErrorHandler.handleApiError(error);
        }
        
        if (error.response?.status === 400) {
          throw ErrorHandler.handleApiError(error);
        }

        // 500 서버 내부 에러 시 fallback 모델 시도
        if (error.response?.status === 500) {
          const fallbackModel = await this.tryFallbackModel(error, retryContext);
          if (fallbackModel) {
            // fallback 모델로 다시 시도
            continue;
          }
          // fallback도 실패하면 즉시 실패
          throw ErrorHandler.handleApiError(error);
        }

        // 사용량 초과 에러 시 fallback 시도
        if (error.response?.status === 429) {
          const fallbackModel = await this.tryFallbackModel(error, retryContext);
          if (fallbackModel) {
            // fallback 모델로 다시 시도
            continue;
          }
        }

        // 네트워크 관련 에러인지 확인
        const isNetworkError = !error.response && (
          error.code === 'ECONNABORTED' || 
          error.code === 'ENOTFOUND' || 
          error.code === 'ECONNREFUSED' || 
          error.message?.includes('Network Error') ||
          error.message?.includes('timeout')
        );

        // 네트워크 에러가 의심되는 경우에만 네트워크 상태 확인
        if (isNetworkError) {
          // 브라우저 환경에서 navigator.onLine 먼저 체크
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            throw ErrorHandler.handleApiError(error);
          }
          
          // 심각한 네트워크 에러인 경우에만 추가 네트워크 체크
          if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            const isConnected = await this.checkNetworkConnection();
            if (!isConnected) {
              throw ErrorHandler.handleApiError(error);
            }
          }
        }

        // 마지막 시도였다면 에러 throw
        if (attempt === API_CONFIG.RETRY.MAX_ATTEMPTS) {
          break;
        }

        // 재시도 대기
        const delay = API_CONFIG.RETRY.DELAY * Math.pow(API_CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt);
        
        if (progressCallback) {
          const reason = isNetworkError ? '연결 문제' : '서버 응답 오류';
          progressCallback(
            `${reason}로 인해 ${delay / 1000}초 후 재시도합니다...`,
            ((attempt + 1) / (API_CONFIG.RETRY.MAX_ATTEMPTS + 1)) * 50
          );
        }
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    // 모든 재시도 실패 시 에러 throw
    throw ErrorHandler.handleApiError(lastError);
  }

  // 적응형 타임아웃 계산
  private getTimeoutForAttempt(attempt: number): number {
    if (attempt === 0) return API_CONFIG.TIMEOUT.FIRST_ATTEMPT;
    if (attempt === 1) return API_CONFIG.TIMEOUT.RETRY_ATTEMPT;
    return API_CONFIG.TIMEOUT.FINAL_ATTEMPT;
  }

  async analyzeImageWithPersona(
    imageBase64: string, 
    persona: string, 
    context: string, 
    progressCallback?: ProgressCallback
  ): Promise<string> {
    // 먼저 작동하는 모델이 있는지 확인
    if (!this.workingModel) {
      if (progressCallback) {
        progressCallback('API 키 검증 중...', 10);
      }
      
      const isValid = await this.validateApiKey();
      if (!isValid) {
        throw ErrorHandler.createValidationError(
          'No working model found',
          '사용 가능한 Gemini 모델을 찾을 수 없습니다. API 키를 확인해 주세요.'
        );
      }
    }

    // 이미지 크기 검증
    const validation = this.validateImageData(imageBase64);
    if (!validation.isValid) {
      throw ErrorHandler.createImageError('size');
    }

    if (progressCallback) {
      progressCallback('이미지 분석 요청 준비 중...', 20);
    }

    // 재시도 로직으로 API 호출
    return await this.makeApiCallWithRetry(
      async () => {
        let currentAttempt = 0;
        
        const makeRequest = async (): Promise<string> => {
          const timeout = this.getTimeoutForAttempt(currentAttempt);
          currentAttempt++;
          
          const response = await axios.post(
            `${API_CONFIG.GEMINI_BASE_URL}/models/${this.workingModel}:generateContent?key=${this.apiKey}`,
            {
              contents: [{
                parts: [
                  {
                    text: `${persona}\n\n${context}\n\n이 이미지를 분석하고 전문가의 관점에서 UX 피드백을 제공해 주세요.`
                  },
                  {
                    inline_data: {
                      mime_type: "image/jpeg",
                      data: imageBase64
                    }
                  }
                ]
              }]
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout,
              // 요청 취소를 위한 AbortController 추가
              ...(typeof AbortController !== 'undefined' && {
                signal: AbortSignal.timeout(timeout)
              })
            }
          );

          const result = response.data.candidates[0]?.content?.parts[0]?.text;
          if (!result) {
            throw new Error('Gemini API로부터 응답을 받지 못했습니다.');
          }

          return result;
        };

        return await makeRequest();
      },
      progressCallback,
      '이미지 분석'
    );
  }

  // 다중 이미지 분석 (A/B 테스트용)
  async analyzeMultipleImages(
    imagesBase64: string[],
    persona: string,
    context: string,
    progressCallback?: ProgressCallback
  ): Promise<string> {
    // 먼저 작동하는 모델이 있는지 확인
    if (!this.workingModel) {
      if (progressCallback) {
        progressCallback('API 키 검증 중...', 10);
      }
      
      const isValid = await this.validateApiKey();
      if (!isValid) {
        throw ErrorHandler.createValidationError(
          'No working model found',
          '사용 가능한 Gemini 모델을 찾을 수 없습니다. API 키를 확인해 주세요.'
        );
      }
    }

    // 이미지 수 검증
    if (imagesBase64.length === 0) {
      throw ErrorHandler.createImageError('missing');
    }

    if (imagesBase64.length > API_CONFIG.IMAGE.MAX_COUNT) {
      throw ErrorHandler.createValidationError(
        'Too many images',
        `최대 ${API_CONFIG.IMAGE.MAX_COUNT}개의 이미지만 동시에 분석할 수 있습니다.`
      );
    }

    // 각 이미지 크기 검증
    for (let i = 0; i < imagesBase64.length; i++) {
      const validation = this.validateImageData(imagesBase64[i]);
      if (!validation.isValid) {
        throw ErrorHandler.createValidationError(
          `Image ${i + 1} validation failed`,
          `이미지 ${i + 1} 검증 실패: ${validation.errors.join(', ')}`
        );
      }
    }

    // 전체 이미지 크기 검증
    const totalSizeKB = imagesBase64.reduce((total, imageBase64) => {
      return total + ((imageBase64.length * 3) / 4 / 1024);
    }, 0);

    if (totalSizeKB > API_CONFIG.IMAGE.MAX_TOTAL_SIZE_KB) {
      throw ErrorHandler.createValidationError(
        'Total image size too large',
        `전체 이미지 크기가 ${API_CONFIG.IMAGE.MAX_TOTAL_SIZE_KB / 1024}MB를 초과합니다. 이미지 크기를 줄이거나 개수를 줄여주세요.`
      );
    }

    if (progressCallback) {
      progressCallback(`${imagesBase64.length}개 이미지 분석 요청 준비 중...`, 20);
    }

    // 재시도 로직으로 API 호출
    return await this.makeApiCallWithRetry(
      async () => {
        let currentAttempt = 0;
        
        const makeRequest = async (): Promise<string> => {
          const timeout = this.getTimeoutForAttempt(currentAttempt);
          currentAttempt++;
          
          // 다중 이미지를 위한 요청 본문 구성
          const parts: any[] = [
            {
              text: `${persona}\n\n${context}\n\n이 ${imagesBase64.length}개의 이미지를 순서대로 분석하고 전문가의 관점에서 A/B 테스트 UX 피드백을 제공해 주세요.`
            }
          ];

          // 각 이미지를 parts 배열에 추가
          for (let i = 0; i < imagesBase64.length; i++) {
            parts.push({
              inline_data: {
                mime_type: "image/jpeg",
                data: imagesBase64[i]
              }
            });
          }
          
          const response = await axios.post(
            `${API_CONFIG.GEMINI_BASE_URL}/models/${this.workingModel}:generateContent?key=${this.apiKey}`,
            {
              contents: [{
                parts: parts
              }]
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout,
              // 요청 취소를 위한 AbortController 추가
              ...(typeof AbortController !== 'undefined' && {
                signal: AbortSignal.timeout(timeout)
              })
            }
          );

          const result = response.data.candidates[0]?.content?.parts[0]?.text;
          if (!result) {
            throw new Error('Gemini API로부터 응답을 받지 못했습니다.');
          }

          return result;
        };

        return await makeRequest();
      },
      progressCallback,
      '다중 이미지 분석'
    );
  }

  // 키워드 기반 위버스 퍼소나 생성
  async generateWeversePersona(
    keyword: string,
    progressCallback?: ProgressCallback
  ): Promise<string> {
    // 먼저 작동하는 모델이 있는지 확인
    if (!this.workingModel) {
      if (progressCallback) {
        progressCallback('API 키 검증 중...', 10);
      }
      
      const isValid = await this.validateApiKey();
      if (!isValid) {
        throw ErrorHandler.createValidationError(
          'No working model found',
          '사용 가능한 Gemini 모델을 찾을 수 없습니다. API 키를 확인해 주세요.'
        );
      }
    }

    // 키워드 검증
    if (!keyword || keyword.trim().length === 0) {
      throw ErrorHandler.createValidationError(
        'Keyword required',
        '키워드를 입력해 주세요.'
      );
    }

    const trimmedKeyword = keyword.trim();
    if (trimmedKeyword.length > 100) {
      throw ErrorHandler.createValidationError(
        'Keyword too long',
        '키워드는 100자 이내로 입력해 주세요.'
      );
    }

    if (progressCallback) {
      progressCallback('위버스 퍼소나 생성 중...', 20);
    }

    // 위버스 전용 프롬프트 템플릿
    const weversePrompt = `[역할] 너는 위버스와 위버스샵을 서비스를 기획하고 디자인하는 프로덕트디자인 전문가야.

[배경 정보] 팬은 아티스트에 대한 충성도에 따라 성장 단계를 거치며, 이를 '팬 여정(Fan Journey)'이라고 해. 이 여정은 **'발견 → 탐색 → 구매 → 몰입 → 헌신'**의 5단계로 구성돼.

뉴비 팬: 주로 '발견'과 '탐색' 단계에 머무르는 초기 팬.
코어 팬: '몰입'과 '헌신' 단계에 도달한 충성도 높은 핵심 팬.
팬덤 생태계에는 팬들의 참여를 유도하고 정체성을 강화하는 7가지 주요 활동이 있어.

팬덤 활동 7가지: 콘텐츠 소비, 정보 획득, F2F(팬 간) 소통, 서포트, 이벤트 참여, 수집, 창작.

[지시 사항] 위 배경 정보를 바탕으로, 다음 키워드를 반영한 구체적인 사용자 퍼소나를 생성해줘: ${trimmedKeyword}

퍼소나는 다음 요소들을 포함해야 해:
1. 기본 정보 (연령대, 성별, 직업 등)
2. 팬 여정 단계
3. 주요 팬덤 활동
4. 위버스/위버스샵 사용 목적과 패턴
5. 기대하는 가치와 경험

자연스럽고 구체적인 한국어로 작성해줘.`;

    // 재시도 로직으로 API 호출
    return await this.makeApiCallWithRetry(
      async () => {
        let currentAttempt = 0;
        
        const makeRequest = async (): Promise<string> => {
          const timeout = this.getTimeoutForAttempt(currentAttempt);
          currentAttempt++;
          
          const response = await axios.post(
            `${API_CONFIG.GEMINI_BASE_URL}/models/${this.workingModel}:generateContent?key=${this.apiKey}`,
            {
              contents: [{
                parts: [{
                  text: weversePrompt
                }]
              }]
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
              timeout,
              // 요청 취소를 위한 AbortController 추가
              ...(typeof AbortController !== 'undefined' && {
                signal: AbortSignal.timeout(timeout)
              })
            }
          );

          const result = response.data.candidates[0]?.content?.parts[0]?.text;
          if (!result) {
            throw new Error('Gemini API로부터 응답을 받지 못했습니다.');
          }

          return result;
        };

        return await makeRequest();
      },
      progressCallback,
      '위버스 퍼소나 생성'
    );
  }

  // 이미지 크기 및 형식 검증
  validateImageData(imageBase64: string): ImageValidationResult {
    const errors: string[] = [];
    
    // Base64 형식 검증
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    if (!base64Regex.test(imageBase64)) {
      errors.push('올바른 Base64 형식이 아닙니다.');
    }

    // 크기 계산
    const size = imageBase64.length;
    const sizeKB = (size * 3) / 4 / 1024;

    // 크기 제한 검증
    if (sizeKB > API_CONFIG.IMAGE.MAX_SIZE_KB) {
      errors.push(`이미지 크기가 ${API_CONFIG.IMAGE.MAX_SIZE_KB / 1024}MB를 초과합니다.`);
    }

    if (size === 0) {
      errors.push('이미지 데이터가 비어있습니다.');
    }

    return {
      isValid: errors.length === 0,
      size,
      sizeKB: Math.round(sizeKB * 100) / 100,
      errors
    };
  }

  // 현재 사용 중인 모델 정보 반환
  getCurrentModel(): string | null {
    return this.workingModel;
  }

  // 사용 가능한 모델 목록 반환
  getAvailableModels(): string[] {
    return [...API_CONFIG.MODELS];
  }

  // 모델 정보 반환
  getModelInfo(model: string): ModelInfo | null {
    return MODEL_INFO[model] || null;
  }

  // 모든 모델 정보 반환
  getAllModelInfo(): Record<string, ModelInfo> {
    return { ...MODEL_INFO };
  }

  // 현재 선택된 모델 반환
  getSelectedModel(): string | null {
    return this.selectedModel;
  }

  // API 상태 및 설정 정보 반환
  getServiceStatus() {
    return {
      currentModel: this.workingModel,
      selectedModel: this.selectedModel,
      availableModels: this.getAvailableModels(),
      modelInfo: this.getAllModelInfo(),
      timeoutConfig: API_CONFIG.TIMEOUT,
      retryConfig: API_CONFIG.RETRY,
      isConfigured: !!this.apiKey,
      hasWorkingModel: !!this.workingModel
    };
  }


  // 네트워크 품질 테스트
  async testNetworkQuality(): Promise<NetworkQuality> {
    // 먼저 navigator.onLine으로 빠른 체크
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return {
        isConnected: false,
        latency: 0,
        quality: 'disconnected'
      };
    }

    const start = Date.now();
    const isConnected = await this.checkNetworkConnection();
    const latency = Date.now() - start;

    let quality: 'excellent' | 'good' | 'poor' | 'disconnected';
    if (!isConnected) {
      quality = 'disconnected';
    } else if (latency < 200) {
      quality = 'excellent';
    } else if (latency < 500) {
      quality = 'good';
    } else {
      quality = 'poor';
    }

    return { isConnected, latency, quality };
  }
}

export default GeminiApiService;