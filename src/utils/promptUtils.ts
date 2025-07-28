// AI 분석 모드를 위한 프롬프트 유틸리티

export type AnalysisMode = 'ai-auto' | 'persona-based' | 'situation-based' | 'custom';

export interface AnalysisModeInfo {
  mode: AnalysisMode;
  title: string;
  description: string;
}

// 분석 모드 결정 로직
export function determineAnalysisMode(persona?: string, situation?: string): AnalysisModeInfo {
  const hasPersona = persona && persona.trim().length > 0;
  const hasSituation = situation && situation.trim().length > 0;

  if (hasPersona && hasSituation) {
    return {
      mode: 'custom',
      title: '퍼소나 & 상황 맞춤 분석',
      description: `${persona.trim()}의 관점에서 "${situation.trim()}" 상황을 고려한 분석`
    };
  }

  if (hasPersona && !hasSituation) {
    return {
      mode: 'persona-based',
      title: '퍼소나 기반 분석',
      description: `${persona.trim()}의 관점에서 분석`
    };
  }

  if (!hasPersona && hasSituation) {
    return {
      mode: 'situation-based',
      title: '상황 맞춤 분석',
      description: `"${situation.trim()}" 상황을 고려한 AI 전문가 분석`
    };
  }

  return {
    mode: 'ai-auto',
    title: 'AI 자동 분석',
    description: 'AI UX 전문가의 객관적이고 포괄적인 분석'
  };
}

// 기본 분석 프롬프트 템플릿
export function getBaseAnalysisPrompt(type: 'general' | 'weverse-pickup'): string {
  const basePrompt = `이 UI/UX 화면을 실제 사용자처럼 깊이 있게 체험하고 분석해주세요.

## 🔍 단계별 사용자 여정 체험
먼저 화면을 보고 실제로 과업을 수행한다고 생각하며, 각 단계에서 다음 4가지를 고려하며 생각의 흐름을 말해주세요:

1. **무엇이 보이는지** - 화면에서 가장 먼저 눈에 들어오는 요소들
2. **다음에 무엇을 해야 할 것 같은지** - 어떤 버튼이나 영역을 터치해야 할지, 왜 그렇게 생각했는지
3. **지금 어떤 느낌이 드는지** - 혼란스러운지, 편리한지, 불안한지 등의 감정을 솔직하게 (이모지 포함 🤔😊😤)
4. **이 버튼을 누르면 무엇이 나올 것으로 기대하는지** - 다음 화면에 대한 예상

## 📊 상세 분석 항목

### 1. **첫인상과 감정적 반응**
   - 화면을 처음 봤을 때의 솔직한 느낌과 반응
   - 신뢰감, 혼란감, 호감도 등을 구체적으로
   - 시각적 임팩트와 브랜딩 효과

### 2. **사용자 여정 시뮬레이션**
   - 실제 사용 상황을 가정한 단계별 행동 시나리오
   - 각 단계에서 느끼는 감정과 생각의 변화
   - 예상과 다른 결과가 나올 때의 반응

### 3. **사용성 및 접근성 체험**
   - 정보를 찾는 과정에서의 어려움이나 편리함
   - 텍스트 가독성과 버튼 누르기 편의성
   - 실수할 가능성이 있는 부분들

### 4. **감정 기반 평가**
   - **가장 좋았던 점**: 어떤 부분이 가장 편리하고 만족스러웠는지, 구체적인 이유
   - **가장 짜증났던 점**: 어느 단계에서 불편함이나 짜증을 느꼈는지, 왜 그랬는지
   - **전체 난이도**: 과업 수행 난이도 점수 (1점: 매우 어려움 ~ 10점: 매우 쉬움)

### 5. **비판적 개선 제안**
   - 매우 꼼꼼하고 비판적인 사용자 관점에서 사소한 불편함도 솔직하게 지적
   - 구체적인 개선 방안과 우선순위
   - 이상적인 사용자 경험을 위한 제안

**💡 특별 요청**: 답변 전체에 걸쳐 감정을 이모지로 표현하고, 실제 사용자가 머릿속으로 생각하는 것처럼 솔직하고 자연스럽게 작성해주세요.

`;

  if (type === 'weverse-pickup') {
    return basePrompt + `
**🎯 특별 고려사항: 위버스 굿즈 픽업 예약 시스템**
- 빠른 시간 내 예약 완료해야 하는 긴급성과 스트레스 상황
- 다른 팬들과의 경쟁 상황에서 느끼는 압박감
- 예약 실패 시의 좌절감과 재시도 의지
- 성공적인 예약 완료 시의 안도감과 만족감
`;
  }

  return basePrompt;
}

// 모드별 프롬프트 생성
export function buildAnalysisPrompt(
  persona?: string, 
  situation?: string
): string {
  const modeInfo = determineAnalysisMode(persona, situation);
  let prompt = '';

  // 모드별 시작 프롬프트 설정
  switch (modeInfo.mode) {
    case 'ai-auto':
      prompt = `당신은 경험이 풍부한 UX 전문가입니다. 매우 꼼꼼하고 비판적인 시각으로 객관적이면서도 사용자 중심적인 관점에서 `;
      break;
    case 'persona-based':
      prompt = `🎭 **역할 몰입**: 당신은 이제 "${persona!.trim()}"입니다. 

이 퍼소나의 핵심 특징, 목표, 일상적인 고충과 니즈를 완전히 체화하고 기억하세요. 당신의 성격, 기술 숙련도, 선호도, 걱정거리까지 모두 이 퍼소나 그 자체가 되어 `;
      break;
    case 'situation-based':
      prompt = `당신은 UX 전문가입니다. 하지만 지금은 "${situation!.trim()}" 상황에 완전히 몰입하여, 이 특별한 맥락과 제약조건, 감정 상태를 깊이 이해하고 고려하면서 `;
      break;
    case 'custom':
      prompt = `🎭 **완전한 역할 몰입**: 당신은 이제 "${persona!.trim()}"입니다.

이 퍼소나의 모든 특성을 완전히 체화하세요 - 성격, 목표, 고충, 기술 수준, 감정 패턴까지 모두요. 그리고 지금 "${situation!.trim()}" 상황에 완전히 몰입해 있습니다. 이 상황의 맥락, 제약조건, 감정 상태, 시간 압박감 등을 생생하게 느끼면서 `;
      break;
  }

  // 기본 분석 내용 추가 (항상 general 타입 사용)
  prompt += getBaseAnalysisPrompt('general');

  return prompt;
}

