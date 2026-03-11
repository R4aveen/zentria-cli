import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ApiService } from '../../services/api.service.js';
import { TechnicalItem } from '../../types/api.types.js';
import { PrintService } from '../../services/print.service.js';

interface GlobalScannerModuleProps {
  isActive?: boolean;
}

export const GlobalScannerModule: React.FC<GlobalScannerModuleProps> = ({ isActive = true }) => {
  const [scanBuffer, setScanBuffer] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('🟢 LISTO PARA BÚSQUEDA GLOBAL');
  const [lastItem, setLastItem] = useState<TechnicalItem | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  useInput((input, key) => {
    if (!isActive) return;
    if (status === 'loading') return;

    if (key.return) {
      if (scanBuffer.length > 0) {
        handleGlobalSearch(scanBuffer);
        setScanBuffer('');
      }
    } else if (key.backspace) {
      setScanBuffer((prev) => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setScanBuffer((prev) => prev + input);
    }
  });

  const handleGlobalSearch = async (serie: string) => {
    setStatus('loading');
    setLocalError(null);
    setMessage(`🔍 BUSCANDO SERIE: ${serie}...`);
    try {
      const items = await ApiService.fetchGlobalItems(serie);
      if (items && items.length > 0) {
        const item = items[0]!; // Pick first result as requested
        setLastItem(item);
        setStatus('success');
        setMessage(`🖨️ IMPRIMIENDO: ${item.serial_number}`);
        
        await PrintService.print(item);
        
        setTimeout(() => {
          setStatus('idle');
          setMessage('🟢 LISTO PARA BÚSQUEDA GLOBAL');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(`❌ NO ENCONTRADO`);
        setLocalError(`La serie "${serie}" no existe en el sistema.`);
        setTimeout(() => {
          setStatus('idle');
          setMessage('🟢 LISTO PARA BÚSQUEDA GLOBAL');
          setLocalError(null);
        }, 4000);
      }
    } catch (error: any) {
      setStatus('error');
      setLocalError(error.message);
      setMessage(`❌ ERROR DE BÚSQUEDA`);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="yellow" underline>🔍 IMPRESIÓN POR SERIE (BÚSQUEDA GLOBAL)</Text>
      
      <Box marginTop={1} paddingX={1}>
        <Text color="white" bold backgroundColor={status === 'error' ? 'red' : status === 'success' ? 'green' : 'blue'}>
          {message}
        </Text>
      </Box>

      {localError && (
        <Box marginTop={1} paddingX={1} borderStyle="single" borderColor="red">
          <Text color="red" bold>AVISO: </Text>
          <Text color="white">{localError}</Text>
        </Box>
      )}

      <Box marginTop={1} borderStyle="single" paddingX={1} borderColor={isActive ? 'yellow' : 'gray'}>
        <Text>Serie a buscar: </Text>
        <Text color="yellow" bold>{scanBuffer}</Text>
        <Text color="white" backgroundColor="white">{isActive ? ' ' : ''}</Text>
      </Box>

      {lastItem && (
        <Box marginTop={1} flexDirection="column" borderStyle="double" paddingX={1} borderColor="cyan">
          <Text bold color="cyan">✨ RESULTADO ENCONTRADO:</Text>
          <Text>Serie: {lastItem.serial_number}</Text>
          <Text>Equipo: {lastItem.details?.brand} {lastItem.details?.model}</Text>
          <Text>Sucursal: {AuthService.getBranchId()}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor italic>ESC: Volver al menú principal | Pistolee el código de barras</Text>
      </Box>
    </Box>
  );
};

import { AuthService } from '../../services/auth.service.js';
