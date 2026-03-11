import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { AuthService, AppMode } from './services/auth.service.js';
import { LoginView } from './components/LoginView.js';
import { MainMenuView } from './components/MainMenuView.js';
import { OnlineTicketModule } from './modules/online/TicketModule.js';
import { GlobalScannerModule } from './modules/online/GlobalScannerModule.js';
import { OfflineTicketModule } from './modules/offline/TicketModule.js';
import { ThemeSelector } from './components/ThemeSelector.js';
import { useCommand } from './hooks/useCommand.js';
import { useTerminalSize } from './hooks/useTerminalSize.js';
import { ThemeProvider, useTheme } from './contexts/ThemeContext.js';
import { themes, type Theme } from './constants/themes.js';

export default function App() {
  const [token, setToken] = useState<string | undefined>(AuthService.getToken());
  const [mode, setMode] = useState<AppMode>(AuthService.getMode());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(!!token || mode === 'offline');
  const [currentTheme, setCurrentTheme] = useState<Theme>(AuthService.getTheme());

  const handleThemeChange = (name: string) => {
    AuthService.setTheme(name);
    setCurrentTheme(themes[name]!);
  };

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

  return (
    <ThemeProvider theme={currentTheme} setTheme={handleThemeChange}>
      {!isLoggedIn ? (
        <LoginView onLoginSuccess={handleLoginSuccess} onOfflineMode={handleOfflineMode} />
      ) : (
        <Shell mode={mode} onLogout={handleLogout} />
      )}
    </ThemeProvider>
  );
}

interface ShellProps {
  mode: AppMode;
  onLogout: () => void;
}

const Shell: React.FC<ShellProps> = ({ mode, onLogout }) => {
  const [view, setView] = useState<'menu' | 'scanner' | 'global-scanner' | 'info' | 'theme'>('menu');
  const [showPrompt, setShowPrompt] = useState(false);
  const { command, setCommand, handleCommand } = useCommand({ onLogout, setView });
  const { exit } = useApp();
  const { columns } = useTerminalSize();
  const { theme } = useTheme();
  const isWide = columns >= 80;

  useInput((input, key) => {
    if (key.ctrl && input === 'x') {
      setShowPrompt(!showPrompt);
      return;
    }

    if (key.escape) {
      if (view === 'menu') {
        // MainMenuView handles ESC internally (submenus / exit)
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
    <Box flexDirection="column" minHeight={15} paddingX={isWide ? 1 : 0} paddingTop={1}>
      <Box borderStyle="double" borderColor={theme.border} paddingX={1} marginBottom={1}
        flexDirection={isWide ? 'row' : 'column'}
        justifyContent={isWide ? 'space-between' : undefined}>
        <Box>
          <Text bold color={theme.primary}>
            {isWide ? ' ₊⊹ ࣪ ִֶָ☾. ZENTRIA CLI ✴︎ ' : ' ZENTRIA ✴︎ '}
          </Text>
          <Text color="white" backgroundColor={mode === 'online' ? theme.modeBadgeOnline : theme.modeBadgeOffline}>
            {' '}{mode.toUpperCase()}{' '}
          </Text>
        </Box>
        <Text color={theme.textDim}>
          {isWide ? '☁︎ ' : ''}BR-{AuthService.getBranchId()} ⋆ {new Date().toLocaleTimeString()}
        </Text>
      </Box>

      <Box flexGrow={1} borderStyle="round" borderColor={!showPrompt ? theme.borderActive : 'gray'} paddingX={1}>
        {view === 'menu' && <MainMenuView setView={setView} onLogout={onLogout} onExit={() => exit()} isActive={!showPrompt} />}
        {view === 'theme' && <ThemeSelector onBack={() => setView('menu')} isActive={!showPrompt} />}
        {view === 'info' && (
          <Box flexDirection="column" padding={1}>
            <Text bold color={theme.primary} underline>𖦹 DIAGNÓSTICO DEL SISTEMA</Text>
            <Box marginTop={1} flexDirection="column">
              <Text color={theme.text}>╰┈➤ Modo: {mode.toUpperCase()}</Text>
              <Text color={theme.text}>╰┈➤ Sucursal Activa: BR-{AuthService.getBranchId()}</Text>
              <Text color={theme.text}>╰┈➤ API Base: {AuthService.getBaseUrl()}</Text>
              <Text color={theme.text}>╰┈➤ Token Presente: {AuthService.getToken() ? 'SÍ' : 'NO'}</Text>
              <Text color={theme.text}>╰┈➤ Tema: {theme.label}</Text>
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
        <Box borderStyle="bold" borderColor={theme.accent} paddingX={1} marginTop={1}>
          <Text color={theme.accent} bold>₊˚ෆ zentria {'>'} </Text>
          <Text color="white">{command}</Text>
          <Text backgroundColor="white" color="white"> </Text>
        </Box>
      )}

      <Box marginTop={1} justifyContent={isWide ? 'space-between' : 'center'}>
        {isWide ? (
          <>
            <Text color={theme.textDim}> ╰┈➤ ESC: Volver/Salir </Text>
            <Text color={theme.textDim}> 愛 CTRL+X: CLI </Text>
          </>
        ) : (
          <Text color={theme.textDim}>ESC: Salir ⋆ CTRL+X: CLI</Text>
        )}
      </Box>
    </Box>
  );
};
