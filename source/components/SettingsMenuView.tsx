import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../contexts/ThemeContext.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { SelectedGradient } from './common/SelectedGradient.js';

interface SettingsMenuViewProps {
  onBack: () => void;
  onSelect: (view: 'info' | 'theme') => void;
  isActive?: boolean;
}

const settingsItems = [
  { label: '𖦹 DIAGNÓSTICO DEL SISTEMA', value: 'info', desc: 'Ver estado de API, sucursal y sesión' },
  { label: '🎨 APARIENCIA (TEMAS)', value: 'theme', desc: 'Cambiar colores y estética del CLI' },
  { label: '← VOLVER AL MENÚ', value: 'back', desc: 'Regresar a la pantalla anterior' },
];

export const SettingsMenuView: React.FC<SettingsMenuViewProps> = ({ onBack, onSelect, isActive = true }) => {
  const { theme } = useTheme();
  const { columns, rows } = useTerminalSize();
  const isTall = rows >= 18;
  const isWide = columns >= 80;

  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((_input, key) => {
    if (!isActive) return;
    if (key.escape) onBack();
    if (key.upArrow) setSelectedIndex(p => (p <= 0 ? settingsItems.length - 1 : p - 1));
    if (key.downArrow) setSelectedIndex(p => (p >= settingsItems.length - 1 ? 0 : p + 1));
    if (key.return) {
      const item = settingsItems[selectedIndex]!;
      if (item.value === 'back') onBack();
      else onSelect(item.value as 'info' | 'theme');
    }
  });

  return (
    <Box flexDirection="column" width="100%" alignItems="center" justifyContent="center">
      <Box flexDirection="column" width={Math.min(columns - 10, 60)}>
        {settingsItems.map((item, idx) => {
          const isSelected = idx === selectedIndex;
          const paddedLabel = `  ${item.label}  `.padEnd(isWide ? 40 : Math.min(columns - 12, 35));

          return (
            <Box key={item.value} marginBottom={isSelected && isTall ? 1 : 0} flexDirection="column" width="100%">
              <Box 
                borderStyle={isSelected ? "bold" : "single"} 
                borderColor={isSelected ? theme.primary : theme.border}
                width="100%"
              >
                <SelectedGradient text={paddedLabel} isActive={isSelected} flexGrow={1} />
              </Box>
              {isSelected && isTall && (
                 <Box paddingLeft={2} marginTop={-1}>
                    <Text color={theme.accent} bold>╰┈➤ {item.desc}</Text>
                 </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
