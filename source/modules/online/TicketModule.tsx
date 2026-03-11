import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { ApiService } from '../../services/api.service.js';
import { Menu, MenuItem } from '../../components/common/Menu.js';
import { TechnicalItem } from '../../types/api.types.js';
import { PrintService } from '../../services/print.service.js';

interface OnlineTicketModuleProps {
  isActive?: boolean;
}

export const OnlineTicketModule: React.FC<OnlineTicketModuleProps> = ({ isActive = true }) => {
  const [view, setView] = useState<'batches' | 'scanner'>('batches');
  const [batches, setBatches] = useState<any[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        <Text color="yellow">⏳ Cargando lotes de revisión técnica...</Text>
      </Box>
    );
    
    if (error) return (
      <Box flexDirection="column" padding={1} borderStyle="single" borderColor="red">
        <Text color="red" bold>❌ ERROR CRÍTICO:</Text>
        <Text color="white">{error}</Text>
        <Box marginTop={1}>
          <Text dimColor>Presione ESC para volver al menú principal</Text>
        </Box>
      </Box>
    );

    const menuItems: MenuItem[] = batches.map(b => ({
      label: `📦 LOTE #${b.id} | ${b.customer_supplier?.name || 'S/N'} (${b.items_count || 0} items)`,
      value: String(b.id)
    }));

    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="green" underline>📋 SELECCIONE LOTE DE REVISIÓN</Text>
        <Menu items={menuItems} onSelect={handleBatchSelect} isActive={isActive} />
        {isActive && (
          <Box marginTop={1}>
            <Text dimColor italic>ESC: Volver al menú | ↑ ↓: Navegar | ENTER: Seleccionar</Text>
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
  const [message, setMessage] = useState('🟢 LISTO PARA ESCANEAR');
  const [lastItem, setLastItem] = useState<TechnicalItem | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

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
    setMessage(`🔍 BUSCANDO: ${code}...`);
    try {
      // FIX: Pasamos batchId Y el código escaneado
      const items = await ApiService.fetchItem(batchId, code);
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
        setMessage(`❌ NO ENCONTRADO EN ESTE LOTE`);
        setLocalError(`La serie "${code}" no pertenece al lote #${batchId}.`);
        setTimeout(() => {
          setStatus('idle');
          setMessage('🟢 LISTO PARA ESCANEAR');
          setLocalError(null);
        }, 3000);
      }
    } catch (error: any) {
      setStatus('error');
      setLocalError(error.message);
      setMessage(`❌ ERROR DE SERVIDOR`);
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan" underline>📟 MODO ESCÁNER - LOTE #{batchId}</Text>
      
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
        <Text>Código: </Text>
        <Text color="yellow" bold>{scanBuffer}</Text>
        <Text color="white" backgroundColor="white">{isActive ? ' ' : ''}</Text>
      </Box>

      {lastItem && (
        <Box marginTop={1} flexDirection="column" borderStyle="double" paddingX={1} borderColor="cyan">
          <Text bold color="cyan">✅ ÚLTIMO ESCANEADO:</Text>
          <Text>Serie: {lastItem.serial_number}</Text>
          <Text>Equipo: {lastItem.details?.brand} {lastItem.details?.model}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor italic>Presione ESC para volver a la lista de lotes</Text>
      </Box>
    </Box>
  );
};
