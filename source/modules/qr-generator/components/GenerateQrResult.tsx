import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../../../contexts/ThemeContext.js';
import { GenerateQrResult as ResultType } from '../types.js';

interface GenerateQrResultProps {
  result: ResultType;
}

export const GenerateQrResult: React.FC<GenerateQrResultProps> = ({ result }) => {
  const { theme } = useTheme();

  return (
    <Box flexDirection="column" width={88} borderStyle="round" borderColor={theme.border} paddingX={1}>
      <Box marginBottom={1}>
        <Text bold color={theme.success}>✓ QR generado correctamente</Text>
      </Box>

      <Text color={theme.text}>Fecha: <Text color={theme.primary}>{result.formattedDate}</Text></Text>
      <Text color={theme.text}>Carpeta usuario: <Text color={theme.accent}>{result.homeOutputPath}</Text></Text>
      <Text color={theme.text}>Escritorio: <Text color={theme.accent}>{result.desktopOutputPath || 'No detectado'}</Text></Text>
      <Text color={theme.text}>Ficha metadata: <Text color={theme.accent}>{result.metadataPath}</Text></Text>

      <Box marginTop={1}>
        <Text color={theme.textDim}>ENTER: crear otro  •  ESC: volver al menú</Text>
      </Box>
    </Box>
  );
};
