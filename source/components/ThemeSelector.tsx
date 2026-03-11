import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { themes, themeNames } from '../constants/themes.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { GradientText } from './common/GradientText.js';
import { tinyAsciiLogo } from '../constants/ascii-art.js';

interface ThemeSelectorProps {
  onBack: () => void;
  isActive?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ onBack, isActive = true }) => {
  const { theme: currentTheme, setTheme } = useTheme();
  const [selectedIndex, setSelectedIndex] = useState(
    themeNames.indexOf(currentTheme.name)
  );

  const previewTheme = themes[themeNames[selectedIndex]!]!;

  useInput((_input, key) => {
    if (!isActive) return;
    if (key.escape) {
      onBack();
      return;
    }
    if (key.upArrow) {
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : themeNames.length - 1));
    }
    if (key.downArrow) {
      setSelectedIndex(prev => (prev < themeNames.length - 1 ? prev + 1 : 0));
    }
    if (key.return) {
      setTheme(themeNames[selectedIndex]!);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold underline color={previewTheme.primary}>✴︎ SELECCIONAR TEMA</Text>

      <Box marginTop={1} flexDirection="row" gap={2}>
        <Box flexDirection="column" flexBasis="50%">
          {themeNames.map((name, index) => {
            const t = themes[name]!;
            const isSelected = index === selectedIndex;
            const isCurrent = name === currentTheme.name;
            return (
              <Box
                key={name}
                borderStyle="round"
                borderColor={isSelected ? previewTheme.borderActive : previewTheme.textMuted}
                paddingX={1}
              >
                <Text color={isSelected ? t.primary : previewTheme.textDim} bold={isSelected}>
                  {isSelected ? '✧ ' : '· '}
                  {t.label}
                  {isCurrent ? ' ⋆ actual' : ''}
                </Text>
              </Box>
            );
          })}
        </Box>

        <Box flexDirection="column" flexBasis="50%" borderStyle="double" borderColor={previewTheme.accent} paddingX={1}>
          <Text bold color={previewTheme.primary}>₊˚ෆ Vista Previa</Text>
          <Box marginTop={1}>
            <GradientText text={tinyAsciiLogo} gradient={previewTheme.gradient} />
          </Box>
          <Box marginTop={1} flexDirection="column">
            <Text color={previewTheme.primary}>╰┈➤ Color primario</Text>
            <Text color={previewTheme.secondary}>╰┈➤ Color secundario</Text>
            <Text color={previewTheme.accent}>╰┈➤ Color acento</Text>
            <Text color={previewTheme.text}>╰┈➤ Color texto</Text>
            <Text color={previewTheme.textDim}>╰┈➤ Color sutil</Text>
          </Box>
          <Box marginTop={1} borderStyle="single" borderColor={previewTheme.borderActive} paddingX={1}>
            <Text color={previewTheme.primary} bold>✧ Item seleccionado</Text>
          </Box>
          <Box borderStyle="single" borderColor={previewTheme.textMuted} paddingX={1}>
            <Text color={previewTheme.textDim}>· Item normal</Text>
          </Box>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color={previewTheme.textDim} italic>
          ╰┈➤ ↑↓ Navegar ⋆ ENTER Aplicar ⋆ ESC Volver
        </Text>
      </Box>
    </Box>
  );
};
