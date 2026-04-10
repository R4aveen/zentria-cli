import type React from 'react';
import type { QrFormFocus } from '../types.js';

export interface GenerateQrFormProps {
  qrTypeLabel: string;
  primaryLabel: string;
  secondaryLabel: string;
  showSecondary: boolean;
  showWifiSecurity: boolean;
  showAdvancedCustomization: boolean;
  focusedFieldLabel: QrFormFocus;
  primaryData: string;
  secondaryData: string;
  wifiSecurity: 'WPA' | 'WEP' | 'nopass';
  fileName: string;
  logoPath: string;
  colorPresetName: string;
  darkColor: string;
  lightColor: string;
  size: string;
  margin: string;
  errorLevel: 'L' | 'M' | 'Q' | 'H';
  logoScalePercent: string;
  logoBgColor: string;
  logoBgTransparent: boolean;
  focus: QrFormFocus;
  isLoading: boolean;
  error?: string;
  onPrimaryDataChange: (value: string) => void;
  onSecondaryDataChange: (value: string) => void;
  onFileNameChange: (value: string) => void;
  onDarkColorChange: (value: string) => void;
  onLightColorChange: (value: string) => void;
  onSizeChange: (value: string) => void;
  onMarginChange: (value: string) => void;
  onLogoScalePercentChange: (value: string) => void;
  onLogoBgColorChange: (value: string) => void;
}

export const GenerateQrForm: React.FC<GenerateQrFormProps>;
