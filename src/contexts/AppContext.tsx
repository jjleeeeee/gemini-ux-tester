import React, { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { GeminiApiService, ProgressCallback, FallbackCallback } from '../services/geminiApi';
import { UploadedImage } from '../config/types';
import { ErrorHandler } from '../utils/errorHandler';

// 상태 타입 정의
interface AppState {
  // 인증 상태
  isAuthenticated: boolean;
  
  // 이미지 관련
  uploadedImages: UploadedImage[];
  
  // 분석 설정
  persona: string;
  situation: string;
  selectedModel: string;
  
  // 분석 상태
  isAnalyzing: boolean;
  analysisResults: string | null;
  
  // 진행 상태
  progressMessage: string;
  progressPercent: number;
  retryCount: number;
  estimatedTimeRemaining: number | null;
  analysisStartTime: number | null;
  
  // 에러 상태
  error: string | null;
  
  // 모델 관련
  fallbackMessage: string | null;
  currentActiveModel: string | null;
  
  // 서비스 인스턴스
  geminiApiService: GeminiApiService | null;
}

// 액션 타입 정의
type AppAction = 
  | { type: 'SET_AUTHENTICATED'; payload: boolean }
  | { type: 'SET_UPLOADED_IMAGES'; payload: UploadedImage[] }
  | { type: 'SET_PERSONA'; payload: string }
  | { type: 'SET_SITUATION'; payload: string }
  | { type: 'SET_SELECTED_MODEL'; payload: string }
  | { type: 'SET_ANALYZING'; payload: boolean }
  | { type: 'SET_ANALYSIS_RESULTS'; payload: string | null }
  | { type: 'SET_PROGRESS'; payload: { message: string; percent: number; retryCount?: number } }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_FALLBACK_MESSAGE'; payload: string | null }
  | { type: 'SET_CURRENT_ACTIVE_MODEL'; payload: string | null }
  | { type: 'SET_GEMINI_API_SERVICE'; payload: GeminiApiService | null }
  | { type: 'SET_ESTIMATED_TIME'; payload: number | null }
  | { type: 'SET_ANALYSIS_START_TIME'; payload: number | null }
  | { type: 'CLEAR_ANALYSIS_STATE' }
  | { type: 'RESET_STATE' };

// 초기 상태
const initialState: AppState = {
  isAuthenticated: false,
  uploadedImages: [],
  persona: '',
  situation: '',
  selectedModel: 'gemini-2.5-flash',
  isAnalyzing: false,
  analysisResults: null,
  progressMessage: '',
  progressPercent: 0,
  retryCount: 0,
  estimatedTimeRemaining: null,
  analysisStartTime: null,
  error: null,
  fallbackMessage: null,
  currentActiveModel: null,
  geminiApiService: null,
};

// 리듀서
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_AUTHENTICATED':
      return { ...state, isAuthenticated: action.payload };
      
    case 'SET_UPLOADED_IMAGES':
      return { ...state, uploadedImages: action.payload };
      
    case 'SET_PERSONA':
      return { ...state, persona: action.payload };
      
    case 'SET_SITUATION':
      return { ...state, situation: action.payload };
      
    case 'SET_SELECTED_MODEL':
      return { ...state, selectedModel: action.payload };
      
    case 'SET_ANALYZING':
      return { ...state, isAnalyzing: action.payload };
      
    case 'SET_ANALYSIS_RESULTS':
      return { ...state, analysisResults: action.payload };
      
    case 'SET_PROGRESS':
      return { 
        ...state, 
        progressMessage: action.payload.message,
        progressPercent: action.payload.percent,
        retryCount: action.payload.retryCount || state.retryCount
      };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload };
      
    case 'SET_FALLBACK_MESSAGE':
      return { ...state, fallbackMessage: action.payload };
      
    case 'SET_CURRENT_ACTIVE_MODEL':
      return { ...state, currentActiveModel: action.payload };
      
    case 'SET_GEMINI_API_SERVICE':
      return { ...state, geminiApiService: action.payload };
      
    case 'SET_ESTIMATED_TIME':
      return { ...state, estimatedTimeRemaining: action.payload };
      
    case 'SET_ANALYSIS_START_TIME':
      return { ...state, analysisStartTime: action.payload };
      
    case 'CLEAR_ANALYSIS_STATE':
      return {
        ...state,
        isAnalyzing: false,
        analysisResults: null,
        progressMessage: '',
        progressPercent: 0,
        retryCount: 0,
        estimatedTimeRemaining: null,
        analysisStartTime: null,
        error: null
      };
      
    case 'RESET_STATE':
      return {
        ...initialState,
        // 인증 상태는 유지
        isAuthenticated: state.isAuthenticated,
        geminiApiService: state.geminiApiService
      };
      
    default: {
      // TypeScript 베스트 프랙티스: 더 안전한 에러 핸들링
      const exhaustiveCheck: never = action;
      ErrorHandler.logError(
        new Error(`Unknown action type: ${JSON.stringify(exhaustiveCheck)}`),
        'appReducer'
      );
      return state;
    }
  }
}

