import React, { useState } from 'react';
import { useApp, useInput } from 'ink';
import { AuthService } from './services/auth.service.js';
import { LoginView } from './components/LoginView.js';
import { ScannerView } from './components/ScannerView.js';

export default function App() {
  const [token, setToken] = useState<string | undefined>(AuthService.getToken());
  const { exit } = useApp();

  useInput((_input, key) => {
    if (key.escape) {
      exit();
    }
  });

  const handleLoginSuccess = (newToken: string) => {
    setToken(newToken);
  };

  if (!token) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  return <ScannerView />;
}
