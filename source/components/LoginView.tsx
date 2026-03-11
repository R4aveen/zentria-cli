import React, { useState } from 'react';
import { Text, Box } from 'ink';
import TextInput from 'ink-text-input';
import { ApiService } from '../services/api.service.js';
import { AuthService } from '../services/auth.service.js';
import { Menu, MenuItem } from './common/Menu.js';

interface Props {
  onLoginSuccess: (token: string) => void;
  onOfflineMode: () => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess, onOfflineMode }) => {
  const [step, setStep] = useState<'mode' | 'credentials'>('mode');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focus, setFocus] = useState<'email' | 'password'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email || !password) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.login(email, password);
      const token = data.access_token || data.token || (data.data && data.data.token);
      onLoginSuccess(token);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleModeSelect = (item: MenuItem) => {
    if (item.value === 'online') {
      setStep('credentials');
    } else {
      onOfflineMode();
    }
  };

  if (step === 'mode') {
    return (
      <Box flexDirection="column" padding={1} borderStyle="round" borderColor="blue">
        <Text bold color="blue">ZENTRIA CLI - SELECCIONE MODO</Text>
        <Menu
          items={[
            { label: '🌐 Modo Online (Requiere Autenticación)', value: 'online' },
            { label: '📴 Modo Offline (Sin conexión a servidor)', value: 'offline' },
          ]}
          onSelect={handleModeSelect}
        />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="blue">
      <Text bold color="blue">ZENTRIA CLI - ACCESO RESTRINGIDO</Text>
      <Box marginTop={1}>
        <Text dimColor>API: {AuthService.getBaseUrl()}</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Box>
          <Text color={focus === 'email' ? 'cyan' : 'white'} bold={focus === 'email'}>
            {focus === 'email' ? '> ' : '  '}Email: 
          </Text>
          <TextInput
            value={email}
            onChange={setEmail}
            focus={focus === 'email'}
            onSubmit={() => setFocus('password')}
          />
        </Box>

        <Box>
          <Text color={focus === 'password' ? 'cyan' : 'white'} bold={focus === 'password'}>
            {focus === 'password' ? '> ' : '  '}Password: 
          </Text>
          <TextInput
            value={password}
            onChange={setPassword}
            mask="*"
            focus={focus === 'password'}
            onSubmit={handleSubmit}
          />
        </Box>
      </Box>

      <Box marginTop={1} flexDirection="column">
        {loading ? (
          <Text color="yellow">Validando credenciales en el servidor...</Text>
        ) : (
          <Text dimColor>TAB para cambiar campo | ENTER para ingresar</Text>
        )}
        
        {error && (
          <Box marginTop={1}>
            <Text color="red" bold>ERROR: </Text>
            <Text color="red" wrap="truncate">{error}</Text>
          </Box>
        )}
        <Box marginTop={1}>
          <Text dimColor>Presione ESC para volver a selección de modo</Text>
        </Box>
      </Box>
    </Box>
  );
};