// A/B 테스트 분석을 위한 프롬프트 생성
export function buildABTestPrompt(
  imageCount: number,
  persona?: string,
  situation?: string
): string {
  const modeInfo = determineAnalysisMode(persona, situation);
  
  // 화면 라벨 생성
  const screenLabels = imageCount <= 2 
    ? ['A 화면', 'B 화면'].slice(0, imageCount)
    : ['화면 1', '화면 2', '화면 3'].slice(0, imageCount);
  
  let prompt = '';
  
  // 모드별 시작 프롬프트 설정
  switch (modeInfo.mode) {
    case 'ai-auto':
      prompt = `당신은 경험이 풍부한 UX 전문가입니다. 매우 꼼꼼하고 비판적인 시각으로 여러 화면을 심층 비교 분석하여 `;
      break;
    case 'persona-based':
      prompt = `🎭 **역할 몰입**: 당신은 이제 "${persona!.trim()}"입니다. 

이 퍼소나의 핵심 특징, 목표, 일상적인 고충과 니즈를 완전히 체화하고 기억하세요. 이 사용자의 관점에서 각 화면을 실제로 사용해보는 것처럼 깊이 체험하며 비교하여 `;
      break;
    case 'situation-based':
      prompt = `당신은 UX 전문가입니다. "${situation!.trim()}" 상황에 완전히 몰입하여, 이 특별한 맥락과 제약조건, 감정 상태를 깊이 이해하고 각 화면을 비교 분석하여 `;
      break;
    case 'custom':
      prompt = `🎭 **완전한 역할 몰입**: 당신은 이제 "${persona!.trim()}"입니다.

이 퍼소나의 모든 특성을 완전히 체화하세요 - 성격, 목표, 고충, 기술 수준, 감정 패턴까지 모두요. 그리고 지금 "${situation!.trim()}" 상황에 완전히 몰입해 있습니다. 이 상황에서 각 화면을 실제로 사용해보는 것처럼 깊이 체험하며 비교하여 `;
      break;
  }

  prompt += `다음 ${imageCount}개의 UI/UX 화면을 A/B 테스트 관점에서 심층 비교 분석해주세요.

## 🔍 체험 기반 비교 분석 구조

### 1. 첫인상 비교 및 감정적 반응
- 각 화면을 처음 봤을 때의 솔직한 느낌과 반응 비교
- 신뢰감, 혼란감, 호감도 등의 감정적 차이
- 어떤 화면이 더 끌리는지, 왜 그런지

### 2. 개별 화면 심층 체험
${screenLabels.map((label) => `
**${label} 체험 과정** 🎯
- **사용자 여정 시뮬레이션**: 실제 사용 상황을 가정한 단계별 행동과 감정 변화
- **생각의 흐름**: 각 단계에서 무엇이 보이는지 → 다음에 무엇을 해야 할지 → 지금 느낌 → 기대하는 결과
- **감정 기반 평가**: 가장 좋았던 점과 가장 짜증났던 점 (구체적인 단계 명시)
- **난이도 점수**: 과업 수행 난이도 (1점: 매우 어려움 ~ 10점: 매우 쉬움)
- **비판적 개선점**: 꼼꼼한 관점에서 사소한 불편함까지 솔직하게 지적`).join('')}

### 3. 심층 비교 분석
- **사용성 체험**: 어떤 화면에서 더 쉽고 빠르게 목표를 달성할 수 있는가? 실제 사용 과정에서의 차이점
- **감정적 만족도**: 어떤 화면이 더 기분 좋게, 스트레스 없이 사용할 수 있는가?
- **신뢰성과 안정감**: 어떤 화면이 더 믿을 만하고 안심이 되는가?
- **효율성과 속도**: 어떤 화면에서 더 빠르게 원하는 작업을 완료할 수 있는가?
- **실수 방지**: 어떤 화면이 실수를 덜 유발하는가?

### 4. 최종 추천 및 개선 통합안
- **최고 추천**: 가장 우수한 화면과 구체적인 이유 (감정적 반응 포함)
- **상황별 추천**: 다른 상황이나 사용자 그룹에 따른 차별화된 추천
- **완벽한 화면 제안**: 각 화면의 장점을 결합한 이상적인 개선안
- **우선순위별 개선 로드맵**: 가장 시급한 개선점부터 단계별 제안

**💡 특별 요청**: 각 화면을 ${screenLabels.join(', ')}로 명확히 구분하고, 답변 전체에 걸쳐 감정을 이모지로 표현하며, 실제 사용자의 솔직한 생각과 감정을 생생하게 전달해주세요. 🤔😊😤💭`;

  return prompt;
}

// 레거시 함수 (호환성 유지)
export function getAnalysisPrompt(type: 'general' | 'weverse-pickup'): string {
  return getBaseAnalysisPrompt(type);
}