import React, { useCallback, useState, useRef, useEffect, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { X, Move, Images, Loader2 } from 'lucide-react';
import { sanitizeFileName, validateInput } from '../../utils/security';
import { UploadedImage } from '../../types/analysis';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import './ImageUpload.css';

interface ImageUploadProps {
  onMultipleImageUpload: (images: UploadedImage[]) => void; // 다중 이미지 업로드
  uploadedImages: UploadedImage[]; // 다중 이미지 배열
  isAnalyzing: boolean;
  maxImages?: number; // 최대 이미지 수 (기본값: 3)
  enableMultiple: boolean; // 다중 이미지 모드 활성화
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  onMultipleImageUpload,
  uploadedImages,
  isAnalyzing,
  maxImages = 3,
  enableMultiple
}) => {
  const [dragError, setDragError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>(uploadedImages);
  const [draggedImageId, setDraggedImageId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 업로드된 이미지 상태를 부모 컴포넌트와 동기화
  useEffect(() => {
    setImages(uploadedImages);
  }, [uploadedImages]);

  // 허용된 파일 타입 (메모화)
  const allowedTypes = useMemo(() => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'], []);
  
  // 파일 크기 제한 (메모화)
  const maxFileSize = useMemo(() => 10 * 1024 * 1024, []); // 10MB
  const minFileSize = useMemo(() => 1024, []); // 1KB

  // 파일 검증 로직 (메모화)
  const validateFile = useCallback((file: File): string | null => {
    // 보안: 파일명 검증 및 정리
    const sanitizedName = sanitizeFileName(file.name);
    if (!sanitizedName || sanitizedName.length === 0) {
      return '유효하지 않은 파일명입니다.';
    }

    // 보안: 파일 타입 이중 검증
    if (!allowedTypes.includes(file.type)) {
      return '지원되지 않는 파일 형식입니다. JPG, PNG, WebP만 허용됩니다.';
    }

    // 파일 크기 제한
    if (file.size > maxFileSize) {
      return '파일 크기는 10MB 이하로 제한됩니다.';
    }

    // 최소 파일 크기 검증
    if (file.size < minFileSize) {
      return '파일이 너무 작습니다. 유효한 이미지 파일을 선택해 주세요.';
    }

    return null;
  }, [allowedTypes, maxFileSize, minFileSize]);

  // Base64 변환 유틸리티 (메모화)
  const convertToBase64 = useCallback((file: File): Promise<{ base64: string; previewUrl: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        
        // 보안: Base64 결과 검증
        if (!base64 || !base64.includes('data:image/')) {
          reject(new Error('이미지 파일 처리에 실패했습니다.'));
          return;
        }

        const base64Data = base64.split(',')[1]; // data:image/jpeg;base64, 부분 제거
        
        // Base64 데이터 크기 검증
        if (!validateInput.textLength(base64Data, 100, 15000000)) { // 약 11MB Base64 제한
          reject(new Error('이미지 데이터가 너무 크거나 작습니다.'));
          return;
        }

        const previewUrl = URL.createObjectURL(file);
        resolve({ base64: base64Data, previewUrl });
      };
      reader.onerror = () => {
        reject(new Error('파일 읽기에 실패했습니다.'));
      };
      reader.readAsDataURL(file);
    });
  }, []);

  // 드롭 핸들러
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setDragError('');
    setIsDragOver(false);

    if (rejectedFiles.length > 0) {
      setDragError('이미지 파일만 업로드할 수 있습니다. (JPG, PNG, WebP)');
      if (fileInputRef.current) {
        fileInputRef.current.focus();
      }
      return;
    }

    if (acceptedFiles.length === 0) return;

    try {
      // 다중 이미지 처리
      const remainingSlots = maxImages - images.length;
      if (remainingSlots <= 0) {
        setDragError(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다.`);
        return;
      }

      const filesToProcess = acceptedFiles.slice(0, remainingSlots);
      const newImages: UploadedImage[] = [];

      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        const validationError = validateFile(file);
        if (validationError) {
          setDragError(validationError);
          return;
        }

        try {
          const { base64, previewUrl } = await convertToBase64(file);
          const newImage: UploadedImage = {
            id: `${Date.now()}-${i}`,
            file,
            base64,
            previewUrl,
            order: images.length + i
          };
          newImages.push(newImage);
        } catch (error: any) {
          setDragError(error.message);
          return;
        }
      }

      const updatedImages = [...images, ...newImages];
      setImages(updatedImages);
      
      onMultipleImageUpload(updatedImages);
    } catch (error: any) {
      setDragError('파일 처리 중 오류가 발생했습니다.');
    }
  }, [maxImages, images, onMultipleImageUpload, convertToBase64, validateFile]);

  // 개별 이미지 제거
  const removeImage = useCallback((imageId: string) => {
    const updatedImages = images.filter(img => img.id !== imageId);
    
    // URL 객체 정리
    const imageToRemove = images.find(img => img.id === imageId);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.previewUrl);
    }
    
    setImages(updatedImages);
    
    if (onMultipleImageUpload) {
      onMultipleImageUpload(updatedImages);
    }
  }, [images, onMultipleImageUpload]);

  // 이미지 순서 변경 (드래그 앤 드롭)
  const handleDragStart = useCallback((e: React.DragEvent, imageId: string) => {
    setDraggedImageId(imageId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, targetImageId: string) => {
    e.preventDefault();
    
    if (!draggedImageId || draggedImageId === targetImageId) {
      setDraggedImageId(null);
      return;
    }

    const draggedIndex = images.findIndex(img => img.id === draggedImageId);
    const targetIndex = images.findIndex(img => img.id === targetImageId);
    
    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedImageId(null);
      return;
    }

    const newImages = [...images];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(targetIndex, 0, draggedImage);
    
    // order 재정렬
    const reorderedImages = newImages.map((img, index) => ({
      ...img,
      order: index
    }));
    
    setImages(reorderedImages);
    setDraggedImageId(null);
    
    if (onMultipleImageUpload) {
      onMultipleImageUpload(reorderedImages);
    }
  }, [draggedImageId, images, onMultipleImageUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    multiple: true,
    disabled: isAnalyzing || images.length >= maxImages,
    onDragEnter: () => setIsDragOver(true),
    onDragLeave: () => setIsDragOver(false)
  });

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (!isAnalyzing && fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  }, [isAnalyzing]);

  // 에러 메시지가 변경될 때 포커스 및 스크린 리더에게 알림
  useEffect(() => {
    if (dragError && fileInputRef.current) {
      // ARIA live region이 업데이트되어 스크린 리더가 에러를 읽어줌
      const errorElement = document.querySelector('.upload-error');
      if (errorElement) {
        errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [dragError]);
  
  // 컴포넌트 언마운트 시 URL 객체 정리
  useEffect(() => {
    return () => {
      images.forEach(img => {
        URL.revokeObjectURL(img.previewUrl);
      });
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 다중 이미지 갤러리 렌더링
  const renderImageGallery = () => {
    if (images.length === 0) return null;

    return (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Images className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">
            업로드된 이미지 ({images.length}/{maxImages})
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images
            .sort((a, b) => a.order - b.order)
            .map((image, index) => (
              <Card 
                key={image.id} 
                className={`relative overflow-hidden border-2 transition-all duration-200 hover:shadow-lg ${
                  draggedImageId === image.id ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, image.id)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, image.id)}
              >
                <CardContent className="p-0">
                  <div className="relative aspect-video">
                    <img 
                      src={image.previewUrl} 
                      alt={`업로드된 이미지 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* 이미지 라벨 */}
                    <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm font-medium">
                      {images.length <= 2 
                        ? `${['A', 'B'][index]} 화면`
                        : `화면 ${index + 1}`
                      }
                    </div>
                    
                    {/* 제거 버튼 */}
                    <Button
                      size="sm"
                      variant="destructive"
                      className="absolute top-2 right-2 h-8 w-8 p-0"
                      onClick={() => removeImage(image.id)}
                      disabled={isAnalyzing}
                      aria-label={`이미지 ${index + 1} 제거`}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    
                    {/* 드래그 핸들 */}
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white p-1 rounded cursor-move">
                      <Move className="h-4 w-4" />
                    </div>
                    
                    {/* 로딩 오버레이 */}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3">
                    <p className="text-sm text-muted-foreground truncate">
                      {image.file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(image.file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          }
        </div>
        
        {images.length > 1 && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            💡 이미지를 드래그하여 순서를 변경할 수 있습니다
          </p>
        )}
      </div>
    );
  };

  // 업로드 영역의 상태에 따른 메시지 생성 (메모화)
  const getUploadMessage = useCallback(() => {
    if (enableMultiple) {
      const remaining = maxImages - images.length;
      if (remaining === 0) {
        return '최대 업로드 수에 도달했습니다';
      }
      if (isDragActive || isDragOver) {
        return `이미지를 놓아주세요 (${remaining}개 더 가능)`;
      }
      return `이미지를 드래그하거나 클릭하여 선택 (${remaining}개 더 가능)`;
    } else {
      if (isDragActive || isDragOver) {
        return '이미지를 놓아주세요';
      }
      return '이미지를 드래그하거나 클릭하여 선택';
    }
  }, [enableMultiple, maxImages, images.length, isDragActive, isDragOver]);

  // 업로드 비활성화 상태 메모화
  const isUploadDisabled = useMemo(() => {
    return isAnalyzing || (enableMultiple && images.length >= maxImages);
  }, [isAnalyzing, enableMultiple, images.length, maxImages]);

  return (
    <div className="image-upload-container">
      {/* 다중 이미지 모드일 때 갤러리 표시 */}
      {enableMultiple && renderImageGallery()}
      
      {/* 업로드 영역 */}
      <div 
        {...getRootProps()} 
        className={`dropzone ${isDragActive || isDragOver ? 'active' : ''} ${isUploadDisabled ? 'disabled' : ''}`}
        role="button"
        tabIndex={isUploadDisabled ? -1 : 0}
        aria-label={`테스트용 이미지 파일을 업로드하려면 클릭하거나 파일을 드래그하세요 (${images.length}/${maxImages})`}
        aria-describedby={dragError ? 'upload-error' : 'upload-instructions'}
        aria-disabled={isUploadDisabled}
        onKeyDown={handleKeyDown}
      >
        <input 
          {...getInputProps()} 
          ref={fileInputRef}
          aria-label="이미지 파일 선택"
        />
        
        <div className="upload-prompt">
          <div className="upload-icon" aria-hidden="true">
            <Images className="h-12 w-12 mx-auto text-muted-foreground" />
          </div>
          <h3 id="upload-title" className="text-xl font-semibold mb-2">
            테스트용 이미지 업로드
          </h3>
          <p id="upload-instructions" aria-live="polite" className="text-muted-foreground mb-4">
            {getUploadMessage()}
          </p>
          <div className="file-info">
            <small aria-label="지원되는 파일 형식 안내" className="text-xs text-muted-foreground">
              JPG, PNG, WebP 파일 지원 (최대 10MB) • 최대 {maxImages}개까지
            </small>
          </div>
          
          {/* 업로드 안내 */}
          {images.length === 0 && (
            <div className="my-4 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-sm text-primary/80">
                💡 여러 화면을 동시에 업로드하여 테스트 분석을 받아보세요!
              </p>
            </div>
          )}
        </div>
      </div>
      
      {/* 에러 메시지 */}
      {dragError && (
        <div 
          className="upload-error" 
          id="upload-error"
          role="alert"
          aria-live="assertive"
        >
          <span aria-hidden="true">⚠️</span>
          <span>{dragError}</span>
        </div>
      )}
      
      {/* 다중 이미지 모드 도움말 */}
      {enableMultiple && images.length > 0 && (
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            📋 <strong>A/B 테스트 분석:</strong> 업로드된 {images.length}개의 화면을 비교 분석하여 
            각각의 장단점과 최적의 선택을 추천드립니다.
          </p>
        </div>
      )}
    </div>
  );
};

// React.memo로 컴포넌트 최적화
export default React.memo(ImageUpload);