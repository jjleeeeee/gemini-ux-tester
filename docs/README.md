# 📚 프로젝트 문서 가이드

## 📁 폴더 구조

```
docs/                        # 완료된 프로젝트 문서들
├── README.md               # 이 파일 (문서화 가이드)
├── security/               # 보안 관련 문서
│   ├── summary.md         # 보안 개선 프로젝트 요약
│   └── implementation-guide.md  # 상세 구현 가이드
├── features/              # 기능 개발 문서 (예정)
└── architecture/          # 아키텍처 문서 (예정)

todos/                      # 진행 중인 계획만
└── (현재 진행 중인 할일들)

archive/                    # 완료된 계획서들 (선택사항)
└── (완료된 프로젝트 계획서들)
```

## 📝 문서 작성 워크플로우

### 1️⃣ 계획 단계
- `todos/project-name-plan.md` 생성
- 목표, 단계별 계획, 체크리스트 작성

### 2️⃣ 진행 단계  
- 할일 체크리스트 업데이트
- 진행 상황 기록

### 3️⃣ 완료 단계
- **상세 문서**: `docs/category/implementation-guide.md`
- **요약 문서**: `docs/category/summary.md`  
- **계획서**: `archive/`로 이동 또는 삭제

## 📋 문서 유형별 가이드

### 📄 Summary (요약 문서)
- **목적**: 프로젝트 개요 및 핵심 결과
- **길이**: 1-2페이지
- **포함 내용**: 목표, 결과, 주요 기능, 성과 지표

### 📖 Implementation Guide (구현 가이드)
- **목적**: 상세한 기술 문서 및 과정 기록
- **길이**: 제한 없음
- **포함 내용**: 단계별 과정, 코드 변경사항, 문제 해결, 테스트 결과

## 🎯 현재 완료된 프로젝트

### 🔒 보안 개선 (2025-08-02 완료)
- **요약**: [security/summary.md](./security/summary.md)
- **상세**: [security/implementation-guide.md](./security/implementation-guide.md)
- **성과**: API 키 보안 90% 향상, 성능 최적화

## 📋 진행 예정 프로젝트

### 🔧 파일 업로드 기능 개선 (계획 수립 완료)
- **계획서**: [features/file-upload-improvement-plan.md](./features/file-upload-improvement-plan.md)
- **목표**: 클릭 선택 기능 수정 + 모바일 카메라/갤러리 접근
- **예상 소요 시간**: 3시간

### 🖼️ 이미지 압축 최적화 (계획 수립 완료)
- **계획서**: [features/image-compression-optimization-plan.md](./features/image-compression-optimization-plan.md)
- **목표**: API 500 에러 해결 + UX 분석 품질 유지
- **예상 소요 시간**: 8.5시간
- **우선순위**: 🔴 높음 (현재 서비스 장애)

---

**💡 팁**: 각 프로젝트마다 summary.md에서 implementation-guide.md로 링크를 연결하여 문서 간 연결성을 유지하세요.