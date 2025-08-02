/**
 * 세션 자동 만료 관리 시스템
 * 30분 자동 만료, 사용자 활동 감지, 메모리 정리 등
 */

import { AuthService } from '../services/authService';
import { SecureMemory } from './security';

export class SessionManager {
  private static readonly SESSION_TIMEOUT = 30 * 60 * 1000; // 30분
  private static readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5분
  private static readonly STORAGE_KEY = 'session_last_activity';
  
  private static timeoutId: NodeJS.Timeout | null = null;
  private static cleanupIntervalId: NodeJS.Timeout | null = null;
  private static activityListeners: (() => void)[] = [];
  private static isInitialized = false;

  // 세션 초기화
  static initialize(): void {
    if (this.isInitialized) return;
    
    console.log('🔒 SessionManager initializing...');
    
    // 마지막 활동 시간 확인 및 복원
    this.checkExistingSession();
    
    // 사용자 활동 감지 리스너 설정
    this.setupActivityDetection();
    
    // 정기적인 메모리 정리 시작
    this.startCleanupInterval();
    
    // 초기 타이머 시작
    this.resetTimer();
    
    this.isInitialized = true;
    console.log('✅ SessionManager initialized');
  }

  // 기존 세션 확인
  private static checkExistingSession(): void {
    try {
      const lastActivityStr = sessionStorage.getItem(this.STORAGE_KEY);
      if (lastActivityStr) {
        const lastActivity = parseInt(lastActivityStr, 10);
        const now = Date.now();
        
        if (now - lastActivity > this.SESSION_TIMEOUT) {
          console.log('🕒 Session expired, clearing data...');
          this.expireSession();
          return;
        }
        
        console.log(`🔄 Session restored, ${Math.round((this.SESSION_TIMEOUT - (now - lastActivity)) / 1000 / 60)}분 남음`);
      }
    } catch (error) {
      console.error('Session check error:', error);
    }
  }

  // 사용자 활동 감지 설정
  private static setupActivityDetection(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = this.throttle(() => {
      this.updateLastActivity();
      this.resetTimer();
    }, 1000); // 1초마다 최대 한 번만 실행
    
    events.forEach(event => {
      document.addEventListener(event, handleActivity, { passive: true });
      this.activityListeners.push(() => {
        document.removeEventListener(event, handleActivity);
      });
    });
    
    // 브라우저 포커스/블러 감지
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        this.updateLastActivity();
        this.resetTimer();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    this.activityListeners.push(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    });
  }

  // 쓰로틀링 함수 (과도한 호출 방지)
  private static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return function(this: any, ...args: Parameters<T>) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // 마지막 활동 시간 업데이트
  private static updateLastActivity(): void {
    try {
      sessionStorage.setItem(this.STORAGE_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to update last activity:', error);
    }
  }

  // 타이머 리셋
  private static resetTimer(): void {
    // 기존 타이머 클리어
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    // 새 타이머 설정
    this.timeoutId = setTimeout(() => {
      console.log('⏰ Session timeout reached');
      this.expireSession();
    }, this.SESSION_TIMEOUT);
  }

  // 세션 만료 처리
  private static expireSession(): void {
    console.log('🔒 Session expired - logging out user');
    
    // 모든 타이머 정리
    this.cleanup();
    
    // API 키 및 세션 데이터 정리
    AuthService.clearApiKey();
    SecureMemory.clearAll();
    
    // 세션 스토리지 정리
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
      sessionStorage.clear();
    } catch (error) {
      console.error('Session cleanup error:', error);
    }
    
    // 페이지 새로고침으로 로그아웃 상태로 전환
    window.location.reload();
  }

  // 정기적인 메모리 정리 시작
  private static startCleanupInterval(): void {
    this.cleanupIntervalId = setInterval(() => {
      console.log('🧹 Running periodic cleanup...');
      SecureMemory.clearAll();
      
      // 가비지 컬렉션 힌트 (브라우저가 지원하는 경우)
      if ('gc' in window && typeof window.gc === 'function') {
        try {
          window.gc();
        } catch (e) {
          // 무시 (일부 브라우저에서는 개발자 도구에서만 사용 가능)
        }
      }
    }, this.CLEANUP_INTERVAL);
  }

  // 세션 활성 상태 확인
  static isActive(): boolean {
    if (!this.isInitialized) return false;
    
    try {
      const lastActivityStr = sessionStorage.getItem(this.STORAGE_KEY);
      if (!lastActivityStr) return false;
      
      const lastActivity = parseInt(lastActivityStr, 10);
      const now = Date.now();
      
      return (now - lastActivity) < this.SESSION_TIMEOUT;
    } catch {
      return false;
    }
  }

  // 세션 남은 시간 반환 (초 단위)
  static getRemainingTime(): number {
    try {
      const lastActivityStr = sessionStorage.getItem(this.STORAGE_KEY);
      if (!lastActivityStr) return 0;
      
      const lastActivity = parseInt(lastActivityStr, 10);
      const now = Date.now();
      const remaining = this.SESSION_TIMEOUT - (now - lastActivity);
      
      return Math.max(0, Math.floor(remaining / 1000));
    } catch {
      return 0;
    }
  }

  // 수동 세션 연장
  static extendSession(): void {
    this.updateLastActivity();
    this.resetTimer();
    console.log('🔄 Session extended manually');
  }

  // 세션 정리 및 정지
  static cleanup(): void {
    console.log('🧹 Cleaning up SessionManager...');
    
    // 타이머들 정리
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    
    if (this.cleanupIntervalId) {
      clearInterval(this.cleanupIntervalId);
      this.cleanupIntervalId = null;
    }
    
    // 이벤트 리스너들 정리
    this.activityListeners.forEach(removeListener => removeListener());
    this.activityListeners = [];
    
    this.isInitialized = false;
  }

  // 세션 상태 정보 반환
  static getStatus(): {
    isActive: boolean;
    remainingMinutes: number;
    remainingSeconds: number;
    lastActivity: Date | null;
  } {
    const remainingSeconds = this.getRemainingTime();
    const remainingMinutes = Math.floor(remainingSeconds / 60);
    
    let lastActivity: Date | null = null;
    try {
      const lastActivityStr = sessionStorage.getItem(this.STORAGE_KEY);
      if (lastActivityStr) {
        lastActivity = new Date(parseInt(lastActivityStr, 10));
      }
    } catch {
      // 무시
    }
    
    return {
      isActive: this.isActive(),
      remainingMinutes,
      remainingSeconds: remainingSeconds % 60,
      lastActivity
    };
  }

  // 디버깅용 상태 로깅
  static logStatus(): void {
    const status = this.getStatus();
    console.log('🔒 Session Status:', {
      '활성 상태': status.isActive,
      '남은 시간': `${status.remainingMinutes}분 ${status.remainingSeconds}초`,
      '마지막 활동': status.lastActivity?.toLocaleTimeString() || '없음',
      '초기화됨': this.isInitialized
    });
  }
}

export default SessionManager;