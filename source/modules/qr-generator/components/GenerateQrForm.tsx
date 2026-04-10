import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { useTheme } from '../../../contexts/ThemeContext.js';
import { QrFormFocus } from '../types.js';

interface GenerateQrFormProps {
  content: string;
  fileName: string;
  logoPath: string;
  focus: QrFormFocus;
  isLoading: boolean;
  error?: string;
  onContentChange: (value: string) => void;
  onFileNameChange: (value: string) => void;
}

export const GenerateQrForm: React.FC<GenerateQrFormProps> = ({
  content,
  fileName,
  logoPath,
  focus,
  isLoading,
  error,
  onContentChange,
  onFileNameChange,
}) => {
  const { theme } = useTheme();

  return (
    <Box flexDirection="column" width={88} borderStyle="round" borderColor={theme.border} paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color={theme.primary}>✦ GENERA TU QR</Text>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text color={focus === 'content' ? theme.primary : theme.text}>Texto del QR</Text>
        <Box borderStyle="single" borderColor={focus === 'content' ? theme.primary : theme.border} paddingX={1}>
          <TextInput
            value={content}
            onChange={onContentChange}
            focus={focus === 'content'}
            placeholder="Ej: https://ecoti.cl o código interno"
          />
        </Box>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text color={focus === 'fileName' ? theme.primary : theme.text}>Nombre del archivo</Text>
        <Box borderStyle="single" borderColor={focus === 'fileName' ? theme.primary : theme.border} paddingX={1}>
          <TextInput
            value={fileName}
            onChange={onFileNameChange}
            focus={focus === 'fileName'}
            placeholder="Ej: qr_bodega"
          />
        </Box>
      </Box>

      <Box marginBottom={1} flexDirection="column">
        <Text color={focus === 'logo' ? theme.primary : theme.text}>Logo opcional</Text>
        <Box borderStyle="single" borderColor={focus === 'logo' ? theme.primary : theme.border} paddingX={1} justifyContent="space-between">
          <Text color={logoPath ? theme.text : theme.textDim}>
            {logoPath || 'Sin logo seleccionado'}
          </Text>
          <Text color={theme.accent}> [F] Explorar </Text>
        </Box>
      </Box>

      <Box borderStyle="single" borderColor={focus === 'submit' ? theme.success : theme.border} paddingX={1} justifyContent="center">
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
        <Text color={theme.textDim}>TAB/↑/↓: navegar  •  F: explorar logo  •  ESC: volver</Text>
      </Box>
    </Box>
  );
};
