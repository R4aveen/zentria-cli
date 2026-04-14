import React, { useState } from 'react';
import { Box, useInput } from 'ink';
import { GenerateQrForm, GenerateQrResult } from './components/index.js';
import { pickLogoFileNative } from './services/native-file-picker.service.js';
import { generateQrImage } from './services/qr-generator.service.js';
import {
  DEFAULT_QR_OPTIONS,
  GenerateQrResult as ResultType,
  QR_COLOR_PRESETS,
  QrContentType,
  QrFormFocus,
} from './types.js';

interface GenerateQrModuleProps {
  isActive?: boolean;
  onExit: () => void;
}

const ERROR_LEVELS: Array<'L' | 'M' | 'Q' | 'H'> = ['L', 'M', 'Q', 'H'];
const QR_TYPES: QrContentType[] = ['text', 'url', 'email', 'phone', 'sms', 'wifi'];
const WIFI_SECURITY_LEVELS: Array<'WPA' | 'WEP' | 'nopass'> = [
  'WPA',
  'WEP',
  'nopass',
];

const QR_TYPE_LABELS: Record<QrContentType, string> = {
  text: 'Texto libre',
  url: 'URL/Web',
  email: 'Email',
  phone: 'Telefono',
  sms: 'SMS',
  wifi: 'WiFi',
};

const buildFocusOrder = (
  showSecondary: boolean,
  showWifiSecurity: boolean,
  showAdvancedCustomization: boolean,
): QrFormFocus[] => {
  const order: QrFormFocus[] = [
    'qrType',
    'primaryData',
    'fileName',
    'logo',
    'advancedToggle',
  ];

  if (showSecondary) {
    order.splice(2, 0, 'secondaryData');
  }

  if (showWifiSecurity) {
    order.splice(showSecondary ? 3 : 2, 0, 'wifiSecurity');
  }

  if (showAdvancedCustomization) {
    order.push(
      'colorPreset',
      'darkColor',
      'lightColor',
      'size',
      'margin',
      'errorLevel',
      'logoScale',
      'logoBgColor',
      'logoBgTransparent',
    );
  }

  order.push('submit');
  return order;
};

const nextFocus = (focusOrder: QrFormFocus[], focus: QrFormFocus): QrFormFocus => {
  const currentIndex = focusOrder.indexOf(focus);
  const nextIndex = currentIndex >= focusOrder.length - 1 ? 0 : currentIndex + 1;
  return focusOrder[nextIndex]!;
};

const prevFocus = (focusOrder: QrFormFocus[], focus: QrFormFocus): QrFormFocus => {
  const currentIndex = focusOrder.indexOf(focus);
  const prevIndex = currentIndex <= 0 ? focusOrder.length - 1 : currentIndex - 1;
  return focusOrder[prevIndex]!;
};

const nextInArray = <T,>(items: T[], current: T): T => {
  const index = items.indexOf(current);
  const nextIndex = index >= items.length - 1 ? 0 : index + 1;
  return items[nextIndex]!;
};

const prevInArray = <T,>(items: T[], current: T): T => {
  const index = items.indexOf(current);
  const prevIndex = index <= 0 ? items.length - 1 : index - 1;
  return items[prevIndex]!;
};

const parsePositiveInt = (value: string, fallback: number) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const parseLogoScale = (value: string) => {
  const parsed = Number.parseFloat(value.replace(',', '.'));
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return DEFAULT_QR_OPTIONS.logoScale;
  }

  return parsed > 1 ? parsed / 100 : parsed;
};

const formatPrimaryLabel = (qrType: QrContentType) => {
  switch (qrType) {
    case 'url':
      return 'URL';
    case 'email':
      return 'Correo destino';
    case 'phone':
      return 'Numero de telefono';
    case 'sms':
      return 'Numero de SMS';
    case 'wifi':
      return 'SSID (nombre de red)';
    default:
      return 'Texto principal';
  }
};

const formatSecondaryLabel = (qrType: QrContentType) => {
  if (qrType === 'sms') return 'Mensaje SMS';
  if (qrType === 'wifi') return 'Password WiFi';
  return 'Dato secundario';
};

const buildQrContent = (
  qrType: QrContentType,
  primaryData: string,
  secondaryData: string,
  wifiSecurity: 'WPA' | 'WEP' | 'nopass',
): string => {
  const primary = primaryData.trim();
  const secondary = secondaryData.trim();

  switch (qrType) {
    case 'url':
      return /^https?:\/\//i.test(primary) ? primary : `https://${primary}`;
    case 'email':
      return `mailto:${primary}`;
    case 'phone':
      return `tel:${primary}`;
    case 'sms':
      return `SMSTO:${primary}:${secondary}`;
    case 'wifi': {
      const passwordPart = wifiSecurity === 'nopass' ? '' : `P:${secondary};`;
      return `WIFI:T:${wifiSecurity};S:${primary};${passwordPart}H:false;;`;
    }
    default:
      return primary;
  }
};

