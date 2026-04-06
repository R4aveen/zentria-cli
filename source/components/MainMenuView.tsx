import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { useTheme } from '../contexts/ThemeContext.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { SelectedGradient } from './common/SelectedGradient.js';
import { AppMode } from '../services/auth.service.js';

interface MainMenuViewProps {
  mode?: AppMode;
  setView: (view: 'menu' | 'scanner' | 'global-scanner' | 'info' | 'theme' | 'settings') => void;
  onLogout: () => void;
  onExit: () => void;
  isActive?: boolean;
}

interface GridItem {
  label: string;
  value: string;
  desc: string;
}

const mainItems: GridItem[] = [
  { label: '✧ IMPRESIÓN DE REVISIONES', value: 'print', desc: 'Escaneo y despacho de etiquetas térmicas' },
  { label: '⚙ CONFIGURACIÓN', value: 'config', desc: 'Ajustes de terminal, temas e info' },
  { label: '☾ CERRAR SESIÓN', value: 'logout', desc: 'Salir de la cuenta actual' },
  { label: '← SALIR DEL CLI', value: 'exit', desc: 'Cerrar la terminal de Zentria' },
];

const Dashboard: React.FC<{ mode?: string; theme: any; isWide: boolean; time: string }> = ({ mode, theme, isWide, time }) => (
  <Box 
    flexDirection="column" 
    borderStyle="round" 
    borderColor={theme.border} 
    paddingX={1} 
    width={isWide ? 28 : "100%"}
    marginBottom={isWide ? 0 : 1}
  >
    <Box paddingX={1}><Text color="black" backgroundColor={theme.border} bold> SYSTEM INFO </Text></Box>
    <Box flexDirection="column" marginTop={1}>
      <Text color={theme.text} dimColor>USUARIO: <Text color={theme.primary} bold dimColor={false}>ZENTRIA-OP</Text></Text>
      <Text color={theme.text} dimColor>SUCURSAL: <Text color={theme.secondary} bold dimColor={false}>BODEGA-主</Text></Text>
      <Text color={theme.text} dimColor>MODO: <Text color={theme.success} bold dimColor={false}>{mode?.toUpperCase()}</Text></Text>
      <Text color={theme.text} dimColor>HORA: <Text color={theme.text} bold dimColor={false}>{time}</Text></Text>
    </Box>
  </Box>
);

export const MainMenuView: React.FC<MainMenuViewProps> = ({ mode, setView, onLogout, onExit, isActive = true }) => {
  const { theme } = useTheme();
  const { columns, rows } = useTerminalSize();
  
  const isWide = columns >= 95;
  const isTall = rows >= 18;
  
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useInput((_input, key) => {
    if (!isActive) return;

    if (key.upArrow) setFocusedIndex(p => (p <= 0 ? mainItems.length - 1 : p - 1));
    if (key.downArrow) setFocusedIndex(p => (p >= mainItems.length - 1 ? 0 : p + 1));

    if (key.return) {
      const current = mainItems[focusedIndex]!;
      switch (current.value) {
        case 'print': 
          if (mode === 'offline') setView('scanner');
          else setView('global-scanner');
          break;
        case 'config': setView('settings'); break;
        case 'logout': onLogout(); break;
        case 'exit': onExit(); break;
      }
    }
  });

  const menuWidth = isWide ? Math.min(60, columns - 32) : "100%";

  return (
    <Box 
        flexDirection={isWide ? "row" : "column"} 
        width="100%"
        alignItems={isWide ? "flex-start" : "center"} 
        justifyContent="center"
        paddingX={isWide ? 2 : 1}
    >
        {/* Render Dashboard */}
        {!isWide && <Dashboard mode={mode} theme={theme} isWide={isWide} time={currentTime.toLocaleTimeString()} />}
        {isWide && <Dashboard mode={mode} theme={theme} isWide={isWide} time={currentTime.toLocaleTimeString()} />}

        {/* MENU OPTIONS */}
        <Box 
            flexDirection="column" 
            width={menuWidth} 
            marginLeft={isWide ? 2 : 0}
            alignItems={isWide ? "flex-start" : "center"}
        >
            {isTall && (
                <Box marginBottom={1}>
                    <Text color={theme.text} dimColor bold>SELECCIONE UNA OPERACIÓN:</Text>
                </Box>
            )}

            {mainItems.map((item, idx) => {
                const isSelected = idx === focusedIndex;
                const paddedLabel = `  ${item.label}  `.padEnd(isWide ? 40 : Math.min(columns - 10, 40));

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
