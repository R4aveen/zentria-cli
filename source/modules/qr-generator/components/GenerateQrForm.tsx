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
  const { columns } = useTerminalSize();
  const layoutMode = columns >= 165 ? 3 : columns >= 120 ? 2 : 1;

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

      <Box flexDirection={layoutMode === 1 ? 'column' : 'row'}>
        <Box
          flexDirection="column"
          width={layoutMode === 1 ? '100%' : layoutMode === 2 ? '50%' : '34%'}
          paddingRight={layoutMode > 1 ? 1 : 0}
        >
          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'qrType'} text="Tipo de QR" />
            <DisplayField active={focus === 'qrType'} value={qrTypeLabel} helper="[←/→]" />
          </Box>

          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'primaryData'} text={primaryLabel} />
            <InputField
              active={focus === 'primaryData'}
              value={primaryData}
              onChange={onPrimaryDataChange}
              placeholder="Ingresa el dato principal"
            />
          </Box>

          {showSecondary && (
            <Box marginBottom={1} flexDirection="column">
              <FieldLabel active={focus === 'secondaryData'} text={secondaryLabel} />
              <InputField
                active={focus === 'secondaryData'}
                value={secondaryData}
                onChange={onSecondaryDataChange}
                placeholder="Dato secundario"
              />
            </Box>
          )}

          {showWifiSecurity && (
            <Box marginBottom={1} flexDirection="column">
              <FieldLabel active={focus === 'wifiSecurity'} text="Seguridad WiFi" />
              <DisplayField active={focus === 'wifiSecurity'} value={wifiSecurity} helper="[←/→]" />
            </Box>
          )}

          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'fileName'} text="Nombre del archivo" />
            <InputField
              active={focus === 'fileName'}
              value={fileName}
              onChange={onFileNameChange}
              placeholder="Ej: qr_clientes"
            />
          </Box>

          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'logo'} text="Logo opcional" />
            <DisplayField
              active={focus === 'logo'}
              value={logoPath || 'Sin logo seleccionado'}
              helper="[F]"
            />
          </Box>

          <Box marginBottom={1} flexDirection="column">
            <FieldLabel active={focus === 'advancedToggle'} text="Personalizacion (opcional)" />
            <DisplayField
              active={focus === 'advancedToggle'}
              value={showAdvancedCustomization ? 'Mostrando opciones avanzadas' : 'Oculto (modo rapido)'}
              helper="[ENTER/ESPACIO]"
            />
          </Box>
        </Box>

        {showAdvancedCustomization && (
          <>
            <Box
              flexDirection="column"
              width={layoutMode === 1 ? '100%' : layoutMode === 2 ? '50%' : '33%'}
              paddingX={layoutMode === 3 ? 1 : 0}
            >
              <Box marginBottom={1} flexDirection="column">
                <FieldLabel active={focus === 'colorPreset'} text="Preset de color" />
                <DisplayField active={focus === 'colorPreset'} value={colorPresetName} helper="[A/D]" />
              </Box>

              <Box marginBottom={1} flexDirection="column">
                <FieldLabel active={focus === 'darkColor'} text="Color oscuro (#RRGGBB)" />
                <InputField
                  active={focus === 'darkColor'}
                  value={darkColor}
                  onChange={onDarkColorChange}
                  placeholder="#000000"
                />
              </Box>

              <Box marginBottom={1} flexDirection="column">
                <FieldLabel active={focus === 'lightColor'} text="Color claro (#RRGGBB)" />
                <InputField
                  active={focus === 'lightColor'}
                  value={lightColor}
                  onChange={onLightColorChange}
                  placeholder="#FFFFFF"
                />
              </Box>
            </Box>

            <Box
              flexDirection="column"
              width={layoutMode === 1 ? '100%' : layoutMode === 2 ? '100%' : '33%'}
              paddingLeft={layoutMode === 3 ? 1 : 0}
            >
              <Box flexDirection={layoutMode === 2 ? 'row' : 'column'}>
                <Box
                  marginBottom={1}
                  flexDirection="column"
                  width={layoutMode === 2 ? '50%' : '100%'}
                  paddingRight={layoutMode === 2 ? 1 : 0}
                >
                  <FieldLabel active={focus === 'size'} text="Dimension (px)" />
                  <InputField active={focus === 'size'} value={size} onChange={onSizeChange} placeholder="900" />
                </Box>
                <Box
                  marginBottom={1}
                  flexDirection="column"
                  width={layoutMode === 2 ? '50%' : '100%'}
                  paddingLeft={layoutMode === 2 ? 1 : 0}
                >
                  <FieldLabel active={focus === 'margin'} text="Margen" />
                  <InputField active={focus === 'margin'} value={margin} onChange={onMarginChange} placeholder="1" />
                </Box>
              </Box>

              <Box marginBottom={1} flexDirection="column">
                <FieldLabel active={focus === 'errorLevel'} text="Correccion de error" />
                <DisplayField active={focus === 'errorLevel'} value={errorLevel} helper="[←/→]" />
              </Box>

              <Box marginBottom={1} flexDirection="column">
                <FieldLabel active={focus === 'logoScale'} text="Escala logo (%)" />
                <InputField
                  active={focus === 'logoScale'}
                  value={logoScalePercent}
                  onChange={onLogoScalePercentChange}
                  placeholder="22"
                />
              </Box>

              <Box marginBottom={1} flexDirection="column">
                <FieldLabel active={focus === 'logoBgColor'} text="Fondo logo (#RRGGBB)" />
                <InputField
                  active={focus === 'logoBgColor'}
                  value={logoBgColor}
                  onChange={onLogoBgColorChange}
                  placeholder="#FFFFFF"
                />
              </Box>

              <Box marginBottom={1} flexDirection="column">
                <FieldLabel active={focus === 'logoBgTransparent'} text="Fondo logo transparente" />
                <DisplayField
                  active={focus === 'logoBgTransparent'}
                  value={logoBgTransparent ? 'Activado' : 'Desactivado'}
                  helper="[ESPACIO]"
                />
              </Box>
            </Box>
          </>
        )}
      </Box>

      {!showAdvancedCustomization && (
        <Box marginBottom={1} borderStyle="single" borderColor={theme.border} paddingX={1}>
          <Text color={theme.textDim}>
            Personalizacion avanzada desactivada. Se usaran valores por defecto optimizados.
          </Text>
        </Box>
      )}

      <Box
        borderStyle={focus === 'submit' ? 'bold' : 'single'}
        borderColor={focus === 'submit' ? theme.success : theme.border}
        paddingX={1}
        justifyContent="center"
      >
        <Text bold color={focus === 'submit' ? theme.success : theme.text}>
          {isLoading ? 'Generando QR...' : '[ENTER] Generar QR'}
        </Text>
      </Box>

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
