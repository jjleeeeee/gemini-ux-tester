import React, { useMemo, useCallback } from 'react';
import { Bot, Loader2, AlertCircle, Brain, User, Settings as SettingsIcon, Zap, Crown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import PersonaForm from '../common/PersonaForm';
import { cn } from '../../lib/utils';
import { determineAnalysisMode, AnalysisModeInfo } from '../../utils/promptUtils';
import { GeminiApiService } from '../../services/geminiApi';

export type AnalysisType = 'general' | 'weverse-pickup';

interface AnalysisOptionsProps {
  onAnalyze: () => void;
  hasImage: boolean;
  isAnalyzing: boolean;
  persona?: string;
  onPersonaChange?: (persona: string) => void;
  situation?: string;
  onSituationChange?: (situation: string) => void;
  geminiApiService?: GeminiApiService | null;
  selectedModel?: string;
  onModelChange?: (model: string) => void;
  currentActiveModel?: string | null;
}

const AnalysisOptions: React.FC<AnalysisOptionsProps> = ({
  onAnalyze,
  hasImage,
  isAnalyzing,
  persona = '',
  onPersonaChange,
  situation = '',
  onSituationChange,
  geminiApiService,
  selectedModel = 'gemini-2.5-flash',
  onModelChange,
  currentActiveModel
}) => {
  // 현재 분석 모드 결정 (메모화)
  const currentMode: AnalysisModeInfo = useMemo(() => {
    return determineAnalysisMode(persona, situation);
  }, [persona, situation]);

  // 모델 정보 가져오기
  const modelInfo = useMemo(() => {
    if (!geminiApiService) return null;
    return geminiApiService.getAllModelInfo();
  }, [geminiApiService]);

  // 사용 가능한 모델 목록
  const availableModels = useMemo(() => {
    if (!geminiApiService) return [];
    return geminiApiService.getAvailableModels();
  }, [geminiApiService]);

  // 분석 모드별 아이콘 매핑 (메모화)
  const getModeIcon = useCallback((mode: string) => {
    switch (mode) {
      case 'ai-auto':
        return Brain;
      case 'persona-based':
        return User;
      case 'situation-based':
        return SettingsIcon;
      case 'custom':
        return User;
      default:
        return Brain;
    }
  }, []);

  // 분석 모드별 색상 클래스 (메모화)
  const getModeColorClass = useCallback((mode: string) => {
    switch (mode) {
      case 'ai-auto':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'persona-based':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'situation-based':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'custom':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!hasImage) {
      return;
    }
    onAnalyze();
  }, [hasImage, onAnalyze]);

  // 모델 선택 핸들러
  const handleModelSelection = useCallback((model: string) => {
    if (onModelChange) {
      onModelChange(model);
    }
  }, [onModelChange]);

  // 모델별 아이콘 및 색상
  const getModelIcon = useCallback((model: string) => {
    if (model.includes('pro')) return Crown;
    if (model.includes('flash')) return Zap;
    return Bot;
  }, []);

  const getModelBadgeVariant = useCallback((model: string) => {
    if (model.includes('pro')) return 'default' as const;
    if (model.includes('flash')) return 'secondary' as const;
    return 'outline' as const;
  }, []);

  return (
    <div className="space-y-6">
      {/* Gemini 모델 선택 */}
      {modelInfo && availableModels.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bot className="h-5 w-5 text-primary" />
              Gemini 모델 선택
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* 모델 선택 드롭다운 */}
              <div>
                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                  분석 모델
                </label>
                <Select value={selectedModel} onValueChange={handleModelSelection} disabled={isAnalyzing}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="모델을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => {
                      const info = modelInfo[model];
                      const ModelIcon = getModelIcon(model);
                      return (
                        <SelectItem key={model} value={model}>
                          <div className="flex items-center gap-2 w-full">
                            <ModelIcon className="h-4 w-4" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{info?.name || model}</span>
                                <Badge variant={getModelBadgeVariant(model)} className="text-xs">
                                  {model.includes('pro') ? 'Pro' : 'Flash'}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {info?.description || '강력한 AI 모델'}
                              </p>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* 현재 사용 중인 모델 표시 */}
              {currentActiveModel && currentActiveModel !== selectedModel && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Bot className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      현재 사용 중: {modelInfo[currentActiveModel]?.name || currentActiveModel}
                    </span>
                  </div>
                  <p className="text-xs text-amber-600 mt-1">
                    선택된 모델에서 자동 전환되었습니다.
                  </p>
                </div>
              )}

              {/* 선택된 모델 정보 */}
              {selectedModel && modelInfo[selectedModel] && (
                <div className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    {(() => {
                      const ModelIcon = getModelIcon(selectedModel);
                      return <ModelIcon className="h-4 w-4 text-primary" />;
                    })()}
                    <span className="font-medium text-sm">
                      {modelInfo[selectedModel].name}
                    </span>
                    <Badge variant={getModelBadgeVariant(selectedModel)} className="text-xs">
                      {selectedModel.includes('pro') ? 'Pro' : 'Flash'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {modelInfo[selectedModel].description}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 현재 분석 모드 표시 - 아코디언 */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="p-0">
          <Accordion type="single" collapsible>
            <AccordionItem value="analysis-mode" className="border-none">
              <AccordionTrigger className="px-4 py-4 hover:no-underline">
                <div className="flex items-center gap-3 w-full">
                  {(() => {
                    const ModeIcon = getModeIcon(currentMode.mode);
                    return <ModeIcon className="h-5 w-5 text-primary" />;
                  })()}
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-foreground">
                      현재 분석 모드:
                    </span>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-xs font-medium border",
                      getModeColorClass(currentMode.mode)
                    )}>
                      {currentMode.title}
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="flex items-start gap-3 pt-2">
                  {(() => {
                    const ModeIcon = getModeIcon(currentMode.mode);
                    return <ModeIcon className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />;
                  })()}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {currentMode.description}
                    </p>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>


      {/* 퍼소나/상황 입력 폼 */}
      {onPersonaChange && onSituationChange && (
        <PersonaForm
          persona={persona}
          situation={situation}
          onPersonaChange={onPersonaChange}
          onSituationChange={onSituationChange}
          geminiApiService={geminiApiService}
        />
      )}

      {/* 분석 시작 버튼 */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Button
              onClick={handleAnalyze}
              disabled={!hasImage || isAnalyzing}
              size="lg"
              className="w-full h-12 text-base font-medium transition-all duration-200"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Bot className="h-5 w-5 mr-2" />
                  AI 분석 시작
                </>
              )}
            </Button>
            
            {!hasImage && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-muted-foreground">
                  이미지를 먼저 업로드한 후 분석을 시작할 수 있습니다.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// React.memo로 컴포넌트 최적화
export default React.memo(AnalysisOptions);