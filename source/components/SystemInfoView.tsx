import React from 'react';
import { Box, Text } from 'ink';
import { useTheme } from '../contexts/ThemeContext.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { AuthService } from '../services/auth.service.js';
import { SelectedGradient } from './common/SelectedGradient.js';

interface SystemInfoViewProps {
  mode: string;
}

export const SystemInfoView: React.FC<SystemInfoViewProps> = ({ mode }) => {
  const { theme } = useTheme();
  const { columns } = useTerminalSize();
  const isWide = columns >= 80;

  const infoItems = [
    { label: 'MODO', value: mode.toUpperCase(), icon: '⚙' },
    { label: 'SUCURSAL ACTIVA', value: `BR-${AuthService.getBranchId()}`, icon: '📍' },
    { label: 'API BASE', value: AuthService.getBaseUrl(), icon: '🌐' },
    { label: 'TOKEN PRESENTE', value: AuthService.getToken() ? 'SÍ' : 'NO', icon: '🔑' },
    { label: 'TEMA ACTIVO', value: theme.label, icon: '🎨' },
  ];

  return (
    <Box flexDirection="column" width="100%" alignItems="center" justifyContent="center">
      <Box 
        flexDirection={isWide ? "row" : "column"} 
        flexWrap="wrap" 
        justifyContent="center" 
        width="100%"
        paddingX={2}
      >
        {infoItems.map((item, idx) => (
          <Box 
            key={idx} 
            borderStyle="round" 
            borderColor={theme.border} 
            paddingX={1} 
            marginX={1} 
            marginBottom={1}
            minWidth={isWide ? 35 : "100%"}
          >
            <Box width={isWide ? 20 : 15} flexShrink={0} alignItems="center">
              <Text color={theme.textDim} bold>{item.label}:</Text>
            </Box>
            <SelectedGradient text={item.value} flexGrow={1} />
          </Box>
        ))}
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={2} width={Math.min(columns - 4, 80)}>
        <Text dimColor italic wrap="truncate-end">Ruta de despliegue: /api/branches/{AuthService.getBranchId()}/technical-reviews/batches</Text>
      </Box>
    </Box>
  );
};
