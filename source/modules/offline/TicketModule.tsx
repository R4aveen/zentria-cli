import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../../contexts/ThemeContext.js';

export const OfflineTicketModule: React.FC = () => {
  const [scanBuffer, setScanBuffer] = useState('');
  const [lastScan, setLastScan] = useState<string | null>(null);
  const { theme } = useTheme();

  useInput((input, key) => {
    if (key.return) {
      if (scanBuffer.length > 0) {
        setLastScan(scanBuffer);
        setScanBuffer('');
      }
    } else if (key.backspace) {
      setScanBuffer((prev) => prev.slice(0, -1));
    } else if (input) {
      setScanBuffer((prev) => prev + input);
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color={theme.primary}>☁︎ MODO ESCÁNER OFFLINE</Text>
      <Box marginTop={1} paddingX={1}>
        <Text color="white" bold backgroundColor={theme.modeBadgeOnline}>☾ SIN CONEXIÓN AL SERVIDOR</Text>
      </Box>
      <Box marginTop={1} borderStyle="single" paddingX={1} borderColor={theme.borderActive}>
        <Text color={theme.text}>Código (Local): </Text>
        <Text color={theme.primary} bold>{scanBuffer}</Text>
      </Box>
      {lastScan && (
        <Box marginTop={1} paddingX={1} borderStyle="double" borderColor={theme.accent}>
          <Text color={theme.text}>Último escaneo local: {lastScan}</Text>
          <Text color={theme.secondary} italic>(En modo offline no se realizan impresiones automáticas)</Text>
        </Box>
      )}
      <Box marginTop={1}>
        <Text color={theme.textDim} italic>╰┈➤ Este modo es para pruebas de escáner sin red.</Text>
      </Box>
    </Box>
  );
};