export const GenerateQrModule: React.FC<GenerateQrModuleProps> = ({
  isActive = true,
  onExit,
}) => {
  const [qrType, setQrType] = useState<QrContentType>('text');
  const [primaryData, setPrimaryData] = useState('');
  const [secondaryData, setSecondaryData] = useState('');
  const [wifiSecurity, setWifiSecurity] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [fileName, setFileName] = useState('qr_zentria');
  const [logoPath, setLogoPath] = useState('');
  const [showAdvancedCustomization, setShowAdvancedCustomization] = useState(false);
  const [colorPresetIndex, setColorPresetIndex] = useState(0);
  const [darkColor, setDarkColor] = useState(DEFAULT_QR_OPTIONS.darkColor);
  const [lightColor, setLightColor] = useState(DEFAULT_QR_OPTIONS.lightColor);
  const [size, setSize] = useState(String(DEFAULT_QR_OPTIONS.size));
  const [margin, setMargin] = useState(String(DEFAULT_QR_OPTIONS.margin));
  const [errorLevel, setErrorLevel] = useState<'L' | 'M' | 'Q' | 'H'>(
    DEFAULT_QR_OPTIONS.errorCorrectionLevel,
  );
  const [logoScalePercent, setLogoScalePercent] = useState(
    String(Math.round(DEFAULT_QR_OPTIONS.logoScale * 100)),
  );
  const [logoBgColor, setLogoBgColor] = useState(
    DEFAULT_QR_OPTIONS.logoBackgroundColor,
  );
  const [logoBgTransparent, setLogoBgTransparent] = useState(
    DEFAULT_QR_OPTIONS.logoBackgroundTransparent,
  );
  const [focus, setFocus] = useState<QrFormFocus>('qrType');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<ResultType | undefined>();
  const showSecondary = qrType === 'sms' || qrType === 'wifi';
  const showWifiSecurity = qrType === 'wifi';
  const focusOrder = buildFocusOrder(
    showSecondary,
    showWifiSecurity,
    showAdvancedCustomization,
  );

  const applyColorPreset = (index: number) => {
    const normalized =
      index < 0
        ? QR_COLOR_PRESETS.length - 1
        : index >= QR_COLOR_PRESETS.length
        ? 0
        : index;
    const preset = QR_COLOR_PRESETS[normalized]!;

    setColorPresetIndex(normalized);
    setDarkColor(preset.darkColor);
    setLightColor(preset.lightColor);
    setLogoBgColor(preset.logoBackgroundColor);
  };

  const handlePickLogo = () => {
    if (isLoading) return;

    const selected = pickLogoFileNative();
    if (selected) {
      setLogoPath(selected);
      setError('');
    }
  };

  const handleGenerate = async () => {
    if (isLoading) return;
    if (!primaryData.trim()) {
      setError(`Debes ingresar ${formatPrimaryLabel(qrType).toLowerCase()}.`);
      return;
    }
    if (qrType === 'sms' && !secondaryData.trim()) {
      setError('Debes ingresar el mensaje para el QR de SMS.');
      return;
    }
    if (qrType === 'wifi' && wifiSecurity !== 'nopass' && !secondaryData.trim()) {
      setError('Debes ingresar la contraseña de la red WiFi.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const qrContent = buildQrContent(
        qrType,
        primaryData,
        secondaryData,
        wifiSecurity,
      );

      const generated = await generateQrImage({
        qrType,
        content: qrContent,
        fileName: fileName.trim() || 'qr_zentria',
        logoPath: logoPath.trim() || undefined,
        options: {
          size: parsePositiveInt(size, DEFAULT_QR_OPTIONS.size),
          margin: parsePositiveInt(margin, DEFAULT_QR_OPTIONS.margin),
          darkColor,
          lightColor,
          errorCorrectionLevel: errorLevel,
          logoScale: parseLogoScale(logoScalePercent),
          logoBackgroundColor: logoBgColor,
          logoBackgroundTransparent: logoBgTransparent,
        },
      });
      setResult(generated);
    } catch (generationError: any) {
      setError(generationError?.message || 'No se pudo generar el QR.');
    } finally {
      setIsLoading(false);
    }
  };

  useInput((input, key) => {
    if (!isActive) return;

    if (key.escape) {
      if (isLoading) return;
      onExit();
      return;
    }

    if (result) {
      if (key.return) {
        setResult(undefined);
        setQrType('text');
        setPrimaryData('');
        setSecondaryData('');
        setWifiSecurity('WPA');
        setFileName('qr_zentria');
        setLogoPath('');
        setShowAdvancedCustomization(false);
        setColorPresetIndex(0);
        setDarkColor(DEFAULT_QR_OPTIONS.darkColor);
        setLightColor(DEFAULT_QR_OPTIONS.lightColor);
        setSize(String(DEFAULT_QR_OPTIONS.size));
        setMargin(String(DEFAULT_QR_OPTIONS.margin));
        setErrorLevel(DEFAULT_QR_OPTIONS.errorCorrectionLevel);
        setLogoScalePercent(String(Math.round(DEFAULT_QR_OPTIONS.logoScale * 100)));
        setLogoBgColor(DEFAULT_QR_OPTIONS.logoBackgroundColor);
        setLogoBgTransparent(DEFAULT_QR_OPTIONS.logoBackgroundTransparent);
        setError('');
        setFocus('qrType');
      }
      return;
    }

    if (focus === 'qrType' && key.leftArrow) {
      setQrType(current => prevInArray(QR_TYPES, current));
      return;
    }

    if (focus === 'qrType' && key.rightArrow) {
      setQrType(current => nextInArray(QR_TYPES, current));
      return;
    }

    if (focus === 'errorLevel' && key.leftArrow) {
      setErrorLevel(current => prevInArray(ERROR_LEVELS, current));
      return;
    }

    if (focus === 'errorLevel' && key.rightArrow) {
      setErrorLevel(current => nextInArray(ERROR_LEVELS, current));
      return;
    }

    if (focus === 'wifiSecurity' && key.leftArrow) {
      setWifiSecurity(current => prevInArray(WIFI_SECURITY_LEVELS, current));
      return;
    }

    if (focus === 'wifiSecurity' && key.rightArrow) {
      setWifiSecurity(current => nextInArray(WIFI_SECURITY_LEVELS, current));
      return;
    }

    if (focus === 'logoBgTransparent' && input === ' ') {
      setLogoBgTransparent(current => !current);
      return;
    }

    if ((focus === 'advancedToggle' && input === ' ') || input.toLowerCase() === 'r') {
      setShowAdvancedCustomization(current => !current);
      return;
    }

    if (key.tab || key.downArrow) {
      setFocus(current => nextFocus(focusOrder, current));
      return;
    }

    if (key.upArrow) {
      setFocus(current => prevFocus(focusOrder, current));
      return;
    }

    if (focus === 'qrType' && key.return) {
      setQrType(current => nextInArray(QR_TYPES, current));
      return;
    }

    if (focus === 'errorLevel' && key.return) {
      setErrorLevel(current => nextInArray(ERROR_LEVELS, current));
      return;
    }

    if (focus === 'wifiSecurity' && key.return) {
      setWifiSecurity(current => nextInArray(WIFI_SECURITY_LEVELS, current));
      return;
    }

    if (focus === 'logoBgTransparent' && key.return) {
      setLogoBgTransparent(current => !current);
      return;
    }

    if (focus === 'advancedToggle' && key.return) {
      setShowAdvancedCustomization(current => !current);
      return;
    }

    if (input.toLowerCase() === 'a' && focus === 'colorPreset') {
      applyColorPreset(colorPresetIndex - 1);
      return;
    }

    if (input.toLowerCase() === 'd' && focus === 'colorPreset') {
      applyColorPreset(colorPresetIndex + 1);
      return;
    }

    if (input.toLowerCase() === 'f' || (focus === 'logo' && key.return)) {
      handlePickLogo();
      return;
    }

    if (input.toLowerCase() === 'g' || (focus === 'submit' && key.return)) {
      void handleGenerate();
    }
  });

  return (
    <Box
      width="100%"
      justifyContent={result ? 'center' : 'flex-start'}
      alignItems={result ? 'center' : 'stretch'}
      flexGrow={1}
    >
      {result ? (
        <GenerateQrResult result={result} />
      ) : (
        <GenerateQrForm
          qrTypeLabel={QR_TYPE_LABELS[qrType]}
          primaryLabel={formatPrimaryLabel(qrType)}
          secondaryLabel={formatSecondaryLabel(qrType)}
          focusOrder={focusOrder}
          showSecondary={showSecondary}
          showWifiSecurity={showWifiSecurity}
          showAdvancedCustomization={showAdvancedCustomization}
          focusedFieldLabel={focus}
          primaryData={primaryData}
          secondaryData={secondaryData}
          wifiSecurity={wifiSecurity}
          fileName={fileName}
          logoPath={logoPath}
          colorPresetName={QR_COLOR_PRESETS[colorPresetIndex]!.name}
          darkColor={darkColor}
          lightColor={lightColor}
          size={size}
          margin={margin}
          errorLevel={errorLevel}
          logoScalePercent={logoScalePercent}
          logoBgColor={logoBgColor}
          logoBgTransparent={logoBgTransparent}
          focus={focus}
          isLoading={isLoading}
          error={error}
          onPrimaryDataChange={setPrimaryData}
          onSecondaryDataChange={setSecondaryData}
          onFileNameChange={setFileName}
          onDarkColorChange={setDarkColor}
          onLightColorChange={setLightColor}
          onSizeChange={setSize}
          onMarginChange={setMargin}
          onLogoScalePercentChange={setLogoScalePercent}
          onLogoBgColorChange={setLogoBgColor}
        />
      )}
    </Box>
  );
};
