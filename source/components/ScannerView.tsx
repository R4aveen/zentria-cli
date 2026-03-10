import React, { useState } from 'react';
import { Text, Box, useInput } from 'ink';
import { ApiService } from '../services/api.service.js';
import { PrintService } from '../services/print.service.js';
import { TechnicalItem } from '../types/api.types.js';

export const ScannerView: React.FC = () => {
  const [scanBuffer, setScanBuffer] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('🟢 LISTO PARA ESCANEAR');
  const [lastItem, setLastItem] = useState<TechnicalItem | null>(null);
  const [cursor, setCursor] = useState(true);

  // Blinking effect for the cursor
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCursor((prev) => !prev);
    }, 500);
    return () => clearInterval(interval);
  }, []);

  useInput((input, key) => {
    if (status === 'loading') return;

    if (key.return) {
      if (scanBuffer.length > 0) {
        handleScan(scanBuffer);
        setScanBuffer('');
      }
    } else if (key.backspace) {
      setScanBuffer((prev) => prev.slice(0, -1));
    } else if (input) {
      setScanBuffer((prev) => prev + input);
    }
  });

  const handleScan = async (code: string) => {
    setStatus('loading');
    setMessage(`🔍 BUSCANDO: ${code}...`);
    try {
      const items = await ApiService.fetchItem(code);
      if (items && items.length > 0) {
        const item = items[0]!;
        setLastItem(item);
        setStatus('success');
        setMessage(`🖨️ IMPRIMIENDO: ${item.serial_number}`);
        
        await PrintService.print(item);
        
        setTimeout(() => {
          setStatus('idle');
          setMessage('🟢 LISTO PARA ESCANEAR');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(`❌ NO ENCONTRADO: ${code}`);
        setTimeout(() => {
          setStatus('idle');
          setMessage('🟢 LISTO PARA ESCANEAR');
        }, 3000);
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(`❌ ERROR: ${error.message}`);
      setTimeout(() => {
        setStatus('idle');
        setMessage('🟢 LISTO PARA ESCANEAR');
      }, 4000);
    }
  };

  return (
    <Box flexDirection="column" padding={1} borderStyle="round" borderColor="green">
      <Text bold color="green">ZENTRIA CLI - REVISIÓN TÉCNICA</Text>
      
      <Box marginTop={1} paddingX={1}>
        <Text color="white" bold backgroundColor={status === 'error' ? 'red' : status === 'success' ? 'green' : 'blue'}>
          {message}
        </Text>
      </Box>

      <Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
        <Text>Código: </Text>
        <Text color="yellow" bold>{scanBuffer}</Text>
        <Text backgroundColor="white" color="white">{cursor ? ' ' : ''}</Text>
      </Box>

      {lastItem && (
        <Box marginTop={1} flexDirection="column" borderStyle="double" paddingX={1} borderColor="cyan">
          <Text bold color="cyan">ÚLTIMO ESCANEADO:</Text>
          <Text>Serie: {lastItem.serial_number}</Text>
          <Text>Equipo: {lastItem.details?.brand} {lastItem.details?.model}</Text>
          <Text>Grado: {lastItem.grade?.label || lastItem.grade}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor italic>El escáner actúa como teclado + Enter automático.</Text>
      </Box>
      <Box>
        <Text dimColor italic>Presione ESC para salir del sistema.</Text>
      </Box>
    </Box>
  );
};
