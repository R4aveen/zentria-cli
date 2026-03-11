import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { Menu, type MenuItem } from './common/Menu.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';

interface MainMenuViewProps {
  setView: (view: 'menu' | 'scanner' | 'global-scanner' | 'info' | 'theme') => void;
  onLogout: () => void;
  onExit: () => void;
  isActive?: boolean;
}

interface GridItem {
  label: string;
  value: string;
  row: number;
  col: number;
}

const mainGrid: GridItem[] = [
  { label: '⚙ Configuración', value: 'config', row: 0, col: 0 },
  { label: '☾ Cerrar Sesión', value: 'logout', row: 0, col: 1 },
  { label: '✧ Impresión de Revisiones', value: 'print', row: 1, col: 0 },
  { label: '← Salir', value: 'exit', row: 2, col: 0 },
];

const uniqueRows = [...new Set(mainGrid.map(i => i.row))].sort((a, b) => a - b);

export const MainMenuView: React.FC<MainMenuViewProps> = ({ setView, onLogout, onExit, isActive = true }) => {
  const { theme } = useTheme();
  const { columns } = useTerminalSize();
  const isWide = columns >= 60;
  const [phase, setPhase] = useState<'main' | 'print' | 'config'>('main');
  const [focusedIndex, setFocusedIndex] = useState(0);

  useInput((_input, key) => {
    if (!isActive) return;

    if (key.escape) {
      if (phase === 'main') {
        onExit();
      } else {
        setPhase('main');
      }
      return;
    }

    if (phase !== 'main') return;

    const current = mainGrid[focusedIndex]!;

    if (key.upArrow || key.downArrow) {
      const rowIdx = uniqueRows.indexOf(current.row);
      const newRowIdx = key.upArrow
        ? (rowIdx > 0 ? rowIdx - 1 : uniqueRows.length - 1)
        : (rowIdx < uniqueRows.length - 1 ? rowIdx + 1 : 0);
      const newRow = uniqueRows[newRowIdx]!;
      const itemsInRow = mainGrid.filter(i => i.row === newRow);
      const target = itemsInRow.reduce((closest, item) =>
        Math.abs(item.col - current.col) < Math.abs(closest.col - current.col) ? item : closest
      );
      setFocusedIndex(mainGrid.indexOf(target));
    }

    if (key.leftArrow || key.rightArrow) {
      const itemsInRow = mainGrid.filter(i => i.row === current.row);
      if (itemsInRow.length <= 1) return;
      const colIdx = itemsInRow.indexOf(current);
      const newColIdx = key.leftArrow
        ? (colIdx > 0 ? colIdx - 1 : itemsInRow.length - 1)
        : (colIdx < itemsInRow.length - 1 ? colIdx + 1 : 0);
      setFocusedIndex(mainGrid.indexOf(itemsInRow[newColIdx]!));
    }

    if (key.return) {
      switch (current.value) {
        case 'print': setPhase('print'); break;
        case 'config': setPhase('config'); break;
        case 'logout': onLogout(); break;
        case 'exit': onExit(); break;
      }
    }
  });

  // --- Print submenu ---
  if (phase === 'print') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold underline color={theme.primary}>✧ IMPRESIÓN DE REVISIONES</Text>
        <Menu
          items={[
            { label: '✧ Listar Lotes (Por Lote)', value: 'scanner' },
            { label: '⋆ Imprimir por Serie (Búsqueda Global)', value: 'global-scanner' },
          ]}
          onSelect={(item: MenuItem) => setView(item.value as any)}
          isActive={isActive}
        />
        <Box marginTop={1}>
          <Text color={theme.textDim} italic>╰┈➤ ESC: Volver al menú</Text>
        </Box>
      </Box>
    );
  }

  // --- Config submenu ---
  if (phase === 'config') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold underline color={theme.primary}>⚙ CONFIGURACIÓN</Text>
        <Menu
          items={[
            { label: '𖦹 Información del Sistema', value: 'info' },
            { label: '✴︎ Cambiar Tema', value: 'theme' },
          ]}
          onSelect={(item: MenuItem) => setView(item.value as any)}
          isActive={isActive}
        />
        <Box marginTop={1}>
          <Text color={theme.textDim} italic>╰┈➤ ESC: Volver al menú</Text>
        </Box>
      </Box>
    );
  }

  // --- Main grid ---
  const renderItem = (item: GridItem, grow?: number) => {
    const idx = mainGrid.indexOf(item);
    const isSelected = idx === focusedIndex && isActive;
    return (
      <Box
        key={item.value}
        borderStyle="round"
        borderColor={isSelected ? theme.borderActive : theme.textMuted}
        paddingX={2}
        flexGrow={grow ?? 1}
      >
        <Text color={isSelected ? theme.primary : '#B0B0B0'} bold={isSelected}>
          {isSelected ? '✧ ' : '· '}{item.label}
        </Text>
      </Box>
    );
  };

  const row1 = mainGrid.filter(i => i.row === 1);

  return (
    <Box flexDirection="column" padding={1}>
      {isWide ? (
        <Box alignItems="center" marginBottom={1}>
          <Box flexGrow={1} justifyContent="flex-start">
            {renderItem(mainGrid.find(i => i.value === 'config')!, 0)}
          </Box>
          <Box flexShrink={0} paddingX={2}>
            <Text bold underline color={isActive ? theme.primary : 'white'}>
              ₊˚ෆ MENÚ PRINCIPAL
            </Text>
          </Box>
          <Box flexGrow={1} justifyContent="flex-end">
            {renderItem(mainGrid.find(i => i.value === 'logout')!, 0)}
          </Box>
        </Box>
      ) : (
        <Box flexDirection="column" marginBottom={1}>
          <Box justifyContent="center" marginBottom={1}>
            <Text bold underline color={isActive ? theme.primary : 'white'}>
              ₊˚ෆ MENÚ PRINCIPAL
            </Text>
          </Box>
          <Box gap={1}>
            {renderItem(mainGrid.find(i => i.value === 'config')!)}
            {renderItem(mainGrid.find(i => i.value === 'logout')!)}
          </Box>
        </Box>
      )}

      <Box>{row1.map(item => renderItem(item))}</Box>

      <Box marginTop={1}>
        {renderItem(mainGrid.find(i => i.value === 'exit')!, 0)}
      </Box>

      {isActive && (
        <Box marginTop={1} justifyContent="center">
          <Text color={theme.textDim} italic>
            {isWide ? '╰┈➤ ↑↓←→ Navegar ⋆ ENTER Seleccionar ⋆ ESC Salir' : '↑↓←→ ⋆ ENTER ⋆ ESC'}
          </Text>
        </Box>
      )}
    </Box>
  );
};
