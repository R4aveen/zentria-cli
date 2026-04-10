export interface GenerateQrRequest {
  content: string;
  fileName: string;
  logoPath?: string;
}

export interface GenerateQrResult {
  formattedDate: string;
  homeOutputPath: string;
  desktopOutputPath?: string;
  metadataPath: string;
}

export type QrFormFocus = 'content' | 'fileName' | 'logo' | 'submit';
