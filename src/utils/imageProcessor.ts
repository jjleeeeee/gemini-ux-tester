export const convertFileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsDataURL(file);
  });
};

export const getBase64FromDataUrl = (dataUrl: string): string => {
  return dataUrl.split(',')[1];
};

export const isValidImageFile = (file: File): boolean => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  return allowedTypes.includes(file.type);
};

export const isValidImageSize = (file: File, maxSizeMB: number = 10): boolean => {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
};

export const validateImageFile = (file: File): { isValid: boolean; error?: string } => {
  if (!isValidImageFile(file)) {
    return {
      isValid: false,
      error: '이미지 파일만 업로드할 수 있습니다. (JPG, PNG, WebP)'
    };
  }

  if (!isValidImageSize(file)) {
    return {
      isValid: false,
      error: '파일 크기는 10MB 이하로 제한됩니다.'
    };
  }

  return { isValid: true };
};