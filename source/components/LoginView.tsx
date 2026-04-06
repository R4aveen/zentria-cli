import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { ApiService } from '../services/api.service.js';
import { Menu, MenuItem } from './common/Menu.js';
import { useTerminalSize } from '../hooks/useTerminalSize.js';
import { getAsciiLogo, tinyAsciiLogo } from '../constants/ascii-art.js';
import { useTheme } from '../contexts/ThemeContext.js';
import { GradientText } from './common/GradientText.js';
import { SelectedGradient } from './common/SelectedGradient.js';

interface Props {
  onLoginSuccess: (token: string) => void;
  onOfflineMode: () => void;
}

export const LoginView: React.FC<Props> = ({ onLoginSuccess, onOfflineMode }) => {
  const [step, setStep] = useState<'mode' | 'credentials'>('mode');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focus, setFocus] = useState<'email' | 'password' | 'submit'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { columns, rows } = useTerminalSize();
  const { theme } = useTheme();

  useInput((_input, key) => {
    if (key.escape && step === 'credentials') setStep('mode');
    
    if (step === 'credentials') {
      if (key.tab || key.downArrow || key.upArrow) {
        setFocus(prev => {
          if (prev === 'email') return 'password';
          if (prev === 'password') return 'submit';
          return 'email';
        });
      }
      if (key.return && focus === 'submit') handleSubmit();
    }
  });

  const handleSubmit = async () => {
    if (!email || !password) {
       setError('Complete todos los campos');
       return;
    }
    
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
    if (item.value === 'online') setStep('credentials');
    else onOfflineMode();
  };

  const renderHeader = () => (
    <Box marginBottom={1} justifyContent="center" width="100%">
      <GradientText 
        text={columns >= 80 ? getAsciiLogo(columns) : tinyAsciiLogo} 
        gradient={theme.gradient} 
      />
    </Box>
  );

  const isTall = rows >= 15;

  if (step === 'mode') {
    return (
      <Box 
        flexDirection="column" 
        width="100%" 
        alignItems="center" 
        justifyContent="center"
        flexGrow={1}
      >
        {renderHeader()}
        <Box 
          flexDirection="column" 
          padding={isTall ? 2 : 1} 
          borderStyle="double" 
          borderColor={theme.primary} 
          width={Math.min(columns - 4, 60)}
        >
          <Box marginBottom={1} justifyContent="center">
            <Text bold color={theme.primary}>₊⊹ ࣪ ִֶָ☾. SELECCIONE MODO DE OPERACIÓN ✴︎</Text>
          </Box>
          <Menu
            items={[
              { label: '⋆ Modo Online (Sincronización Total)', value: 'online' },
              { label: '☁︎ Modo Offline (Bodega sin Internet)', value: 'offline' },
            ]}
            onSelect={handleModeSelect}
          />
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      flexDirection="column" 
      width="100%" 
      alignItems="center" 
      justifyContent="center"
      flexGrow={1}
    >
      {renderHeader()}
      
      <Box 
        flexDirection="column" 
        padding={isTall ? 2 : 1} 
        borderStyle="round" 
        borderColor={theme.border} 
        width={Math.min(columns - 4, 60)}
      >
        <Box marginBottom={1} justifyContent="center" borderStyle="single" borderColor={theme.accent}>
           <Text bold color={theme.accent}> 🔐 ACCESO RESTRINGIDO </Text>
        </Box>

        <Box flexDirection="column" marginY={1}>
          {/* Email Field */}
          <Box marginBottom={1} flexDirection={columns < 50 ? 'column' : 'row'}>
            <Box width={columns < 50 ? '100%' : 12}>
               <Text color={focus === 'email' ? theme.primary : theme.text} bold={focus === 'email'}>
                 Email:
               </Text>
            </Box>
            <Box flexGrow={1} borderStyle="single" borderColor={focus === 'email' ? theme.primary : theme.border}>
               <TextInput
                 value={email}
                 onChange={setEmail}
                 focus={focus === 'email'}
                 onSubmit={() => setFocus('password')}
               />
            </Box>
          </Box>

          {/* Password Field */}
          <Box marginBottom={1} flexDirection={columns < 50 ? 'column' : 'row'}>
            <Box width={columns < 50 ? '100%' : 12}>
               <Text color={focus === 'password' ? theme.primary : theme.text} bold={focus === 'password'}>
                 Password:
               </Text>
            </Box>
            <Box flexGrow={1} borderStyle="single" borderColor={focus === 'password' ? theme.primary : theme.border}>
               <TextInput
                 value={password}
                 onChange={setPassword}
                 mask="*"
                 focus={focus === 'password'}
                 onSubmit={() => setFocus('submit')}
               />
            </Box>
          </Box>
        </Box>

        {/* Submit Button */}
        <Box marginTop={1} justifyContent="center">
          <Box borderStyle="bold" borderColor={focus === 'submit' ? theme.success : theme.border} width="100%">
             <SelectedGradient 
               text={loading ? "  VALIDANDO...  " : "    ENTRAR AL SISTEMA    "} 
               isActive={focus === 'submit'} 
               flexGrow={1}
             />
          </Box>
        </Box>

        {isTall && error && (
          <Box marginTop={1} justifyContent="center">
            <Text color={theme.error} bold>⚠ {error}</Text>
          </Box>
        )}

        {isTall && (
          <Box marginTop={1} justifyContent="center">
            <Text color={theme.textDim} italic>
               TAB: Campo  •  ENTER: Entrar  •  ESC: Volver
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
};
