import React, { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2 } from 'lucide-react';
import { getAnalyzingMessage, getAnalysisTitle } from '../../utils/nameUtils';
import './ResultsPanel.css';

interface ResultsPanelProps {
  results: string | null;
  isAnalyzing: boolean;
  onExport?: () => void;
  progressPercent?: number;
  progressMessage?: string;
  retryCount?: number;
  maxRetries?: number;
  estimatedTimeRemaining?: number;
  persona?: string;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ 
  results, 
  isAnalyzing,
  onExport,
  progressPercent = 0,
  progressMessage = '분석 중...',
  retryCount = 0,
  maxRetries = 3,
  estimatedTimeRemaining,
  persona
}) => {
  const resultsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // 결과가 나오면 포커스 이동
  useEffect(() => {
    if (results && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 스크린 리더에게 알림
      resultsRef.current.focus();
    }
  }, [results]);

  // 진행률 메시지 변경 시 스크린 리더에게 알림
  useEffect(() => {
    if (progressMessage && progressRef.current) {
      progressRef.current.setAttribute('aria-live', 'polite');
    }
  }, [progressMessage]);

  // 시간 포맷팅 함수 (메모화) - 미래 사용 예정
  // const formatTime = useCallback((seconds: number): string => {
  //   const mins = Math.floor(seconds / 60);
  //   const secs = seconds % 60;
  //   return mins > 0 ? `${mins}분 ${secs}초` : `${secs}초`;
  // }, []);

  if (isAnalyzing) {

    // 진행률에 따른 단계 활성화
    const getActiveStep = (progress: number): number => {
      if (progress < 30) return 0;
      if (progress < 70) return 1;
      return 2;
    };

    const activeStep = getActiveStep(progressPercent);

    return (
      <div className="results-panel analyzing" role="status" aria-live="polite">
        <div className="analyzing-content">
          <div className="analyzer-avatar" aria-hidden="true">🤖</div>
          <h3 id="analyzing-title" style={{ display: 'none' }}>{getAnalyzingMessage(persona)}</h3>
          
          {/* 로딩 스피너 */}
          <div className="loading-section" aria-labelledby="analyzing-title">
            <div className="flex items-center justify-center gap-4 py-6">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <div className="text-center">
                <p 
                  className="font-medium text-primary mb-2" 
                  ref={progressRef}
                  aria-live="polite"
                  id="progress-message"
                >
                  분석 중입니다...
                </p>
                <p className="text-sm text-muted-foreground">
                  {retryCount > 0 ? (
                    <span aria-live="polite">
                      연결 문제로 재시도 중... ({retryCount}/{maxRetries})
                    </span>
                  ) : (
                    "잠시만 기다려 주세요. AI가 화면을 분석하고 있습니다."
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* 단계별 진행 상황 */}
          <ol className="analyzing-steps" aria-label="분석 단계">
            <li className={`step ${activeStep >= 0 ? 'active' : ''} ${activeStep > 0 ? 'completed' : ''}`}>
              <div className="step-indicator">
                <span className="step-icon" aria-hidden="true">👀</span>
                {activeStep > 0 && <span className="step-check" aria-label="완료">✓</span>}
              </div>
              <span className="step-label">
                이미지 분석
                <span className="sr-only">
                  {activeStep > 0 ? ' 완료' : activeStep === 0 ? ' 진행 중' : ' 대기 중'}
                </span>
              </span>
            </li>
            <li className={`step ${activeStep >= 1 ? 'active' : ''} ${activeStep > 1 ? 'completed' : ''}`}>
              <div className="step-indicator">
                <span className="step-icon" aria-hidden="true">🧠</span>
                {activeStep > 1 && <span className="step-check" aria-label="완료">✓</span>}
              </div>
              <span className="step-label">
                UX 패턴 인식
                <span className="sr-only">
                  {activeStep > 1 ? ' 완료' : activeStep === 1 ? ' 진행 중' : ' 대기 중'}
                </span>
              </span>
            </li>
            <li className={`step ${activeStep >= 2 ? 'active' : ''}`}>
              <div className="step-indicator">
                <span className="step-icon" aria-hidden="true">✍️</span>
              </div>
              <span className="step-label">
                피드백 작성
                <span className="sr-only">
                  {activeStep === 2 ? ' 진행 중' : ' 대기 중'}
                </span>
              </span>
            </li>
          </ol>

          {/* 재시도 중일 때 추가 정보 */}
          {retryCount > 0 && (
            <div className="retry-notice" role="status" aria-live="polite">
              <div className="flex items-center justify-center gap-2 mt-4">
                <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
                <span className="text-sm text-amber-700">
                  재시도 중... ({maxRetries - retryCount}번의 시도가 남았습니다)
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="results-panel empty">
        <div className="empty-state">
          <div className="empty-icon" aria-hidden="true">📋</div>
          <h3>분석 결과가 여기에 표시됩니다</h3>
          <p>이미지를 업로드하고 분석을 시작해 보세요!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="results-panel" ref={resultsRef} tabIndex={-1}>
      <div className="results-header">
        <div className="analyzer-info">
          <div className="analyzer-avatar" aria-hidden="true">🤖</div>
          <div>
            <h3 id="results-title" style={{ display: 'none' }}>{getAnalysisTitle(persona)}</h3>
            <p id="results-subtitle" style={{ display: 'none' }}>{persona ? `${persona} 관점` : 'AI 분석 결과'}</p>
          </div>
        </div>
        {onExport && (
          <button 
            onClick={onExport} 
            className="export-button"
            aria-describedby="results-title"
          >
            📤 결과 내보내기
          </button>
        )}
      </div>
      
      <div className="results-content" role="article" aria-labelledby="results-title" aria-describedby="results-subtitle">
        <div className="markdown-content">
          <ReactMarkdown 
            components={{
              h1: ({children}) => <h1 className="result-h1">{children}</h1>,
              h2: ({children}) => <h2 className="result-h2">{children}</h2>,
              h3: ({children}) => <h3 className="result-h3">{children}</h3>,
              ul: ({children}) => <ul className="result-ul">{children}</ul>,
              li: ({children}) => <li className="result-li">{children}</li>,
              p: ({children}) => <p className="result-p">{children}</p>,
              strong: ({children}) => <strong className="result-strong">{children}</strong>
            }}
          >
            {results}
          </ReactMarkdown>
        </div>
      </div>
      
      <div className="results-footer">
        <p className="disclaimer" role="note">
          <span aria-hidden="true">💡</span>
          이 분석은 AI가 생성한 것으로, 참고용으로만 사용하시기 바랍니다.
        </p>
      </div>
    </div>
  );
};

// React.memo로 컴포넌트 최적화
export default React.memo(ResultsPanel);