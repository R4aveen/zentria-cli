import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../../contexts/ThemeContext.js';

export interface MenuItem {
  label: string;
  value: string;
}

interface MenuProps {
  items: MenuItem[];
  onSelect: (item: MenuItem) => void;
  title?: string;
  isActive?: boolean;
}

export const Menu: React.FC<MenuProps> = ({ items, onSelect, title, isActive = true }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { theme } = useTheme();

  useInput((_input, key) => {
    if (!isActive) return;

    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    }
    if (key.return) {
      onSelect(items[selectedIndex]!);
    }
  });

  return (
    <Box flexDirection="column" paddingY={1}>
      {title && (
        <Box marginBottom={1} paddingX={1}>
          <Text bold color={theme.text} underline>{title}</Text>
        </Box>
      )}
      <Box flexDirection="column">
        {items.map((item, index) => {
          const isSelected = index === selectedIndex && isActive;
          return (
            <Box 
              key={item.value} 
              borderStyle="round" 
              borderColor={isSelected ? theme.borderActive : theme.textMuted}
              paddingX={1}
              marginBottom={0}
            >
              <Text color={isSelected ? theme.primary : '#B0B0B0'} bold={isSelected}>
                {isSelected ? '✧ ' : '· '}
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
