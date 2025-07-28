import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LogOut, Bot, Loader2 } from 'lucide-react';
import AuthPage from './components/auth/AuthPage';
import ImageUpload from './components/upload/ImageUpload';
import AnalysisOptions from './components/analysis/AnalysisOptions';
import ResultsPanel from './components/analysis/ResultsPanel';
import ErrorBoundary from './components/common/ErrorBoundary';
import { Button } from './components/ui/button';
import { Card, CardContent } from './components/ui/card';
import { AuthService } from './services/authService';
import { GeminiApiService, ProgressCallback, FallbackCallback } from './services/geminiApi';
import { buildABTestPrompt } from './utils/promptUtils';
import { UploadedImage } from './types/analysis';
import './App.css';
import './styles/responsive.css';

function App() {
  // 기본 상태들
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [persona, setPersona] = useState<string>('');
  const [situation, setSituation] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [retryCount, setRetryCount] = useState<number>(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [analysisStartTime, setAnalysisStartTime] = useState<number | null>(null);
  
  // Gemini 모델 관련 상태
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.5-flash'); // 기본값은 flash
  const [fallbackMessage, setFallbackMessage] = useState<string | null>(null);
  const [currentActiveModel, setCurrentActiveModel] = useState<string | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // GeminiApiService 인스턴스 생성 (퍼소나 생성용)
  const [geminiApiService, setGeminiApiService] = useState<GeminiApiService | null>(null);

  // Fallback 콜백 함수
  const handleModelFallback: FallbackCallback = useCallback((_originalModel: string, fallbackModel: string, reason: string) => {
    setFallbackMessage(reason);
    setCurrentActiveModel(fallbackModel);
    
    // 5초 후 메시지 자동 제거
    setTimeout(() => {
      setFallbackMessage(null);
    }, 5000);
  }, []);

  // 모델 선택 변경 핸들러
  const handleModelChange = useCallback((model: string) => {
    setSelectedModel(model);
    setFallbackMessage(null);
    
    if (geminiApiService) {
      geminiApiService.setSelectedModel(model);
      // 모델 변경 시 현재 작동하는 모델 초기화 (재검증 필요)
      geminiApiService.resetWorkingModel();
    }
  }, [geminiApiService]);

  useEffect(() => {
    // 페이지 로드 시 인증 상태 확인
    const authenticated = AuthService.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    // 인증되어 있으면 GeminiApiService 인스턴스 생성
    if (authenticated) {
      const apiKey = AuthService.getApiKey();
      if (apiKey) {
        const service = new GeminiApiService(apiKey);
        service.setSelectedModel(selectedModel);
        service.setFallbackCallback(handleModelFallback);
        setGeminiApiService(service);
      }
    }

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // URL 객체 정리
      uploadedImages.forEach(img => {
        URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, [uploadedImages, selectedModel, handleModelFallback]);

  // 진행률에 따른 동적 메시지 생성
  const getProgressMessage = useCallback((progress: number, retryCount: number): string => {
    if (retryCount > 0) {
      return `연결 문제로 재시도 중... (${retryCount}/3)`;
    }
    
    if (progress < 10) return '분석 준비 중...';
    if (progress < 30) return '이미지를 업로드하고 있습니다...';
    if (progress < 50) return '이미지를 자세히 살펴보고 있어요...';
    if (progress < 70) return 'UX 패턴을 분석하고 있습니다...';
    if (progress < 90) return '피드백을 작성하고 있어요...';
    if (progress < 100) return '마지막 점검 중...';
    return '분석 완료!';
  }, []);

  // 예상 소요 시간 계산 (메모화)
  const calculateEstimatedTime = useCallback((progress: number, startTime: number): number => {
    if (progress <= 5) return 60; // 초기 예상 시간: 60초
    
    const elapsed = (Date.now() - startTime) / 1000;
    const estimatedTotal = (elapsed / progress) * 100;
    const remaining = Math.max(0, estimatedTotal - elapsed);
    
    return Math.round(remaining);
  }, []);

  const handleAuthSuccess = useCallback(() => {
    setIsAuthenticated(true);
    
    // 인증 성공 시 GeminiApiService 인스턴스 생성
    const apiKey = AuthService.getApiKey();
    if (apiKey) {
      const service = new GeminiApiService(apiKey);
      service.setSelectedModel(selectedModel);
      service.setFallbackCallback(handleModelFallback);
      setGeminiApiService(service);
    }
  }, [selectedModel, handleModelFallback]);


  const handleMultipleImageUpload = useCallback((images: UploadedImage[]) => {
    setUploadedImages(images);
    setAnalysisResults(null); // 새 이미지 업로드 시 이전 결과 초기화
    setError(null);
  }, []);

  // 이미지 존재 여부 메모화
  const hasImages = useMemo(() => {
    return uploadedImages.length > 0;
  }, [uploadedImages.length]);


  const handleAnalyze = useCallback(async () => {
    // 이미지 검증
    if (!hasImages) {
      setError('이미지를 먼저 업로드해 주세요.');
      return;
    }

    const apiKey = AuthService.getApiKey();
    if (!apiKey) {
      setError('API 키가 없습니다. 다시 로그인해 주세요.');
      setIsAuthenticated(false);
      return;
    }

    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // 새로운 AbortController 생성
    abortControllerRef.current = new AbortController();
    
    setIsAnalyzing(true);
    setError(null);
    setAnalysisResults(null);
    setRetryCount(0);
    setAnalysisStartTime(Date.now());
    setProgressPercent(0);
    setProgressMessage(getProgressMessage(0, 0));
    setEstimatedTimeRemaining(60);

    try {
      const geminiService = new GeminiApiService(apiKey);
      geminiService.setSelectedModel(selectedModel);
      geminiService.setFallbackCallback(handleModelFallback);
      
      // 현재 활성 모델 업데이트
      setCurrentActiveModel(geminiService.getCurrentModel());
      
      // 테스트 분석
      const prompt = buildABTestPrompt(uploadedImages.length, persona, situation);
      const context = '테스트 화면 비교 분석';
      
      const imagesBase64 = uploadedImages.map(img => img.base64);
      
      // 진행상황 콜백 함수
      const progressCallback: ProgressCallback = (message: string, progress: number) => {
        const currentRetry = message.includes('재시도') ? 
          parseInt(message.match(/\((\d+)\/\d+\)/)?.[1] || '0') : 0;
        
        setRetryCount(currentRetry);
        setProgressPercent(progress);
        
        // 동적 메시지 생성
        let dynamicMessage = getProgressMessage(progress, currentRetry);
        if (progress < 50 && currentRetry === 0) {
          dynamicMessage = `${uploadedImages.length}개 화면을 비교 분석하고 있습니다...`;
        }
        setProgressMessage(dynamicMessage);
        
        // 예상 시간 계산 및 업데이트
        if (analysisStartTime && progress > 5 && currentRetry === 0) {
          const estimatedTime = calculateEstimatedTime(progress, analysisStartTime);
          setEstimatedTimeRemaining(estimatedTime);
        }
      };

      const results = await geminiService.analyzeMultipleImages(
        imagesBase64,
        prompt,
        context,
        progressCallback
      );

      setAnalysisResults(results);
      setProgressMessage('테스트 분석 완료!');
      setProgressPercent(100);
      setEstimatedTimeRemaining(0);
      
      // 최종 사용된 모델 업데이트
      setCurrentActiveModel(geminiService.getCurrentModel());
    } catch (error: any) {
      console.error('Analysis failed:', error);
      setError(error.message || '분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
      setProgressMessage('');
      setProgressPercent(0);
      setRetryCount(0);
      setEstimatedTimeRemaining(null);
    } finally {
      setIsAnalyzing(false);
      abortControllerRef.current = null;
      
      // 진행상황 메시지는 성공 시에만 3초 후 사라짐
      if (!error) {
        timeoutRef.current = setTimeout(() => {
          setProgressMessage('');
          setProgressPercent(0);
          setRetryCount(0);
          setEstimatedTimeRemaining(null);
          setAnalysisStartTime(null);
        }, 3000);
      }
    }
  }, [hasImages, uploadedImages, persona, situation, getProgressMessage, calculateEstimatedTime, error, analysisStartTime, selectedModel, handleModelFallback]);

  const handleExportResults = useCallback(() => {
    if (!analysisResults) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      analysisType: 'test-analysis',
      imageCount: uploadedImages.length,
      persona,
      situation,
      results: analysisResults
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ux-analysis-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [analysisResults, persona, situation, uploadedImages.length]);

  const handleLogout = useCallback(() => {
    AuthService.clearApiKey();
    setIsAuthenticated(false);
    setUploadedImages([]);
    setAnalysisResults(null);
    setError(null);
    setPersona('');
    setSituation('');
    
    // GeminiApiService 인스턴스 초기화
    setGeminiApiService(null);
    
    // URL 객체 정리
    uploadedImages.forEach(img => {
      URL.revokeObjectURL(img.previewUrl);
    });
  }, [uploadedImages]);

  if (!isAuthenticated) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
          <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-4">
              <div className="flex items-center justify-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    Gemini UX Tester
                  </h1>
                </div>
              </div>
            </div>
          </header>

          <main className="container mx-auto px-4 py-8">
            <AuthPage onAuthSuccess={handleAuthSuccess} />
          </main>

          <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 py-6">
              <p className="text-center text-sm text-muted-foreground">
                Made with ❤️ for UX analysis | Powered by Google Gemini AI
              </p>
            </div>
          </footer>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/50">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Gemini UX Tester
                </h1>
              </div>
              <Button 
                onClick={handleLogout} 
                variant="outline"
                size="sm"
                className="gap-2"
                aria-label="로그아웃"
              >
                <LogOut className="h-4 w-4" />
                로그아웃
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* 분석 타이틀 */}
            <section className="animate-fade-in mb-6">
              <div className="text-center p-4">
                <h2 className="text-2xl font-bold text-primary mb-2">
                  테스트 분석 (최대 3개)
                </h2>
                <p className="text-muted-foreground">
                  여러 화면을 업로드하여 비교 분석을 진행합니다
                </p>
              </div>
            </section>

            {/* 이미지 업로드 섹션 */}
            <section className="animate-fade-in">
              <ImageUpload
                onMultipleImageUpload={handleMultipleImageUpload}
                uploadedImages={uploadedImages}
                isAnalyzing={isAnalyzing}
                maxImages={3}
                enableMultiple={true}
              />
            </section>

            {/* 분석 옵션 섹션 */}
            <section className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <AnalysisOptions
                onAnalyze={handleAnalyze}
                hasImage={uploadedImages.length > 0}
                isAnalyzing={isAnalyzing}
                persona={persona}
                onPersonaChange={setPersona}
                situation={situation}
                onSituationChange={setSituation}
                geminiApiService={geminiApiService}
                selectedModel={selectedModel}
                onModelChange={handleModelChange}
                currentActiveModel={currentActiveModel}
              />
            </section>

            {/* Fallback 알림 메시지 */}
            {fallbackMessage && (
              <Card className="border-amber-500/50 bg-amber-50 animate-slide-in">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-amber-700">
                    <div className="p-2 rounded-full bg-amber-100">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">모델 자동 전환</p>
                      <p className="text-sm text-amber-600 mt-1">{fallbackMessage}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 에러 및 진행률 표시 */}
            {error && (
              <Card className="border-destructive/50 bg-destructive/5 animate-slide-in">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 text-destructive">
                    <div className="p-2 rounded-full bg-destructive/10">
                      <Bot className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">오류가 발생했습니다</p>
                      <p className="text-sm text-destructive/80 mt-1">{error}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {isAnalyzing && (
              <Card className="border-primary/50 bg-primary/5 animate-slide-in">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-center gap-4 py-6">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                    <div className="text-center">
                      <p className="font-medium text-primary mb-2">
                        분석 중입니다...
                      </p>
                      <p className="text-sm text-muted-foreground">
                        잠시만 기다려 주세요. AI가 화면을 분석하고 있습니다.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 결과 섹션 */}
            <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <ResultsPanel
                results={analysisResults}
                isAnalyzing={isAnalyzing}
                onExport={analysisResults ? handleExportResults : undefined}
                progressPercent={progressPercent}
                progressMessage={progressMessage}
                retryCount={retryCount}
                maxRetries={3}
                estimatedTimeRemaining={estimatedTimeRemaining || undefined}
                persona={persona}
              />
            </section>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-4 py-6">
            <p className="text-center text-sm text-muted-foreground">
              Made with ❤️ for UX analysis | Powered by Google Gemini AI
            </p>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
}

export default App;