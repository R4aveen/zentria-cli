import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { AuthService, AppMode } from './services/auth.service.js';
import { LoginView } from './components/LoginView.js';
import { MainMenuView } from './components/MainMenuView.js';
import { OnlineTicketModule } from './modules/online/TicketModule.js';
import { GlobalScannerModule } from './modules/online/GlobalScannerModule.js';
import { OfflineTicketModule } from './modules/offline/TicketModule.js';
import { ThemeSelector } from './components/ThemeSelector.js';
import { SettingsMenuView } from './components/SettingsMenuView.js';
import { SystemInfoView } from './components/SystemInfoView.js';
import { Bootstrapper } from './components/Bootstrapper.js';
import { useCommand } from './hooks/useCommand.js';
import { useTerminalSize } from './hooks/useTerminalSize.js';
import { ThemeProvider, useTheme } from './contexts/ThemeContext.js';
import { themes, type Theme } from './constants/themes.js';

export default function App() {
  const [ready, setReady] = useState(false);
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
      {!ready ? (
        <Bootstrapper onReady={() => setReady(true)} />
      ) : !isLoggedIn ? (
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
  const [view, setView] = useState<'menu' | 'scanner' | 'global-scanner' | 'info' | 'theme' | 'settings'>('menu');
  const [showPrompt, setShowPrompt] = useState(false);
  const { command, setCommand, handleCommand } = useCommand({ onLogout, setView });
  const { exit } = useApp();
  const { columns, rows } = useTerminalSize();
  const { theme } = useTheme();
  
  const isWide = columns >= 80;
  // Pinning height and width to terminal size
  const shellHeight = Math.max(15, rows - 1); 
  const shellWidth = columns;

  useInput((input, key) => {
    if (key.ctrl && input === 'r') {
      process.stdout.write('\x1b[2J\x1b[H');
      setView(prev => prev); // Trigger re-render
      return;
    }

    if (key.ctrl && input === 'x') {
      setShowPrompt(!showPrompt);
      return;
    }

    if (key.escape) {
      if (view === 'menu') {
        // MainMenuView handles ESC internally (submenus / exit)
      } else if (view === 'settings') {
        setView('menu');
      } else if (view === 'info' || view === 'theme') {
        setView('settings');
      } else if (view !== 'global-scanner') {
        setView('menu');
      }
      setShowPrompt(false);
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
    <Box 
      flexDirection="column" 
      width={shellWidth} 
      height={shellHeight} 
      paddingX={isWide ? 1 : 0} 
      paddingY={0} // Fixed height handles padding
    >
      {/* FIXED HEADER */}
      <Box 
        borderStyle="double" 
        borderColor={theme.border} 
        paddingX={1} 
        marginBottom={0}
        flexDirection={isWide ? 'row' : 'column'}
        justifyContent={isWide ? 'space-between' : undefined}
        width="100%"
      >
        <Box>
          <Text bold color={theme.primary}>
            {isWide ? ' ₊⊹ ࣪ ִֶָ☾. ZENTRIA CLI ✴︎ ' : ' ZENTRIA ✴︎ '}
          </Text>
          <Text color="white" backgroundColor={mode === 'online' ? theme.modeBadgeOnline : theme.modeBadgeOffline}>
            {' '}{mode.toUpperCase()}{' '}
          </Text>
        </Box>
        {isWide && (
          <Text color={theme.textDim}>
            ☁︎ BR-{AuthService.getBranchId()} ⋆ {new Date().toLocaleTimeString()}
          </Text>
        )}
      </Box>

      {/* DYNAMIC CENTERED CONTENT */}
      <Box 
        key={`view-${view}`} // Unique key per view to force clean transition
        flexGrow={1} 
        borderStyle="round" 
        borderColor={!showPrompt ? theme.borderActive : 'gray'} 
        paddingX={1}
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        width="100%"
      >
        {view === 'menu' && <MainMenuView mode={mode} setView={setView} onLogout={onLogout} onExit={() => exit()} isActive={!showPrompt} />}
        {view === 'settings' && <SettingsMenuView onBack={() => setView('menu')} onSelect={setView} isActive={!showPrompt} />}
        {view === 'theme' && <ThemeSelector onBack={() => setView('settings')} isActive={!showPrompt} />}
        {view === 'info' && <SystemInfoView mode={mode} />}
        {view === 'scanner' && (
          mode === 'online' ? <OnlineTicketModule isActive={!showPrompt} /> : <OfflineTicketModule />
        )}
        {view === 'global-scanner' && (
          <GlobalScannerModule isActive={!showPrompt} onExit={() => setView('menu')} />
        )}
      </Box>

      {/* QUICK PROMPT */}
      {showPrompt && (
        <Box borderStyle="bold" borderColor={theme.accent} paddingX={1} marginTop={0} width="100%">
          <Text color={theme.accent} bold>₊˚ෆ zentria {'>'} </Text>
          <Text color="white">{command}</Text>
          <Text backgroundColor="white" color="white"> </Text>
        </Box>
      )}

      {/* FIXED FOOTER */}
      <Box 
        marginTop={0} 
        justifyContent={isWide ? 'space-between' : 'center'} 
        width="100%"
        paddingX={1}
      >
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
