# 🖼️ 이미지 압축 최적화 계획

**프로젝트**: Gemini UX Tester  
**계획 수립일**: 2025-08-02  
**상태**: 📋 계획 수립 완료, 구현 대기  
**관련 이슈**: Gemini API 500 에러 (이미지 크기 초과)

---

## 🚨 현재 문제 상황

### 발생 에러:
```
POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=*** 500 (Internal Server Error)
```

### 📊 문제 분석:
- **원인**: 대용량 이미지 파일로 인한 Gemini API 요청 크기 초과
- **현재 제한**: 파일 크기 10MB, Base64 15MB
- **실제 API 제한**: 약 2-3MB (추정)
- **영향**: 사용자가 고해상도 이미지 업로드 시 분석 실패

---

## 🎯 핵심 고려사항: 압축 vs 분석 품질

### ⚖️ **딜레마**:
- **압축 필요성**: API 제한으로 인한 에러 방지
- **품질 우려**: 압축으로 인한 UX 분석 정확도 저하

### 🔍 **UX 분석에 미치는 영향도**:

| 요소 | 압축 영향도 | 중요도 | 대응 방안 |
|------|-------------|--------|-----------|
| 텍스트 가독성 | 🟡 중간 | ⭐⭐⭐⭐⭐ | 높은 품질 유지 (0.9+) |
| 레이아웃 구조 | 🟢 낮음 | ⭐⭐⭐⭐⭐ | 해상도 유지 |
| 색상 대비 | 🟡 중간 | ⭐⭐⭐⭐ | 적절한 압축률 (0.85+) |
| 아이콘 디테일 | 🟡 중간 | ⭐⭐⭐ | 샤프닝 필터 적용 |
| 미세한 간격 | 🔴 높음 | ⭐⭐ | 해상도 우선 보존 |

---

## 📋 단계별 구현 계획

### 🎯 Phase 1: Smart Compression 구현 (우선순위: 높음)

**목표**: UX 분석 품질을 보존하면서 API 제한 준수

#### 1.1 압축 라이브러리 설치
```bash
npm install browser-image-compression
npm install @types/browser-image-compression --save-dev
```

#### 1.2 UX 최적화 압축 유틸리티 구현
**파일**: `src/utils/imageCompression.ts`

```typescript
import imageCompression from 'browser-image-compression';

export interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  shouldCompress: boolean;
}

export const getOptimalCompressionSettings = (fileSize: number, imageType: string) => {
  const sizeMB = fileSize / (1024 * 1024);
  
  if (sizeMB < 2) {
    // 2MB 미만: 압축 없음
    return null;
  } else if (sizeMB < 5) {
    // 2-5MB: 경미한 압축 (UX 분석에 최적)
    return {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.9, // 텍스트 가독성 유지
      alwaysKeepResolution: false
    };
  } else {
    // 5MB 이상: 적극적 압축
    return {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      fileType: 'image/jpeg',
      initialQuality: 0.85,
      alwaysKeepResolution: false
    };
  }
};

export const compressImageForUXAnalysis = async (file: File): Promise<CompressionResult> => {
  const originalSize = file.size;
  const compressionSettings = getOptimalCompressionSettings(originalSize, file.type);
  
  if (!compressionSettings) {
    return {
      compressedFile: file,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      shouldCompress: false
    };
  }
  
  try {
    const compressedFile = await imageCompression(file, compressionSettings);
    
    return {
      compressedFile,
      originalSize,
      compressedSize: compressedFile.size,
      compressionRatio: originalSize / compressedFile.size,
      shouldCompress: true
    };
  } catch (error) {
    throw new Error(`이미지 압축 실패: ${error.message}`);
  }
};
```

#### 1.3 ImageUpload 컴포넌트 통합
**파일**: `src/components/upload/ImageUpload.tsx`

**주요 변경사항**:
1. `convertToBase64` 함수에 압축 로직 추가
2. 압축 진행 상태 UI 표시
3. 압축 결과 사용자 피드백

**예상 소요 시간**: 2시간

---

### 🎯 Phase 2: 사용자 경험 개선 (우선순위: 중간)

