/**
 * 동적 분석자 이름 생성 유틸리티
 */

/**
 * 퍼소나 기반으로 분석자 이름을 생성합니다.
 * @param persona - 퍼소나 문자열 (선택사항)
 * @returns 분석자 이름
 */
export const getAnalyzerName = (persona?: string): string => {
  if (persona && persona.trim()) {
    return persona.trim();
  }
  return "AI";
};

/**
 * 분석 중 메시지를 생성합니다.
 * @param persona - 퍼소나 문자열 (선택사항)
 * @returns 분석 중 메시지
 */
export const getAnalyzingMessage = (persona?: string): string => {
  const analyzerName = getAnalyzerName(persona);
  return `${analyzerName}가 분석 중입니다...`;
};

/**
 * 분석 결과 제목을 생성합니다.
 * @param persona - 퍼소나 문자열 (선택사항)
 * @returns 분석 결과 제목
 */
export const getAnalysisTitle = (persona?: string): string => {
  const analyzerName = getAnalyzerName(persona);
  return `${analyzerName}의 UX 분석`;
};

/**
 * 분석 시작 버튼 텍스트를 생성합니다.
 * @param persona - 퍼소나 문자열 (선택사항)
 * @returns 분석 시작 버튼 텍스트
 */
export const getStartAnalysisText = (persona?: string): string => {
  const analyzerName = getAnalyzerName(persona);
  return `🤖 ${analyzerName} 분석 시작`;
};

/**
 * 간단한 분석 중 메시지를 생성합니다.
 * @param persona - 퍼소나 문자열 (선택사항)
 * @returns 간단한 분석 중 메시지
 */
export const getSimpleAnalyzingMessage = (persona?: string): string => {
  const analyzerName = getAnalyzerName(persona);
  return `${analyzerName}가 분석 중...`;
};

/**
 * 앱 설명을 생성합니다.
 * @param persona - 퍼소나 문자열 (선택사항)
 * @returns 앱 설명
 */
export const getAppDescription = (persona?: string): string => {
  if (persona && persona.trim()) {
    return `${persona.trim()} 페르소나로 UX 이미지를 분석하는 도구`;
  }
  return "AI 기반 UX 이미지 분석 도구";
};

/**
 * 분석 타입별 설명을 생성합니다.
 * @param persona - 퍼소나 문자열 (선택사항)
 * @returns 분석 타입 설명
 */
export const getAnalysisTypeDescription = (persona?: string): string => {
  const analyzerName = getAnalyzerName(persona);
  return `${analyzerName}의 관점에서 전반적인 사용자 경험을 분석합니다.`;
};