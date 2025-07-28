import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  public static getDerivedStateFromError(error: Error): State {
    // 다음 렌더링에서 폴백 UI를 보여주기 위해 state를 업데이트합니다.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 에러 정보를 저장하고 로깅
    this.setState({
      error,
      errorInfo
    });

    // 프로덕션에서는 에러 리포팅 서비스로 전송
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    // 실제 운영 환경에서는 Sentry 등의 에러 트래킹 서비스 사용
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // 커스텀 폴백 UI가 있으면 사용, 없으면 기본 에러 UI 표시
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          className="error-boundary"
          role="alert"
          aria-live="assertive"
          style={{
            padding: '2rem',
            textAlign: 'center',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '8px',
            margin: '1rem',
            maxWidth: '600px',
            marginLeft: 'auto',
            marginRight: 'auto'
          }}
        >
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            🚨
          </div>
          <h2 style={{ color: '#dc3545', marginBottom: '1rem' }}>
            앗! 뭔가 잘못되었어요
          </h2>
          <p style={{ color: '#6c757d', marginBottom: '1.5rem', lineHeight: '1.6' }}>
            예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
          </p>
          
          {/* 개발 환경에서만 에러 상세 정보 표시 */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details style={{ 
              textAlign: 'left', 
              margin: '1rem 0',
              padding: '1rem',
              backgroundColor: '#f1f3f4',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}>
              <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                개발자 정보 (클릭하여 펼치기)
              </summary>
              <pre style={{ 
                margin: '0.5rem 0 0 0',
                fontSize: '0.75rem',
                overflow: 'auto',
                whiteSpace: 'pre-wrap'
              }}>
                <strong>Error:</strong> {this.state.error.message}
                {this.state.errorInfo && (
                  <>
                    <br /><br />
                    <strong>Component Stack:</strong>
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#0056b3';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#007bff';
              }}
            >
              🔄 다시 시도
            </button>
            <button
              onClick={this.handleReload}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#5a6268';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#6c757d';
              }}
            >
              🔃 페이지 새로고침
            </button>
          </div>
          
          <p style={{ 
            marginTop: '2rem', 
            fontSize: '0.875rem', 
            color: '#6c757d' 
          }}>
            문제가 계속되면 브라우저를 새로고침하거나 다시 방문해 주세요.
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;