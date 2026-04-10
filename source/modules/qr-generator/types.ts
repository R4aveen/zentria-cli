export interface GenerateQrRequest {
  content: string;
  fileName: string;
  logoPath?: string;
  qrType?: QrContentType;
  options?: QrCustomizationOptions;
}

export type QrContentType = 'text' | 'url' | 'email' | 'phone' | 'sms' | 'wifi';

export interface QrColorPreset {
  name: string;
  darkColor: string;
  lightColor: string;
  logoBackgroundColor: string;
}

export const QR_COLOR_PRESETS: QrColorPreset[] = [
  {
    name: 'Clásico B/N',
    darkColor: '#000000',
    lightColor: '#FFFFFF',
    logoBackgroundColor: '#FFFFFF',
  },
  {
    name: 'Zentria Neon',
    darkColor: '#00E1FF',
    lightColor: '#021B2A',
    logoBackgroundColor: '#021B2A',
  },
  {
    name: 'Matriz Verde',
    darkColor: '#00FF66',
    lightColor: '#04170B',
    logoBackgroundColor: '#0A2A15',
  },
  {
    name: 'Solar Alto Contraste',
    darkColor: '#111111',
    lightColor: '#FFF3C4',
    logoBackgroundColor: '#FFF3C4',
  },
];

export interface QrCustomizationOptions {
  size: number;
  margin: number;
  darkColor: string;
  lightColor: string;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  logoScale: number;
  logoBackgroundColor: string;
  logoBackgroundTransparent: boolean;
}

export const DEFAULT_QR_OPTIONS: QrCustomizationOptions = {
  size: 900,
  margin: 1,
  darkColor: '#000000',
  lightColor: '#FFFFFF',
  errorCorrectionLevel: 'H',
  logoScale: 0.22,
  logoBackgroundColor: '#FFFFFF',
  logoBackgroundTransparent: false,
};

export interface GenerateQrResult {
  formattedDate: string;
  homeOutputPath: string;
  desktopOutputPath?: string;
  metadataPath: string;
}

export type QrFormFocus =
  | 'qrType'
  | 'primaryData'
  | 'secondaryData'
  | 'wifiSecurity'
  | 'fileName'
  | 'advancedToggle'
  | 'colorPreset'
  | 'darkColor'
  | 'lightColor'
  | 'size'
  | 'margin'
  | 'errorLevel'
  | 'logo'
  | 'logoScale'
  | 'logoBgColor'
  | 'logoBgTransparent'
  | 'submit';
