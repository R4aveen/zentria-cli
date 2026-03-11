import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { AuthService, AppMode } from './services/auth.service.js';
import { LoginView } from './components/LoginView.js';
import { MainMenuView } from './components/MainMenuView.js';
import { OnlineTicketModule } from './modules/online/TicketModule.js';
import { GlobalScannerModule } from './modules/online/GlobalScannerModule.js';
import { OfflineTicketModule } from './modules/offline/TicketModule.js';
import { useCommand } from './hooks/useCommand.js';

export default function App() {
  const [token, setToken] = useState<string | undefined>(AuthService.getToken());
  const [mode, setMode] = useState<AppMode>(AuthService.getMode());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!token || mode === 'offline');

  const handleLoginSuccess = (newToken: string) => {
    AuthService.setToken(newToken);
    AuthService.setMode('online');
    setToken(newToken);
    setMode('online');
    setIsLoggedIn(true);
  };

  const handleOfflineMode = () => {
    AuthService.setMode('offline');
    setMode('offline');
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    AuthService.logout();
    setToken(undefined);
    setMode('online');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginView onLoginSuccess={handleLoginSuccess} onOfflineMode={handleOfflineMode} />;
  }

  return (
    <Shell mode={mode} onLogout={handleLogout} />
  );
}

interface ShellProps {
  mode: AppMode;
  onLogout: () => void;
}

const Shell: React.FC<ShellProps> = ({ mode, onLogout }) => {
  const [view, setView] = useState<'menu' | 'scanner' | 'global-scanner' | 'info'>('menu');
  const [showPrompt, setShowPrompt] = useState(false);
  const { command, setCommand, handleCommand } = useCommand({ onLogout, setView });
  const { exit } = useApp();

  useInput((input, key) => {
    if (key.ctrl && input === 'x') {
      setShowPrompt(!showPrompt);
      return;
    }

    if (key.escape) {
      if (view === 'menu') {
        exit();
      } else if (view !== 'global-scanner') {
        setView('menu');
        setShowPrompt(false);
      }
      return;
    }

    if (showPrompt) {
      if (key.return) {
        handleCommand(command);
      } else if (key.backspace) {
        setCommand((prev) => prev.slice(0, -1));
      } else if (input && !key.ctrl && !key.meta) {
        setCommand((prev) => prev + input);
      }
    }
  });

  return (
    <Box flexDirection="column" minHeight={15} paddingX={1} paddingTop={1}>
      <Box borderStyle="double" borderColor="#7B68EE" paddingX={1} marginBottom={1} justifyContent="space-between">
        <Box>
          <Text bold color="#E0B0FF"> ₊⊹ ࣪ ִֶָ☾. ZENTRIA CLI ✴︎ </Text>
          <Text color="white" backgroundColor={mode === 'online' ? '#5B5EA6' : '#8B5CF6'}>
            {' '}{mode.toUpperCase()}{' '}
          </Text>
        </Box>
        <Text color="#778899">☁︎ BR-{AuthService.getBranchId()} ⋆ {new Date().toLocaleTimeString()}</Text>
      </Box>

      <Box flexGrow={1} borderStyle="round" borderColor={!showPrompt ? '#DDA0DD' : 'gray'} paddingX={1}>
        {view === 'menu' && <MainMenuView setView={setView} onLogout={onLogout} isActive={!showPrompt} />}
        {view === 'info' && (
          <Box flexDirection="column" padding={1}>
            <Text bold color="#E0B0FF" underline>𖦹 DIAGNÓSTICO DEL SISTEMA</Text>
            <Box marginTop={1} flexDirection="column">
              <Text color="#B0C4DE">╰┈➤ Modo: {mode.toUpperCase()}</Text>
              <Text color="#B0C4DE">╰┈➤ Sucursal Activa: BR-{AuthService.getBranchId()}</Text>
              <Text color="#B0C4DE">╰┈➤ API Base: {AuthService.getBaseUrl()}</Text>
              <Text color="#B0C4DE">╰┈➤ Token Presente: {AuthService.getToken() ? 'SÍ' : 'NO'}</Text>
            </Box>
            <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
              <Text dimColor>Ruta Ejemplo: /api/branches/{AuthService.getBranchId()}/technical-reviews/batches</Text>
            </Box>
            <Box marginTop={1}>
              <Text dimColor italic>Presione ESC para volver al menú</Text>
            </Box>
          </Box>
        )}
        {view === 'scanner' && (
          mode === 'online' ? <OnlineTicketModule isActive={!showPrompt} /> : <OfflineTicketModule />
        )}
        {view === 'global-scanner' && (
          <GlobalScannerModule isActive={!showPrompt} onExit={() => setView('menu')} />
        )}
      </Box>

      {showPrompt && (
        <Box borderStyle="bold" borderColor="#7B68EE" paddingX={1} marginTop={1}>
          <Text color="#7B68EE" bold>₊˚ෆ zentria {'>'} </Text>
          <Text color="white">{command}</Text>
          <Text backgroundColor="white" color="white"> </Text>
        </Box>
      )}

      <Box marginTop={1} justifyContent="space-between">
        <Text color="#696969"> ╰┈➤ ESC: Volver/Salir </Text>
        <Text color="#696969"> 愛 CTRL+X: CLI </Text>
      </Box>
    </Box>
  );
};
