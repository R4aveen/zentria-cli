import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ApiService } from '../../services/api.service.js';
import { Menu, MenuItem } from '../../components/common/Menu.js';
import { TechnicalItem } from '../../types/api.types.js';
import { PrintService } from '../../services/print.service.js';
import { useTheme } from '../../contexts/ThemeContext.js';

interface OnlineTicketModuleProps {
  isActive?: boolean;
}

export const OnlineTicketModule: React.FC<OnlineTicketModuleProps> = ({ isActive = true }) => {
  const [view, setView] = useState<'batches' | 'scanner'>('batches');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (view === 'batches') {
      loadBatches();
    }
  }, [view]);

  const loadBatches = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await ApiService.fetchBatches();
      const list = data.data || data;
      setBatches(Array.isArray(list) ? list : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBatchSelect = (item: MenuItem) => {
    if (!isActive) return;
    setSelectedBatchId(item.value);
    setView('scanner');
  };

  if (view === 'batches') {
    if (loading) return (
      <Box padding={1}>
        <Text color={theme.secondary}>☕︎ Cargando lotes de revisión técnica...</Text>
      </Box>
    );
    
    if (error) return (
      <Box flexDirection="column" padding={1} borderStyle="single" borderColor={theme.error}>
        <Text color={theme.errorText} bold>☾ ERROR CRÍTICO:</Text>
        <Text color="white">{error}</Text>
        <Box marginTop={1}>
          <Text dimColor>Presione ESC para volver al menú principal</Text>
        </Box>
      </Box>
    );

    const menuItems: MenuItem[] = batches.map(b => ({
      label: `✧ LOTE #${b.id} | ${b.customer_supplier?.name || 'S/N'} (${b.received_quantity || 0} items de ${b.expected_quantity || 0})`,
      value: String(b.id)
    }));

    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={theme.primary} underline>₊˚ෆ SELECCIONE LOTE DE REVISIÓN</Text>
        <Menu items={menuItems} onSelect={handleBatchSelect} isActive={isActive} />
        {isActive && (
          <Box marginTop={1}>
            <Text color={theme.textDim} italic>╰┈➤ ESC: Volver ⋆ ↑↓ Navegar ⋆ ENTER Seleccionar</Text>
          </Box>
        )}
      </Box>
    );
  }

  return (
    <ScannerView 
      batchId={selectedBatchId!} 
      onBack={() => setView('batches')} 
      isActive={isActive} 
    />
  );
};

interface ScannerViewProps {
  batchId: string;
  onBack: () => void;
  isActive: boolean;
}

const ScannerView: React.FC<ScannerViewProps> = ({ batchId, onBack, isActive }) => {
  const [scanBuffer, setScanBuffer] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('⋆ LISTO PARA ESCANEAR');
  const [lastItem, setLastItem] = useState<TechnicalItem | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { theme } = useTheme();

  useInput((input, key) => {
    if (!isActive) return;
    if (key.escape) onBack();
    if (status === 'loading') return;

    if (key.return) {
      if (scanBuffer.length > 0) {
        handleScan(scanBuffer);
        setScanBuffer('');
      }
    } else if (key.backspace) {
      setScanBuffer((prev) => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setScanBuffer((prev) => prev + input);
    }
  });

  const handleScan = async (code: string) => {
    setStatus('loading');
    setLocalError(null);
    setMessage(`☕︎ BUSCANDO: ${code}...`);
    try {
      // FIX: Pasamos batchId Y el código escaneado
      const items = await ApiService.fetchItem(batchId, code);
      if (items && items.length > 0) {
        const item = items[0]!;
        setLastItem(item);
        setStatus('success');
        setMessage(`₊˚ෆ IMPRIMIENDO: ${item.serial_number}`);
        
        await PrintService.print(item);
        
        setTimeout(() => {
          setStatus('idle');
          setMessage('⋆ LISTO PARA ESCANEAR');
        }, 2000);
      } else {
        setStatus('error');
        setMessage(`☾ NO ENCONTRADO EN ESTE LOTE`);
        setLocalError(`La serie "${code}" no pertenece al lote #${batchId}.`);
        setTimeout(() => {
          setStatus('idle');
          setMessage('⋆ LISTO PARA ESCANEAR');
          setLocalError(null);
        }, 3000);
      }
    } catch (error: any) {
      setStatus('error');
      setLocalError(error.message);
      setMessage(`☾ ERROR DE SERVIDOR`);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={theme.primary} underline>⋆ MODO ESCÁNER ⋆ LOTE #{batchId}</Text>
      
      <Box marginTop={1} paddingX={1}>
        <Text color="white" bold backgroundColor={status === 'error' ? theme.error : status === 'success' ? theme.success : theme.modeBadgeOnline}>
          {message}
        </Text>
      </Box>

      {localError && (
        <Box marginTop={1} paddingX={1} borderStyle="single" borderColor={theme.error}>
          <Text color={theme.errorText} bold>☾ </Text>
          <Text color="white">{localError}</Text>
        </Box>
      )}

      <Box marginTop={1} borderStyle="single" paddingX={1} borderColor={isActive ? theme.borderActive : 'gray'}>
        <Text color={theme.text}>Código: </Text>
        <Text color={theme.primary} bold>{scanBuffer}</Text>
        <Text color="white" backgroundColor="white">{isActive ? ' ' : ''}</Text>
      </Box>

      {lastItem && (
        <Box marginTop={1} flexDirection="column" borderStyle="double" paddingX={1} borderColor={theme.accent}>
          <Text bold color={theme.primary}>✴︎ ÚLTIMO ESCANEADO:</Text>
          <Text color={theme.text}>╰┈➤ Serie: {lastItem.serial_number}</Text>
          <Text color={theme.text}>╰┈┈┈┈┈┈➤ Equipo: {lastItem.details?.brand} {lastItem.details?.model}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={theme.textDim} italic>╰┈➤ ESC: Volver a la lista de lotes</Text>
      </Box>
    </Box>
  );
};
