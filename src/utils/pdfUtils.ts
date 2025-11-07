export const base64ToBlobUrl = (base64: string): string => {
  // Remove data URL prefix if present
  const base64Data = base64.replace(/^data:application\/pdf;base64,/, '');
  
  // Convert base64 to binary
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Create blob and return URL
  const blob = new Blob([bytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
};

export const cleanupBlobUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};