**목표**: 압축 과정의 투명성 및 사용자 제어권 제공

#### 2.1 압축 상태 UI 구현
```typescript
// 상태 관리
const [compressionStatus, setCompressionStatus] = useState<{
  isCompressing: boolean;
  progress: number;
  fileName: string;
}>({ isCompressing: false, progress: 0, fileName: '' });

// UI 컴포넌트
const CompressionProgress = () => (
  <div className="compression-progress">
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>이미지 최적화 중... ({compressionStatus.progress}%)</span>
    </div>
    <div className="text-sm text-muted-foreground">
      {compressionStatus.fileName} - UX 분석을 위해 품질을 유지하며 압축합니다
    </div>
  </div>
);
```

#### 2.2 압축 옵션 선택 UI
```typescript
const CompressionOptions = () => (
  <div className="compression-options">
    <label>압축 모드:</label>
    <select onChange={handleCompressionModeChange}>
      <option value="auto">자동 (권장)</option>
      <option value="high-quality">고품질 (분석 정확도 우선)</option>
      <option value="fast">빠른 압축 (업로드 속도 우선)</option>
    </select>
  </div>
);
```

#### 2.3 압축 결과 피드백
```typescript
const showCompressionResult = (result: CompressionResult) => {
  if (result.shouldCompress) {
    setMessage(`이미지가 최적화되었습니다: ${result.originalSize}MB → ${result.compressedSize}MB (${(result.compressionRatio * 100).toFixed(0)}% 압축)`);
  }
};
```

**예상 소요 시간**: 1.5시간

---

### 🎯 Phase 3: 품질 검증 및 최적화 (우선순위: 중간)

**목표**: 압축 품질과 분석 정확도 검증

#### 3.1 품질 검증 시스템
```typescript
// 압축 품질 검증
const validateCompressionQuality = async (original: File, compressed: File): Promise<QualityMetrics> => {
  return {
    textReadability: await checkTextReadability(compressed),
    colorPreservation: await checkColorAccuracy(compressed),
    layoutIntegrity: await checkLayoutStructure(compressed),
    overallScore: calculateOverallScore()
  };
};
```

#### 3.2 A/B 테스트 프레임워크
- 압축 전후 Gemini 분석 결과 비교
- 사용자 만족도 측정
- 분석 정확도 메트릭 수집

#### 3.3 동적 압축 조정
```typescript
// 실시간 압축률 조정
const adjustCompressionBasedOnContent = (imageAnalysis: ImageContent) => {
  if (imageAnalysis.hasSmallText) {
    return { quality: 0.95 }; // 텍스트 많으면 고품질
  }
  if (imageAnalysis.isSimpleLayout) {
    return { quality: 0.8 };  // 단순 레이아웃은 더 압축
  }
  return { quality: 0.85 };   // 기본값
};
```

**예상 소요 시간**: 2시간

---

### 🎯 Phase 4: 고급 최적화 (우선순위: 낮음)

**목표**: 엣지 케이스 처리 및 성능 최적화

#### 4.1 Progressive Enhancement
- WebP 지원 브라우저에서 WebP 사용
- AVIF 포맷 지원 (미래 대비)
- 점진적 압축 (progressive JPEG)

#### 4.2 클라이언트 사이드 이미지 분석
```typescript
// 압축 전 이미지 내용 분석
const analyzeImageContent = async (file: File): Promise<ImageAnalysis> => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  return {
    hasText: detectTextRegions(ctx),
    colorComplexity: analyzeColorDistribution(ctx),
    layoutType: classifyLayoutStructure(ctx)
  };
};
```

#### 4.3 배치 압축 최적화
- 여러 이미지 동시 압축
- Web Worker 활용
- 메모리 효율적 처리

**예상 소요 시간**: 3시간

---

## 🧪 테스트 계획

### 1️⃣ 압축 품질 테스트

**테스트 이미지 세트**:
- **모바일 UI**: 작은 텍스트, 아이콘 중심
- **웹 대시보드**: 복잡한 레이아웃, 차트
- **고해상도 목업**: 4K+ 해상도
- **저대비 디자인**: 회색 텍스트, 미묘한 구분

