import React, { useState, useCallback, useRef, useEffect } from 'react';
import { AuthService } from '../../services/authService';
import { validateApiKey, escapeHtml } from '../../utils/security';
import './AuthPage.css';

interface AuthPageProps {
  onAuthSuccess: () => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [apiKey, setApiKey] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  // 컴포넌트 마운트 시 포커스 설정
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // 실시간 입력 검증
  const handleApiKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setApiKey(value);
    
    // 입력 중에는 에러 상태 초기화
    if (error) {
      setError('');
    }
    
    // 실시간 기본 형식 검증 (입력이 완료된 것 같을 때만)
    if (value.length > 20) {
      const validation = validateApiKey(value.trim());
      if (!validation.isValid && validation.error) {
        setError(validation.error);
      }
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedKey = apiKey.trim();
    
    if (!trimmedKey) {
      setError('API 키를 입력해 주세요.');
      return;
    }

    // 클라이언트 사이드 검증
    const validation = validateApiKey(trimmedKey);
    if (!validation.isValid) {
      setError(validation.error || '유효하지 않은 API 키 형식입니다.');
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const isValid = await AuthService.validateAndSaveApiKey(trimmedKey);
      
      if (isValid) {
        onAuthSuccess();
      } else {
        setError('API 키 검증에 실패했습니다. 키가 올바른지 확인해 주세요.');
      }
    } catch (error: any) {
      // 보안: 에러 메시지 이스케이프 처리
      const safeErrorMessage = escapeHtml(error.message || 'API 키 검증 중 오류가 발생했습니다.');
      setError(safeErrorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="auth-page" role="main">
      <div className="auth-container">
        <header className="auth-header" role="banner">
          <h1>
            <span aria-hidden="true">🤖</span>
            <span>Gemini UX Tester</span>
          </h1>
          <p id="app-description">
            UX 이미지를 분석하는 도구
          </p>
        </header>

        <section 
          className="auth-section"
          aria-labelledby="auth-section-title"
          aria-describedby="app-description"
        >
          <h2 id="auth-section-title" className="sr-only">로그인</h2>
          
          <form 
            ref={formRef}
            onSubmit={handleSubmit} 
            className="auth-form"
            noValidate
            aria-label="Google Gemini API 키 인증"
          >
            <div className="form-group">
              <label htmlFor="apiKey" className="form-label">
                Gemini API Key
                <span className="required-indicator" aria-label="필수 입력">*</span>
              </label>
              <input
                ref={inputRef}
                type="password"
                id="apiKey"
                name="apiKey"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="API 키를 입력하세요"
                disabled={isValidating}
                className={error ? 'error' : ''}
                maxLength={200}
                minLength={20}
                pattern="[A-Za-z0-9\-_\.]+"
                title="API 키는 영문, 숫자, 하이픈, 언더스코어, 점만 포함할 수 있습니다"
                autoComplete="off"
                spellCheck={false}
                required
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'apikey-error apikey-help' : 'apikey-help'}
                aria-label="Google Gemini API 키"
              />
              <div id="apikey-help" className="form-help">
                Google AI Studio에서 발급받은 API 키를 입력하세요
              </div>
              {error && (
                <div 
                  ref={errorRef}
                  id="apikey-error" 
                  className="error-message"
                  role="alert"
                  aria-live="assertive"
                  aria-atomic="true"
                >
                  <span aria-hidden="true">⚠️</span>
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isValidating || !apiKey.trim()}
              className="auth-button"
              aria-describedby="auth-button-help"
              aria-label={isValidating ? '키 검증 진행 중' : 'API 키 인증하기'}
            >
              {isValidating ? (
                <>
                  <span className="loading-spinner" aria-hidden="true"></span>
                  <span>검증 중...</span>
                </>
              ) : (
                <>
                  <span aria-hidden="true">🔑</span>
                  <span>API 키 인증</span>
                </>
              )}
            </button>
            
            <div id="auth-button-help" className="sr-only">
              API 키를 입력한 후 이 버튼을 클릭하여 인증을 완료하세요
            </div>
          </form>
        </section>

        <aside className="auth-info" aria-labelledby="usage-info-title">
          <h3 id="usage-info-title">
            <span aria-hidden="true">🚀</span>
            <span>사용 방법</span>
          </h3>
          <ol aria-label="도구 사용 단계">
            <li>Gemini API 키를 입력하여 인증</li>
            <li>UX 화면 이미지를 업로드</li>
            <li>전문적인 UX 분석 받기</li>
            <li>위버스 픽업 플로우 특화 분석 지원</li>
          </ol>
          
          <div className="api-key-info" role="complementary" aria-labelledby="api-key-info-title">
            <h4 id="api-key-info-title" className="sr-only">API 키 발급 정보</h4>
            <p>
              <strong>API 키 발급:</strong> 
              <a 
                href="https://makersuite.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Google AI Studio에서 API 키 발급받기 (새 창에서 열림)"
              >
                Google AI Studio
                <span aria-hidden="true"> ↗</span>
              </a>
            </p>
            <p className="privacy-notice">
              <small>
                <span aria-hidden="true">🔒</span>
                API 키는 브라우저에 안전하게 저장되며 외부로 전송되지 않습니다.
              </small>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

// React.memo로 컴포넌트 최적화
export default React.memo(AuthPage);