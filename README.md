# 🤖 Gemini UX Tester

Yuki 페르소나를 활용한 Gemini AI 기반 UX 이미지 분석 도구

## 📋 프로젝트 개요

**Gemini UX Tester**는 Google Gemini AI를 활용하여 UX 화면 이미지를 분석하는 도구입니다. 특별히 일본 팬 문화에 정통한 '유키' 페르소나를 통해 위버스 굿즈 픽업 플로우와 일반적인 UX에 대한 전문적인 피드백을 제공합니다.

### 🎯 주요 기능

- **API 키 인증**: 개인 Gemini API 키를 통한 안전한 인증
- **이미지 업로드**: 드래그 앤 드롭 방식의 직관적인 이미지 업로드
- **Yuki 페르소나 분석**: 일본 팬 문화 전문가 관점의 UX 분석
- **특화 분석**: 위버스 픽업 플로우에 최적화된 분석 옵션
- **결과 내보내기**: JSON 형식으로 분석 결과 내보내기

## 🚀 빠른 시작

### 1. 프로젝트 설치

```bash
# 저장소 클론 (또는 프로젝트 폴더로 이동)
cd gemini-ux-tester

# 의존성 설치
npm install

# 개발 서버 시작
npm start
```

### 2. Gemini API 키 발급

1. [Google AI Studio](https://makersuite.google.com/app/apikey)에서 API 키 발급
2. 애플리케이션에서 API 키 입력 및 인증

### 3. 사용 방법

1. **인증**: Gemini API 키 입력 및 검증
2. **업로드**: UX 화면 이미지를 드래그 앤 드롭으로 업로드
3. **분석 타입 선택**:
   - 일반 UX 분석: 전반적인 사용자 경험 분석
   - 위버스 픽업 플로우: 굿즈 픽업 예약에 특화된 분석
4. **분석 시작**: Yuki 페르소나의 전문적인 UX 피드백 수령
5. **결과 활용**: 분석 결과를 JSON으로 내보내기

## 🏗️ 아키텍처

### 프로젝트 구조

```
src/
├── components/
│   ├── auth/                 # 인증 관련 컴포넌트
│   │   ├── AuthPage.tsx     # API 키 인증 페이지
│   │   └── AuthPage.css
│   ├── upload/               # 이미지 업로드 컴포넌트
│   │   ├── ImageUpload.tsx  # 드래그 앤 드롭 업로드
│   │   └── ImageUpload.css
│   ├── analysis/             # 분석 관련 컴포넌트
│   │   ├── AnalysisOptions.tsx  # 분석 타입 선택
│   │   ├── AnalysisOptions.css
│   │   ├── ResultsPanel.tsx     # 분석 결과 표시
│   │   └── ResultsPanel.css
│   └── common/               # 공통 컴포넌트
├── services/
│   ├── geminiApi.ts         # Gemini API 통신
│   └── authService.ts       # 인증 서비스
├── personas/
│   ├── yukiPersona.ts       # Yuki 페르소나 정의
│   └── promptTemplates.ts   # 프롬프트 템플릿
├── utils/
│   ├── imageProcessor.ts    # 이미지 처리 유틸리티
│   └── constants.ts         # 상수 정의
└── App.tsx                  # 메인 애플리케이션
```

### 기술 스택

- **Frontend**: React 18 + TypeScript
- **AI Integration**: Google Gemini API
- **File Upload**: react-dropzone
- **Markdown Rendering**: react-markdown
- **HTTP Client**: Axios
- **Styling**: CSS Modules

## 👧 Yuki 페르소나

### 페르소나 프로필

- **이름**: 유키 (Yuki)
- **나이**: 23세
- **거주지**: 일본, 도쿄
- **직업**: 사회초년생 (팬 활동에 적극적)

### 핵심 특징

- **팬 여정 단계**: Core Fan (구매, 몰입, 헌신 단계)
- **활동 영역**: 시청, 정보, 연결, 서포트, 참여, 수집 활동
- **문화적 맥락**: 일본 팬 문화와 모바일 UI/UX 관습

### 분석 관점

1. **감정적 반응**: 첫인상과 즉각적 우려사항
2. **실용적 관점**: 사용성과 효율성 평가
3. **팬 경험**: 일본 팬 문화를 고려한 개선 제안

## 🔧 개발 가이드

### 환경 설정

```bash
# 환경 변수 설정 (.env.local 파일 생성)
REACT_APP_GEMINI_API_KEY=your_api_key_here
```

### 주요 컴포넌트

#### AuthPage
- Gemini API 키 입력 및 검증
- 로컬스토리지를 통한 인증 상태 관리

#### ImageUpload
- react-dropzone을 활용한 드래그 앤 드롭
- 이미지 형식 및 크기 검증 (10MB 제한)
- Base64 변환 및 미리보기

#### AnalysisOptions
- 일반 UX 분석 vs 위버스 픽업 플로우 선택
- 분석 시작 버튼 및 로딩 상태 관리

#### ResultsPanel
- react-markdown을 통한 결과 렌더링
- 분석 중 로딩 애니메이션
- JSON 형식 결과 내보내기

### API 통합

#### Gemini API 서비스
```typescript
// API 키 검증
await geminiService.validateApiKey();

// 이미지 분석
const results = await geminiService.analyzeImageWithPersona(
  imageBase64,
  personaPrompt,
  contextPrompt
);
```

## 🔮 향후 계획

### Phase 1: 기본 기능 (현재)
- ✅ API 키 인증
- ✅ 이미지 업로드
- ✅ Yuki 페르소나 분석
- ✅ 결과 표시 및 내보내기

### Phase 2: 기능 확장
- 📋 분석 히스토리 저장
- 📋 다중 이미지 배치 분석
- 📋 분석 결과 비교 기능

### Phase 3: Figma 플러그인
- 📋 Figma Plugin API 통합
- 📋 디자인 토큰과의 연동
- 📋 Figma 내 직접 분석 기능

### Phase 4: 고도화
- 📋 추가 페르소나 지원
- 📋 커스텀 프롬프트 생성
- 📋 팀 협업 기능

## 📄 라이센스

이 프로젝트는 개인 사용 및 학습 목적으로 제작되었습니다.

## 🤝 기여하기

프로젝트 개선에 대한 제안이나 버그 리포트는 언제나 환영합니다!

---

**Made with ❤️ for UX analysis | Powered by Google Gemini AI**