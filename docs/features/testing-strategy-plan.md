# 🧪 테스트 코드 체계적 작성 계획

**프로젝트**: Gemini UX Tester  
**계획 수립일**: 2025-08-02  
**상태**: 📋 계획 수립 완료, 단계별 구현 예정  
**관련 이슈**: GitHub Actions 배포 실패 (테스트 파일 없음)

---

## 🚨 현재 상황

### 해결된 문제:
- ✅ **긴급 수정**: 기본 테스트 파일 (`src/App.test.tsx`) 추가
- ✅ **배포 복구**: GitHub Actions 테스트 단계 통과 가능

### 현재 테스트 현황:
- **기본 테스트**: App 컴포넌트 렌더링 테스트만 존재
- **커버리지**: 매우 낮음 (예상 5% 미만)
- **테스트 프레임워크**: Jest + React Testing Library (기본 설정)

---

## 🎯 테스트 전략 및 목표

### 📊 **목표 커버리지**:
- **1단계 목표**: 60% 이상
- **2단계 목표**: 80% 이상  
- **최종 목표**: 90% 이상

### 🏗️ **테스트 피라미드 전략**:
```
        🔺 E2E Tests (5%)
       📐 Integration Tests (15%)  
      🟦🟦🟦 Unit Tests (80%)
```

### 🎯 **테스트 우선순위**:
1. **🔴 Critical Path**: 인증, 이미지 업로드, API 호출
2. **🟡 Core Features**: 분석 결과, 파일 검증, 보안 기능
3. **🟢 UI Components**: 버튼, 폼, 레이아웃 컴포넌트

---

## 📋 단계별 구현 계획

### 🎯 Phase 1: 핵심 기능 Unit Tests (우선순위: 높음)

**목표**: Critical Path 100% 커버리지

#### 1.1 인증 시스템 테스트
**파일**: `src/services/authService.test.ts`
```typescript
describe('AuthService', () => {
  // API 키 검증 테스트
  test('validateApiKey - 유효한 키 검증')
  test('validateApiKey - 무효한 키 거부')
  
  // 암호화 저장 테스트  
  test('saveApiKey - sessionStorage 암호화 저장')
  test('getApiKey - 암호화된 키 복호화')
  
  // 마이그레이션 테스트
  test('migrateFromLocalStorage - 자동 마이그레이션')
});
```

#### 1.2 보안 유틸리티 테스트
**파일**: `src/utils/security.test.ts`
```typescript
describe('Security Utils', () => {
  // 암호화/복호화 테스트
  test('encryptData - 데이터 암호화')
  test('decryptData - 데이터 복호화')
  
  // 파일명 보안 테스트
  test('sanitizeFileName - 안전한 파일명 변환')
  test('validateInput - 입력값 검증')
});
```

#### 1.3 세션 관리 테스트
**파일**: `src/utils/sessionManager.test.ts`
```typescript
describe('SessionManager', () => {
  // 세션 생명주기 테스트
  test('initialize - 세션 매니저 초기화')
  test('extendSession - 사용자 활동 시 세션 연장')
  test('expireSession - 30분 후 자동 만료')
  
  // 활동 감지 테스트
  test('detectUserActivity - 사용자 활동 감지')
  test('cleanup - 정리 작업 수행')
});
```

**예상 소요 시간**: 4시간

---

### 🎯 Phase 2: 컴포넌트 Unit Tests (우선순위: 중간)

**목표**: UI 컴포넌트 80% 커버리지

#### 2.1 이미지 업로드 컴포넌트
**파일**: `src/components/upload/ImageUpload.test.tsx`
```typescript
describe('ImageUpload Component', () => {
  // 드래그&드롭 테스트
  test('handles drag and drop file upload')
  test('validates file type and size')
  test('shows error for invalid files')
  
  // 다중 이미지 테스트
  test('supports multiple image upload')
  test('enforces maximum image limit')
  test('allows image reordering')
  
  // 압축 기능 테스트 (Phase 3에서 추가)
  test('compresses large images automatically')
});
```

#### 2.2 분석 결과 컴포넌트
**파일**: `src/components/analysis/ResultsPanel.test.tsx`
```typescript
describe('ResultsPanel Component', () => {
  // 결과 표시 테스트
  test('displays analysis results correctly')
  test('handles loading state')
  test('shows error state appropriately')
  
  // 다중 이미지 결과 테스트
  test('displays multiple image analysis')
  test('supports result comparison view')
});
```

#### 2.3 인증 페이지 컴포넌트
**파일**: `src/components/auth/AuthPage.test.tsx`
```typescript
describe('AuthPage Component', () => {
  // 폼 검증 테스트
  test('validates API key input')
  test('shows validation errors')
  test('submits form correctly')
  
  // 보안 안내 테스트
  test('displays security information')
  test('links to API key generation')
});
```

**예상 소요 시간**: 6시간

---

### 🎯 Phase 3: Integration Tests (우선순위: 중간)

**목표**: 컴포넌트 간 상호작용 테스트

#### 3.1 인증 플로우 통합 테스트
```typescript
describe('Authentication Flow Integration', () => {
  test('complete login flow with valid API key')
  test('automatic logout after session expiry')
  test('secure data migration from localStorage')
});
```

#### 3.2 이미지 분석 플로우 통합 테스트
```typescript
describe('Image Analysis Flow Integration', () => {
  test('upload image → compress → analyze → display results')
  test('multiple image upload and batch analysis')
  test('error handling throughout the flow')
});
```

#### 3.3 API 서비스 통합 테스트
```typescript
describe('Gemini API Integration', () => {
  test('successful API calls with valid data')
  test('error handling for API failures')
  test('request size validation and compression')
});
```

