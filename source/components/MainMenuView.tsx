import React from 'react';
import { Box, Text } from 'ink';
import { Menu, MenuItem } from './common/Menu.js';

interface MainMenuViewProps {
  setView: (view: 'menu' | 'scanner' | 'global-scanner' | 'info') => void;
  onLogout: () => void;
  isActive?: boolean;
}

export const MainMenuView: React.FC<MainMenuViewProps> = ({ setView, onLogout, isActive = true }) => {
  const items: MenuItem[] = [
    { label: '📦 Listar Lotes (Por Lote)', value: 'scanner' },
    { label: '🔍 Imprimir por Serie (Búsqueda Global)', value: 'global-scanner' },
    { label: 'ℹ️ Información del Sistema', value: 'info' },
    { label: '🚪 Cerrar Sesión', value: 'logout' },
  ];

  const handleSelect = (item: MenuItem) => {
    if (!isActive) return;
    if (item.value === 'logout') {
      onLogout();
    } else if (item.value === 'scanner') {
      setView('scanner');
    } else if (item.value === 'global-scanner') {
      setView('global-scanner');
    } else if (item.value === 'info') {
      setView('info');
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold underline color={isActive ? 'yellow' : 'white'}>
        {isActive ? '🏠 MENÚ PRINCIPAL' : '   MENÚ PRINCIPAL'}
      </Text>
      <Menu items={items} onSelect={handleSelect} isActive={isActive} />
      {isActive && (
        <Box marginTop={1}>
          <Text dimColor italic>↑ ↓: Navegar | ENTER: Seleccionar | ESC: Salir</Text>
        </Box>
      )}
    </Box>
  );
};