**평가 기준**:
- 텍스트 가독성 (OCR 정확도)
- 색상 정확도 (Delta E 측정)
- 구조 보존도 (레이아웃 인식률)

### 2️⃣ API 호환성 테스트

**테스트 시나리오**:
- 단일 이미지 업로드 (1MB ~ 10MB)
- 다중 이미지 업로드 (3개 동시)
- 다양한 파일 형식 (PNG, JPEG, WebP)
- 극한 해상도 (8K, 파노라마)

**성공 기준**:
- API 호출 성공률 98% 이상
- 압축 시간 5초 이내
- 메모리 사용량 100MB 이내

### 3️⃣ 사용자 경험 테스트

**측정 지표**:
- 업로드 완료율
- 사용자 만족도 (주관적 평가)
- 분석 결과 품질 (AI 피드백 점수)

---

## 📊 성공 지표 (KPI)

### 핵심 지표
1. **API 에러율**: 500 에러 0% 달성
2. **압축 효율성**: 평균 50% 크기 감소
3. **분석 품질**: 압축 전 대비 95% 이상 정확도 유지
4. **사용자 만족도**: 4.5/5.0 이상

### 기술적 지표
- **압축 시간**: 평균 3초 이내
- **메모리 사용량**: 50MB 이내
- **API 응답 시간**: 10초 이내
- **압축 실패율**: 1% 이하

---

## 🚀 구현 일정

| Phase | 내용 | 소요 시간 | 우선순위 |
|-------|------|----------|----------|
| Phase 1 | Smart Compression 구현 | 2시간 | 🔴 높음 |
| Phase 2 | 사용자 경험 개선 | 1.5시간 | 🟡 중간 |
| Phase 3 | 품질 검증 및 최적화 | 2시간 | 🟡 중간 |
| Phase 4 | 고급 최적화 | 3시간 | 🟢 낮음 |

**총 예상 소요 시간**: 8.5시간

---

## 🎯 즉시 적용 가능한 임시 해결책

### ⚡ 긴급 Fix (10분 내 적용):
```typescript
// ImageUpload.tsx 파일 크기 제한 강화
const maxFileSize = useMemo(() => 2 * 1024 * 1024, []); // 10MB → 2MB

// Base64 크기 제한 강화
if (!validateInput.textLength(base64Data, 100, 2500000)) { // 15MB → 1.9MB Base64
  reject(new Error('이미지 크기가 너무 큽니다. 2MB 이하의 이미지를 선택해주세요.'));
}
```

### 📝 에러 메시지 개선:
```typescript
const getFileSizeErrorMessage = (fileSize: number) => {
  const sizeMB = (fileSize / (1024 * 1024)).toFixed(1);
  return `파일 크기가 ${sizeMB}MB입니다. 정확한 UX 분석을 위해 2MB 이하의 이미지를 권장합니다. 
          큰 이미지는 자동으로 최적화됩니다.`;
};
```

---

## 🔗 관련 리소스

### 기술 문서
- [Browser Image Compression](https://github.com/Donaldcwl/browser-image-compression)
- [Gemini API Limits](https://ai.google.dev/gemini-api/docs/quota)
- [Image Optimization Best Practices](https://web.dev/fast/#optimize-your-images)

### 압축 품질 참고
- [JPEG Quality Settings](https://photo.stackexchange.com/questions/30958/what-quality-to-choose-when-converting-to-jpg)
- [WebP vs JPEG Comparison](https://developers.google.com/speed/webp/docs/webp_study)

---

## 💡 다음 단계

1. **Phase 1 구현**: Smart Compression 시스템 구축
2. **품질 테스트**: 실제 UX 이미지로 압축 품질 검증
3. **사용자 피드백**: 베타 테스터를 통한 사용성 검증
4. **성능 모니터링**: 압축 효율성 및 API 안정성 추적

---

**🎯 최종 목표**: 사용자가 어떤 크기의 이미지를 업로드하더라도 **품질 저하 없이** Gemini가 정확한 UX 분석을 제공할 수 있는 시스템 구축