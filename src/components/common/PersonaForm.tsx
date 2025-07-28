import React, { useState } from 'react';
import { User, Settings, Brain, Wand2, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { determineAnalysisMode } from '../../utils/promptUtils';

interface PersonaFormProps {
  persona: string;
  situation: string;
  onPersonaChange: (value: string) => void;
  onSituationChange: (value: string) => void;
  geminiApiService?: any; // GeminiApiService 인스턴스
  className?: string;
}

const PersonaForm: React.FC<PersonaFormProps> = ({
  persona,
  situation,
  onPersonaChange,
  onSituationChange,
  geminiApiService,
  className
}) => {
  const [keyword, setKeyword] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState({ message: '', progress: 0 });
  // 현재 분석 모드 가져오기
  const currentMode = determineAnalysisMode(persona, situation);

  // 키워드 기반 퍼소나 생성 핸들러
  const handleGeneratePersona = async () => {
    if (!keyword.trim()) {
      setGenerationError('키워드를 입력해 주세요.');
      return;
    }

    if (!geminiApiService) {
      setGenerationError('API 서비스가 설정되지 않았습니다.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGenerationProgress({ message: '퍼소나 생성 준비 중...', progress: 0 });

    try {
      const generatedPersona = await geminiApiService.generateWeversePersona(
        keyword,
        (message: string, progress: number) => {
          setGenerationProgress({ message, progress });
        }
      );

      // 생성된 퍼소나를 퍼소나 입력박스에 설정
      onPersonaChange(generatedPersona);
      
      // 성공 메시지 표시
      setGenerationProgress({ message: '퍼소나 생성 완료!', progress: 100 });
      
      // 키워드 초기화
      setKeyword('');
      
      // 3초 후 진행 상태 초기화
      setTimeout(() => {
        setGenerationProgress({ message: '', progress: 0 });
      }, 3000);
      
    } catch (error: any) {
      console.error('퍼소나 생성 오류:', error);
      setGenerationError(error.message || '퍼소나 생성 중 오류가 발생했습니다.');
      setGenerationProgress({ message: '', progress: 0 });
    } finally {
      setIsGenerating(false);
    }
  };

  // 키워드 입력 시 엔터 키 처리
  const handleKeywordKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isGenerating) {
      handleGeneratePersona();
    }
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="h-5 w-5 text-primary" />
          분석 설정
        </CardTitle>
        <CardDescription>
          더 정확한 분석을 위해 사용자 정보와 상황을 입력하세요. (선택사항)
          <br />
          <span className="inline-flex items-center gap-1 mt-2 text-xs">
            <Brain className="h-3 w-3" />
            {currentMode.mode === 'ai-auto' ? (
              <span className="text-blue-600">현재: AI 자동 분석 모드</span>
            ) : (
              <span className="text-purple-600">현재: 맞춤 분석 모드 활성화</span>
            )}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* 키워드 기반 퍼소나 생성 */}
        <div className="space-y-2">
          <Label htmlFor="keyword-input" className="flex items-center gap-2 text-sm font-medium">
            <Wand2 className="h-4 w-4" />
            키워드로 퍼소나 생성
          </Label>
          
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                id="keyword-input"
                placeholder="예: 신입 직장인, K-pop 팬, 대학생 등"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyPress={handleKeywordKeyPress}
                disabled={isGenerating}
                className="transition-all duration-200"
              />
            </div>
            <Button
              onClick={handleGeneratePersona}
              disabled={isGenerating || !keyword.trim()}
              size="default"
              className="flex-shrink-0"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              <span className="ml-2">
                {isGenerating ? '생성 중...' : '생성'}
              </span>
            </Button>
          </div>
          
          {/* 진행 상태 표시 */}
          {(isGenerating || generationProgress.message) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {isGenerating && <Loader2 className="h-3 w-3 animate-spin" />}
                <span>{generationProgress.message}</span>
              </div>
              {isGenerating && (
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div 
                    className="bg-primary h-1.5 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${generationProgress.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}
          
          {/* 에러 메시지 */}
          {generationError && (
            <div className="text-xs text-red-600 bg-red-50 p-2 rounded-md border border-red-200">
              {generationError}
            </div>
          )}
        </div>

        {/* 퍼소나 입력 */}
        <div className="space-y-2">
          <Label htmlFor="persona" className="flex items-center gap-2 text-sm font-medium">
            <User className="h-4 w-4" />
            사용자 퍼소나
          </Label>
          <Textarea
            id="persona"
            placeholder="예: UX 디자이너, 일반 사용자, 시니어 등"
            value={persona}
            onChange={(e) => onPersonaChange(e.target.value)}
            className="transition-all duration-200 resize-none"
            rows={3}
          />
        </div>

        {/* 상황 입력 */}
        <div className="space-y-2">
          <Label htmlFor="situation" className="flex items-center gap-2 text-sm font-medium">
            <Settings className="h-4 w-4" />
            사용 상황
          </Label>
          <Textarea
            id="situation"
            placeholder="예: 급한 상황, 첫 방문, 비교 검토 중 등"
            value={situation}
            onChange={(e) => onSituationChange(e.target.value)}
            className="transition-all duration-200 resize-none"
            rows={3}
          />
        </div>

        {/* 분석 모드 안내 */}
        <div className="rounded-lg bg-muted/50 p-3">
          {currentMode.mode === 'ai-auto' ? (
            <div className="flex items-start gap-2">
              <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-blue-700 mb-1">AI 자동 분석 모드</p>
                <p className="text-xs text-muted-foreground">
                  AI가 UX 전문가 관점에서 객관적이고 포괄적인 분석을 제공합니다.
                  퍼소나나 상황을 입력하면 더 맞춤형 분석을 받을 수 있습니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2">
              <User className="h-4 w-4 text-purple-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-purple-700 mb-1">맞춤 분석 모드</p>
                <p className="text-xs text-muted-foreground">
                  입력하신 정보를 바탕으로 특화된 관점에서 분석을 제공합니다.
                  {persona && situation ? ' (퍼소나 + 상황)' : persona ? ' (퍼소나 기반)' : ' (상황 기반)'}
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// React.memo로 컴포넌트 최적화
export default React.memo(PersonaForm);