**예상 소요 시간**: 4시간

---

### 🎯 Phase 4: E2E Tests (우선순위: 낮음)

**목표**: 실제 사용자 시나리오 검증

#### 4.1 Playwright E2E 테스트 설정
```typescript
// tests/e2e/user-journey.spec.ts
test('Complete user journey: login → upload → analyze', async ({ page }) => {
  // 로그인
  await page.goto('/');
  await page.fill('[data-testid=api-key-input]', 'test-api-key');
  await page.click('[data-testid=login-button]');
  
  // 이미지 업로드
  await page.setInputFiles('[data-testid=file-input]', 'test-image.jpg');
  
  // 분석 실행 및 결과 확인
  await page.click('[data-testid=analyze-button]');
  await expect(page.locator('[data-testid=results]')).toBeVisible();
});
```

#### 4.2 크로스 브라우저 테스트
- Chrome, Firefox, Safari에서 핵심 기능 검증
- 모바일 브라우저 호환성 테스트

**예상 소요 시간**: 6시간

---

## 🛠️ 테스트 인프라 구축

### 📦 **필요한 패키지 설치**:
```bash
# 테스트 유틸리티
npm install --save-dev @testing-library/jest-dom
npm install --save-dev @testing-library/user-event

# Mock 라이브러리
npm install --save-dev jest-environment-jsdom
npm install --save-dev msw # API 모킹

# E2E 테스트 (이미 설치됨)
# @playwright/test
```

### ⚙️ **Jest 설정 강화**:
```javascript
// jest.config.js 또는 package.json
{
  "collectCoverageFrom": [
    "src/**/*.{js,jsx,ts,tsx}",
    "!src/index.tsx",
    "!src/react-app-env.d.ts",
    "!src/**/*.d.ts"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 60,
      "functions": 60,
      "lines": 60,
      "statements": 60
    }
  }
}
```

### 🎯 **테스트 데이터 관리**:
```typescript
// src/__tests__/fixtures/
export const mockApiKey = 'test-api-key-12345';
export const mockImageFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
export const mockAnalysisResult = {
  analysis: '훌륭한 UX 디자인입니다...',
  score: 85
};
```

---

## 📊 테스트 자동화 및 CI/CD 통합

### 🔄 **GitHub Actions 워크플로우 강화**:
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
          cache: npm
      
      # Unit & Integration Tests
      - name: Run Tests
        run: npm test -- --coverage --watchAll=false
      
      # Upload Coverage
      - name: Upload Coverage
        uses: codecov/codecov-action@v3
        
      # E2E Tests (별도 job)
      - name: Run E2E Tests
        run: npx playwright test
```

### 📈 **커버리지 모니터링**:
- **Codecov** 또는 **Coveralls** 통합
- PR에서 커버리지 변화 자동 리포트
- 커버리지 감소 시 빌드 실패

---

## 🚀 구현 일정

| Phase | 내용 | 소요 시간 | 우선순위 | 완료 목표 |
|-------|------|----------|----------|-----------|
| **Phase 1** | 핵심 기능 Unit Tests | 4시간 | 🔴 높음 | 1주차 |
| **Phase 2** | 컴포넌트 Unit Tests | 6시간 | 🟡 중간 | 2주차 |
| **Phase 3** | Integration Tests | 4시간 | 🟡 중간 | 3주차 |
| **Phase 4** | E2E Tests | 6시간 | 🟢 낮음 | 4주차 |

**총 예상 소요 시간**: 20시간 (4주 계획)

---

## 📋 테스트 작성 가이드라인

### ✅ **Good Practices**:
1. **AAA 패턴**: Arrange → Act → Assert
2. **설명적 테스트명**: `should return error when API key is invalid`
3. **Independent Tests**: 테스트 간 의존성 제거
4. **Mock 적절히 사용**: 외부 의존성 격리
5. **Edge Cases 포함**: 경계값, 오류 케이스 테스트

### 🚫 **Avoid**:
1. **Implementation Details 테스트**: 내부 구현이 아닌 동작 테스트
2. **과도한 Mocking**: 실제 동작과 괴리
3. **Flaky Tests**: 불안정한 테스트 작성 금지
4. **거대한 테스트**: 하나의 테스트에서 너무 많은 것 검증

---

## 🎯 성공 지표 (KPI)

### 핵심 메트릭:
1. **코드 커버리지**: 각 Phase별 목표 달성
2. **테스트 안정성**: Flaky rate < 1%
3. **빌드 시간**: 테스트 포함 5분 이내
4. **버그 감소율**: 프로덕션 버그 50% 감소

### 품질 지표:
- **테스트 속도**: Unit tests < 30초
- **신뢰도**: 테스트 성공률 99%+
- **유지보수성**: 코드 변경 시 테스트 수정 최소화

---

## 🔗 참고 리소스

### 테스트 가이드:
- [React Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Jest Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Playwright Testing Guide](https://playwright.dev/docs/best-practices)

### 도구 및 라이브러리:
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [Testing Library](https://testing-library.com/)
- [Jest DOM matchers](https://github.com/testing-library/jest-dom)

---

## 💡 다음 단계

1. **즉시 시작**: Phase 1 핵심 기능 테스트부터 구현
2. **점진적 확장**: 주차별로 커버리지 확대
3. **지속적 개선**: 테스트 품질 모니터링 및 리팩토링
4. **팀 교육**: 테스트 작성 가이드라인 공유

---

**🎯 최종 목표**: 안정적이고 신뢰할 수 있는 Gemini UX Tester 서비스를 위한 견고한 테스트 기반 구축