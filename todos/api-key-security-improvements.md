# API 키 보안 개선 계획

**생성 날짜**: 2025-08-02  
**생성 시간**: 현재 시각

---

## 🎯 목표
GitHub Pages 환경에서 Gemini API 키의 보안성을 향상시키면서도 사용자 편의성을 유지하는 것

## 📋 현재 상황 분석

### 현재 문제점
- [x] API 키가 localStorage에 평문으로 저장됨
- [x] 브라우저 종료 후에도 API 키가 영구 보존됨
- [x] 개발자 도구에서 쉽게 조회 가능
- [x] XSS 공격 시 API 키 탈취 위험

### 제약 조건
- [x] 서버 없음 (GitHub Pages만 사용)
- [x] 복잡하지 않은 구현 방식 선호
- [x] 사용자 경험 저하 최소화

---

## 🔒 보안 개선 단계별 계획

### 1단계: 암호화된 sessionStorage (우선순위: 높음) ⭐⭐⭐⭐⭐
**예상 작업 시간**: 30분  
**보안 개선 효과**: ⭐⭐⭐⭐

#### 할 일
- [ ] localStorage → sessionStorage 변경
- [ ] XOR 암호화 + Base64 인코딩 구현
- [ ] 브라우저 세션별 고유 키 생성
- [ ] `authService.ts` 수정
- [ ] `security.ts`에 암호화 함수 추가

#### 기대 효과
- 브라우저 종료 시 자동 삭제
- 개발자 도구에서 평문 노출 방지
- 세션별 격리로 보안 강화

---

### 2단계: 자동 만료 시스템 (우선순위: 높음) ⭐⭐⭐⭐
**예상 작업 시간**: 30분  
**보안 개선 효과**: ⭐⭐⭐⭐

#### 할 일
- [ ] 30분 자동 만료 타이머 구현
- [ ] 5분마다 메모리 정리 함수 실행
- [ ] 만료 시 자동 로그아웃 기능
- [ ] 사용자 활동 감지로 타이머 갱신
- [ ] 만료 전 경고 알림 (선택사항)

#### 기대 효과
- 장시간 방치 시 자동 보안 처리
- 메모리 누수 방지
- 비활성 세션 자동 정리

---

### 3단계: CSP 헤더 강화 (우선순위: 중간) ⭐⭐⭐
**예상 작업 시간**: 15분  
**보안 개선 효과**: ⭐⭐⭐

#### 할 일
- [ ] `public/index.html`의 CSP 헤더 업데이트
- [ ] `block-all-mixed-content` 추가
- [ ] `upgrade-insecure-requests` 추가
- [ ] 불필요한 권한 제거

#### 현재 CSP 개선 대상
```html
<!-- 현재 -->
<meta http-equiv="Content-Security-Policy" content="...">

<!-- 개선 후 -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self'; 
  script-src 'self' 'unsafe-inline'; 
  style-src 'self' 'unsafe-inline'; 
  img-src 'self' data: blob:; 
  font-src 'self'; 
  connect-src 'self' https://generativelanguage.googleapis.com; 
  frame-src 'none'; 
  object-src 'none'; 
  base-uri 'self'; 
  form-action 'self';
  block-all-mixed-content;
  upgrade-insecure-requests;">
```

---

### 4단계: 고급 암호화 (우선순위: 낮음) ⭐⭐
**예상 작업 시간**: 1-2시간  
**보안 개선 효과**: ⭐⭐⭐⭐⭐

#### 할 일
- [ ] Web Crypto API 활용한 AES 암호화
- [ ] PBKDF2 키 유도 함수 구현
- [ ] 브라우저 지문 기반 키 생성
- [ ] `cryptoUtils.ts` 새로 생성
- [ ] 암호화/복호화 성능 테스트

---

## 📊 보안 개선 효과 비교

| 단계 | 구현 난이도 | 보안 효과 | 사용자 편의성 | 호환성 |
|------|------------|-----------|---------------|---------|
| 1단계 | ⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |
| 2단계 | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ✅ |
| 3단계 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ✅ |
| 4단계 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ |

---

## 🚀 실행 계획

### 즉시 실행 (오늘)
1. **1단계 + 2단계 조합 구현** (1-2시간)
   - 가장 큰 보안 개선 효과
   - 사용자 경험 저하 최소
   - GitHub Pages 완벽 호환

### 추후 고려 (다음 주)
2. **3단계 CSP 강화** (15분)
   - 간단한 설정 변경
   - 추가 보안 레이어

### 선택 사항 (필요시)
3. **4단계 고급 암호화** (여유 있을 때)
   - 최고 보안 수준
   - 구현 복잡도 높음

---

## 📝 추가 보안 권장사항

### 즉시 적용 가능
- [ ] API 키 입력 시 보안 경고 문구 표시
- [ ] 15분 비활성화 시 자동 로그아웃
- [ ] 개발자 도구 열림 감지 시 경고 (선택)
- [ ] API 사용량 비정상 패턴 감지 (선택)

### 사용자 교육
- [ ] API 키 보안 가이드 문서 작성
- [ ] 안전한 사용법 툴팁 추가
- [ ] 보안 설정 페이지 구성 (선택)

---

## ✅ 완료 체크리스트

### 1단계 완료 기준
- [ ] sessionStorage 암호화 저장 구현
- [ ] 기존 localStorage 마이그레이션
- [ ] 암호화/복호화 정상 동작 확인
- [ ] 브라우저 재시작 시 자동 삭제 확인

### 2단계 완료 기준
- [ ] 30분 타이머 정상 동작
- [ ] 자동 로그아웃 기능 확인
- [ ] 메모리 정리 함수 동작 확인
- [ ] 사용자 활동 감지 정상 작동

### 전체 테스트
- [ ] 다양한 브라우저에서 테스트
- [ ] 모바일 환경 테스트
- [ ] 보안 기능 동작 확인
- [ ] 성능 영향 최소화 확인

---

## 📞 참고 링크 및 리소스

- Web Crypto API: https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API
- CSP 가이드: https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP
- GitHub Pages 보안: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https

---

**업데이트 히스토리**
- 2025-08-02: 초기 계획 수립