// 컨텍스트 타입
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  
  // 편의 메서드들
  setAuthenticated: (authenticated: boolean) => void;
  setUploadedImages: (images: UploadedImage[]) => void;
  setPersona: (persona: string) => void;
  setSituation: (situation: string) => void;
  setSelectedModel: (model: string) => void;
  setAnalyzing: (analyzing: boolean) => void;
  setAnalysisResults: (results: string | null) => void;
  setProgress: (message: string, percent: number, retryCount?: number) => void;
  setError: (error: string | null) => void;
  setFallbackMessage: (message: string | null) => void;
  setCurrentActiveModel: (model: string | null) => void;
  setGeminiApiService: (service: GeminiApiService | null) => void;
  setEstimatedTime: (time: number | null) => void;
  setAnalysisStartTime: (time: number | null) => void;
  clearAnalysisState: () => void;
  resetState: () => void;
}

// 컨텍스트 생성
const AppContext = createContext<AppContextType | undefined>(undefined);

// 프로바이더 컴포넌트
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  // React 19 개선된 타입 추론 활용 (명시적 타입 인자 제거)
  const [state, dispatch] = useReducer(appReducer, initialState);

  // 편의 메서드들 (useCallback으로 최적화)
  const setAuthenticated = useCallback((authenticated: boolean) => {
    dispatch({ type: 'SET_AUTHENTICATED', payload: authenticated });
  }, []);

  const setUploadedImages = useCallback((images: UploadedImage[]) => {
    dispatch({ type: 'SET_UPLOADED_IMAGES', payload: images });
  }, []);

  const setPersona = useCallback((persona: string) => {
    dispatch({ type: 'SET_PERSONA', payload: persona });
  }, []);

  const setSituation = useCallback((situation: string) => {
    dispatch({ type: 'SET_SITUATION', payload: situation });
  }, []);

  const setSelectedModel = useCallback((model: string) => {
    dispatch({ type: 'SET_SELECTED_MODEL', payload: model });
  }, []);

  const setAnalyzing = useCallback((analyzing: boolean) => {
    dispatch({ type: 'SET_ANALYZING', payload: analyzing });
  }, []);

  const setAnalysisResults = useCallback((results: string | null) => {
    dispatch({ type: 'SET_ANALYSIS_RESULTS', payload: results });
  }, []);

  const setProgress = useCallback((message: string, percent: number, retryCount?: number) => {
    dispatch({ type: 'SET_PROGRESS', payload: { message, percent, retryCount } });
  }, []);

  const setError = useCallback((error: string | null) => {
    // TypeScript 베스트 프랙티스: 에러 검증 및 로깅
    if (error && typeof error === 'string') {
      ErrorHandler.logError(new Error(error), 'AppContext.setError');
    }
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setFallbackMessage = useCallback((message: string | null) => {
    dispatch({ type: 'SET_FALLBACK_MESSAGE', payload: message });
  }, []);

  const setCurrentActiveModel = useCallback((model: string | null) => {
    dispatch({ type: 'SET_CURRENT_ACTIVE_MODEL', payload: model });
  }, []);

  const setGeminiApiService = useCallback((service: GeminiApiService | null) => {
    dispatch({ type: 'SET_GEMINI_API_SERVICE', payload: service });
  }, []);

  const setEstimatedTime = useCallback((time: number | null) => {
    dispatch({ type: 'SET_ESTIMATED_TIME', payload: time });
  }, []);

  const setAnalysisStartTime = useCallback((time: number | null) => {
    dispatch({ type: 'SET_ANALYSIS_START_TIME', payload: time });
  }, []);

  const clearAnalysisState = useCallback(() => {
    dispatch({ type: 'CLEAR_ANALYSIS_STATE' });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const contextValue: AppContextType = {
    state,
    dispatch,
    setAuthenticated,
    setUploadedImages,
    setPersona,
    setSituation,
    setSelectedModel,
    setAnalyzing,
    setAnalysisResults,
    setProgress,
    setError,
    setFallbackMessage,
    setCurrentActiveModel,
    setGeminiApiService,
    setEstimatedTime,
    setAnalysisStartTime,
    clearAnalysisState,
    resetState,
  };

  return (
    <AppContext value={contextValue}>
      {children}
    </AppContext>
  );
}

// 커스텀 훅 (타입 안전성 개선)
export function useAppContext(): AppContextType {
  const context = useContext(AppContext);
  
  // TypeScript 베스트 프랙티스: 더 명확한 타입 가드와 에러 핸들링
  if (!context) {
    const error = new Error(
      'useAppContext must be used within an AppProvider. ' +
      'Make sure to wrap your component tree with <AppProvider>.'
    );
    ErrorHandler.logError(error, 'useAppContext');
    throw error;
  }
  
  return context;
}

export default AppContext;