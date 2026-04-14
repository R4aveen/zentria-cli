import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useTheme } from '../../../contexts/ThemeContext.js';
import { useTerminalSize } from '../../../hooks/useTerminalSize.js';
import { QrFormFocus } from '../types.js';

interface GenerateQrFormProps {
  qrTypeLabel: string;
  primaryLabel: string;
  secondaryLabel: string;
  focusOrder: QrFormFocus[];
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

export const GenerateQrForm: React.FC<GenerateQrFormProps> = ({
  qrTypeLabel,
  primaryLabel,
  secondaryLabel,
  focusOrder,
  showSecondary,
  showWifiSecurity,
  showAdvancedCustomization,
  focusedFieldLabel,
  primaryData,
  secondaryData,
  wifiSecurity,
  fileName,
  logoPath,
  colorPresetName,
  darkColor,
  lightColor,
  size,
  margin,
  errorLevel,
  logoScalePercent,
  logoBgColor,
  logoBgTransparent,
  focus,
  isLoading,
  error,
  onPrimaryDataChange,
  onSecondaryDataChange,
  onFileNameChange,
  onDarkColorChange,
  onLightColorChange,
  onSizeChange,
  onMarginChange,
  onLogoScalePercentChange,
  onLogoBgColorChange,
}) => {
  const { theme } = useTheme();
  const { columns, rows } = useTerminalSize();
  const maxItemsPerColumn = rows >= 44 ? 4 : rows >= 34 ? 4 : 3;
  const minColumnWidth = rows < 28 ? 26 : 30;
  const maxColumnsByWidth = Math.max(
    1,
    Math.min(4, Math.floor((columns - 6) / minColumnWidth) || 1),
  );
  const showAdvanced = showAdvancedCustomization;

  const isFieldEnabled = (field: QrFormFocus) => {
    if (field === 'secondaryData') return showSecondary;
    if (field === 'wifiSecurity') return showWifiSecurity;
    if (
      field === 'colorPreset' ||
      field === 'darkColor' ||
      field === 'lightColor' ||
      field === 'size' ||
      field === 'margin' ||
      field === 'errorLevel' ||
      field === 'logoScale' ||
      field === 'logoBgColor' ||
      field === 'logoBgTransparent'
    ) {
      return showAdvanced;
    }

    return true;
  };

  const enabledFields = focusOrder.filter(isFieldEnabled);
  const resolvedFocusIndex = Math.max(
    0,
    enabledFields.indexOf(focus) >= 0
      ? enabledFields.indexOf(focus)
      : enabledFields.indexOf('advancedToggle') >= 0
      ? enabledFields.indexOf('advancedToggle')
      : 0,
  );
  const columnsToRender = Math.max(
    1,
    Math.min(maxColumnsByWidth, Math.ceil(enabledFields.length / maxItemsPerColumn) || 1),
  );
  const pageSize = columnsToRender * maxItemsPerColumn;
  const scrollStart = Math.max(
    0,
    Math.min(
      Math.max(0, enabledFields.length - pageSize),
      resolvedFocusIndex - Math.floor(pageSize / 2),
    ),
  );
  const visibleFields = enabledFields.slice(scrollStart, scrollStart + pageSize);
  const visibleEnd = Math.min(scrollStart + pageSize, enabledFields.length);
  const fieldColumns = Array.from({length: columnsToRender}, (_, columnIndex) =>
    visibleFields.slice(
      columnIndex * maxItemsPerColumn,
      columnIndex * maxItemsPerColumn + maxItemsPerColumn,
    ),
  );
  const gridMode = columnsToRender > 1;
  const cardWidth = gridMode ? `${Math.floor(100 / columnsToRender)}%` : '100%';
  const hasScrollAbove = scrollStart > 0;
  const hasScrollBelow = visibleEnd < enabledFields.length;

  const renderField = (field: QrFormFocus) => {
    switch (field) {
      case 'qrType':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'qrType'} text="Tipo de QR" />
            <DisplayField active={focus === 'qrType'} value={qrTypeLabel} helper="[←/→]" />
          </Box>
        );
      case 'primaryData':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'primaryData'} text={primaryLabel} />
            <InputField
              active={focus === 'primaryData'}
              value={primaryData}
              onChange={onPrimaryDataChange}
              placeholder="Ingresa el dato principal"
            />
          </Box>
        );
      case 'secondaryData':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'secondaryData'} text={secondaryLabel} />
            <InputField
              active={focus === 'secondaryData'}
              value={secondaryData}
              onChange={onSecondaryDataChange}
              placeholder="Dato secundario"
            />
          </Box>
        );
      case 'wifiSecurity':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'wifiSecurity'} text="Seguridad WiFi" />
            <DisplayField active={focus === 'wifiSecurity'} value={wifiSecurity} helper="[←/→]" />
          </Box>
        );
      case 'fileName':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'fileName'} text="Nombre del archivo" />
            <InputField
              active={focus === 'fileName'}
              value={fileName}
              onChange={onFileNameChange}
              placeholder="Ej: qr_clientes"
            />
          </Box>
        );
      case 'logo':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'logo'} text="Logo opcional" />
            <DisplayField
              active={focus === 'logo'}
              value={logoPath || 'Sin logo seleccionado'}
              helper="[F]"
            />
          </Box>
        );
      case 'advancedToggle':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'advancedToggle'} text="Personalizacion (opcional)" />
            <DisplayField
              active={focus === 'advancedToggle'}
              value={showAdvancedCustomization ? 'Mostrando opciones avanzadas' : 'Oculto (modo rapido)'}
              helper="[ENTER/ESPACIO]"
            />
          </Box>
        );
      case 'colorPreset':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'colorPreset'} text="Preset de color" />
            <DisplayField active={focus === 'colorPreset'} value={colorPresetName} helper="[A/D]" />
          </Box>
        );
      case 'darkColor':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'darkColor'} text="Color oscuro (#RRGGBB)" />
            <InputField
              active={focus === 'darkColor'}
              value={darkColor}
              onChange={onDarkColorChange}
              placeholder="#000000"
            />
          </Box>
        );
      case 'lightColor':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'lightColor'} text="Color claro (#RRGGBB)" />
            <InputField
              active={focus === 'lightColor'}
              value={lightColor}
              onChange={onLightColorChange}
              placeholder="#FFFFFF"
            />
          </Box>
        );
      case 'size':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'size'} text="Dimension (px)" />
            <InputField active={focus === 'size'} value={size} onChange={onSizeChange} placeholder="900" />
          </Box>
        );
      case 'margin':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'margin'} text="Margen" />
            <InputField active={focus === 'margin'} value={margin} onChange={onMarginChange} placeholder="1" />
          </Box>
        );
      case 'errorLevel':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'errorLevel'} text="Correccion de error" />
            <DisplayField active={focus === 'errorLevel'} value={errorLevel} helper="[←/→]" />
          </Box>
        );
      case 'logoScale':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'logoScale'} text="Escala logo (%)" />
            <InputField
              active={focus === 'logoScale'}
              value={logoScalePercent}
              onChange={onLogoScalePercentChange}
              placeholder="22"
            />
          </Box>
        );
      case 'logoBgColor':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'logoBgColor'} text="Fondo logo (#RRGGBB)" />
            <InputField
              active={focus === 'logoBgColor'}
              value={logoBgColor}
              onChange={onLogoBgColorChange}
              placeholder="#FFFFFF"
            />
          </Box>
        );
      case 'logoBgTransparent':
        return (
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'logoBgTransparent'} text="Fondo logo transparente" />
            <DisplayField
              active={focus === 'logoBgTransparent'}
              value={logoBgTransparent ? 'Activado' : 'Desactivado'}
              helper="[ESPACIO]"
            />
          </Box>
        );
      case 'submit':
        return (
          <Box
            borderStyle={focus === 'submit' ? 'bold' : 'single'}
            borderColor={focus === 'submit' ? theme.success : theme.border}
            paddingX={1}
            justifyContent="center"
            marginBottom={1}
          >
            <Text bold color={focus === 'submit' ? theme.success : theme.text}>
              {isLoading ? 'Generando QR...' : '[ENTER] Generar QR'}
            </Text>
          </Box>
        );
      default:
        return null;
    }
  };

  const focusLabels: Record<QrFormFocus, string> = {
    qrType: 'Tipo de QR',
    primaryData: primaryLabel,
    secondaryData: secondaryLabel,
    wifiSecurity: 'Seguridad WiFi',
    fileName: 'Nombre del archivo',
    advancedToggle: 'Personalizacion opcional',
    colorPreset: 'Preset de color',
    darkColor: 'Color oscuro',
    lightColor: 'Color claro',
    size: 'Dimension',
    margin: 'Margen',
    errorLevel: 'Correccion de error',
    logo: 'Logo',
    logoScale: 'Escala de logo',
    logoBgColor: 'Fondo de logo',
    logoBgTransparent: 'Fondo de logo transparente',
    submit: 'Generar QR',
  };

  const FieldLabel: React.FC<{ active: boolean; text: string }> = ({ active, text }) => (
    <Text color={active ? theme.primary : theme.text} bold={active}>
      {active ? '▶ ' : '  '}
      {text}
    </Text>
  );

  const DisplayField: React.FC<{ active: boolean; value: string; helper?: string }> = ({
    active,
    value,
    helper,
  }) => (
    <Box
      borderStyle={active ? 'bold' : 'single'}
      borderColor={active ? theme.primary : theme.border}
      paddingX={1}
      justifyContent="space-between"
    >
      <Text color={value ? theme.text : theme.textDim}>{value || '---'}</Text>
      {helper && <Text color={theme.accent}> {helper} </Text>}
    </Box>
  );

  const InputField: React.FC<{
    active: boolean;
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  }> = ({ active, value, onChange, placeholder }) => (
    <Box borderStyle={active ? 'bold' : 'single'} borderColor={active ? theme.primary : theme.border} paddingX={1}>
      <TextInput value={value} onChange={onChange} focus={active} placeholder={placeholder} />
    </Box>
  );

  return (
    <Box
      flexDirection="column"
      width={Math.min(columns - 4, 165)}
      flexGrow={1}
      borderStyle="round"
      borderColor={theme.border}
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text bold color={theme.primary}>✦ GENERA TU QR - AVANZADO</Text>
      </Box>

      <Box marginBottom={1} borderStyle="single" borderColor={theme.primary} paddingX={1}>
        <Text color={theme.text}>
          Posicion actual: <Text color={theme.primary} bold>{focusLabels[focusedFieldLabel]}</Text>
        </Text>
      </Box>

      <Box marginBottom={1} borderStyle="single" borderColor={theme.border} paddingX={1}>
        <Text color={theme.textDim}>
          {hasScrollAbove ? '↑ ' : ''}
          {columnsToRender} columna{columnsToRender > 1 ? 's' : ''} • {maxItemsPerColumn} opciones por columna •
          {hasScrollBelow ? ' ↓' : ''}
        </Text>
      </Box>

      <Box flexDirection={gridMode ? 'row' : 'column'} alignItems="flex-start" flexGrow={1}>
        {fieldColumns.map((columnFields, columnIndex) => (
          <Box
            key={`qr-col-${columnIndex}`}
            flexDirection="column"
            width={cardWidth}
            paddingRight={gridMode && columnIndex < fieldColumns.length - 1 ? 1 : 0}
          >
            {columnFields.map(field => (
              <React.Fragment key={field}>{renderField(field)}</React.Fragment>
            ))}
          </Box>
        ))}
      </Box>

      {!showAdvancedCustomization && (
        <Box marginBottom={1} borderStyle="single" borderColor={theme.border} paddingX={1}>
          <Text color={theme.textDim}>
            Personalizacion avanzada desactivada. Se usaran valores por defecto optimizados.
          </Text>
        </Box>
      )}

      {error && (
        <Box marginTop={1}>
          <Text color={theme.error}>⚠ {error}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={theme.textDim}>
          TAB/↑/↓: navegar  •  ←/→: tipo/ECC/WiFi  •  A/D: preset color  •  F: logo  •  R: mostrar/ocultar opcionales
        </Text>
      </Box>
    </Box>
  );
};
