import React, { useState, useRef, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import { ApiService } from '../../services/api.service.js';
import { TechnicalItem } from '../../types/api.types.js';
import { PrintService } from '../../services/print.service.js';
import { AuthService } from '../../services/auth.service.js';
import { Menu, MenuItem } from '../../components/common/Menu.js';
import { useTheme } from '../../contexts/ThemeContext.js';

type ScannerMode = 'fast' | 'controlled';
type ModulePhase = 'mode-select' | 'scanning';

interface GlobalScannerModuleProps {
  isActive?: boolean;
  onExit?: () => void;
}

export const GlobalScannerModule: React.FC<GlobalScannerModuleProps> = ({ isActive = true, onExit }) => {
  const [phase, setPhase] = useState<ModulePhase>('mode-select');
  const [scannerMode, setScannerMode] = useState<ScannerMode>('controlled');
  const { theme } = useTheme();

  useInput((_input, key) => {
    if (!isActive) return;
    if (phase === 'mode-select' && key.escape) {
      onExit?.();
    }
  });

  const modeItems: MenuItem[] = [
    { label: '✧ Modo Rápido (Pistola - impresión automática)', value: 'fast' },
    { label: '⋆ Modo Controlado (Manual - Enter para imprimir)', value: 'controlled' },
  ];

  const handleModeSelect = (item: MenuItem) => {
    setScannerMode(item.value as ScannerMode);
    setPhase('scanning');
  };

  if (phase === 'mode-select') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color={theme.primary} underline>⋆ IMPRESIÓN POR SERIE (BÚSQUEDA GLOBAL)</Text>
        <Menu items={modeItems} onSelect={handleModeSelect} title="Seleccione modo de escaneo:" isActive={isActive} />
        <Box marginTop={1}>
          <Text color={theme.textDim} italic>☾ ESC: Volver al menú</Text>
        </Box>
      </Box>
    );
  }

  return scannerMode === 'fast'
    ? <FastScanner isActive={isActive} onBack={() => setPhase('mode-select')} />
    : <ControlledScanner isActive={isActive} onBack={() => setPhase('mode-select')} />;
};

// ============================================================
// MODO RÁPIDO - Auto-impresión con pistola, anti-duplicado
// ============================================================
const FastScanner: React.FC<{ isActive: boolean; onBack: () => void }> = ({ isActive, onBack }) => {
  const [scanBuffer, setScanBuffer] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('✧ MODO RÁPIDO - Escanee con la pistola');
  const [lastItem, setLastItem] = useState<TechnicalItem | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [printedCount, setPrintedCount] = useState(0);
  const printedSerials = useRef<Set<string>>(new Set());
  const isProcessing = useRef(false);
  const { theme } = useTheme();

  const handleFastPrint = useCallback(async (serie: string) => {
    const trimmed = serie.trim();
    if (!trimmed || isProcessing.current) return;

    // Anti-duplicado: si ya se imprimió, ignorar
    if (printedSerials.current.has(trimmed)) {
      setStatus('error');
      setMessage(`☁︎ YA IMPRESO: ${trimmed}`);
      setLocalError(`La serie "${trimmed}" ya fue impresa en esta sesión.`);
      setTimeout(() => {
        setStatus('idle');
        setMessage('✧ MODO RÁPIDO - Escanee con la pistola');
        setLocalError(null);
      }, 2000);
      return;
    }

    isProcessing.current = true;
    setStatus('loading');
    setLocalError(null);
    setMessage(`☕︎ BUSCANDO: ${trimmed}...`);

    try {
      const items = await ApiService.fetchGlobalItems(trimmed);
      if (items && items.length > 0) {
        const item = items[0]!;
        setLastItem(item);
        setStatus('success');
        setMessage(`₊˚ෆ IMPRIMIENDO: ${item.serial_number}`);
        await PrintService.print(item);
        printedSerials.current.add(trimmed);
        setPrintedCount(prev => prev + 1);

        setTimeout(() => {
          setStatus('idle');
          setMessage('✧ MODO RÁPIDO - Escanee con la pistola');
        }, 1500);
      } else {
        setStatus('error');
        setMessage('☾ NO ENCONTRADO');
        setLocalError(`La serie "${trimmed}" no existe en el sistema.`);
        setTimeout(() => {
          setStatus('idle');
          setMessage('✧ MODO RÁPIDO - Escanee con la pistola');
          setLocalError(null);
        }, 3000);
      }
    } catch (error: any) {
      setStatus('error');
      setLocalError(error.message);
      setMessage('☾ ERROR DE BÚSQUEDA');
      setTimeout(() => {
        setStatus('idle');
        setMessage('✧ MODO RÁPIDO - Escanee con la pistola');
        setLocalError(null);
      }, 3000);
    } finally {
      isProcessing.current = false;
    }
  }, []);

  useInput((input, key) => {
    if (!isActive) return;

    if (key.escape) {
      onBack();
      return;
    }

    if (isProcessing.current || status === 'loading') return;

    // La pistola envía los caracteres y al final un Enter (\r)
    if (key.return) {
      if (scanBuffer.length > 0) {
        const serie = scanBuffer;
        setScanBuffer('');
        handleFastPrint(serie);
      }
      return;
    }

    if (key.backspace) {
      setScanBuffer(prev => prev.slice(0, -1));
      return;
    }

    if (input && !key.ctrl && !key.meta && !key.tab) {
      setScanBuffer(prev => prev + input);
    }
  });

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={theme.primary} underline>𖤐 MODO RÁPIDO ✴︎ IMPRESIÓN AUTOMÁTICA</Text>

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
        <Text color={theme.text}>Escaneando: </Text>
        <Text color={theme.primary} bold>{scanBuffer}</Text>
        <Text color="white" backgroundColor="white">{isActive ? ' ' : ''}</Text>
      </Box>

      <Box marginTop={1} paddingX={1}>
        <Text color={theme.accent} bold>⋆ Etiquetas impresas: {printedCount}</Text>
      </Box>

      {lastItem && (
        <Box marginTop={1} flexDirection="column" borderStyle="double" paddingX={1} borderColor={theme.accent}>
          <Text bold color={theme.primary}>✴︎ ÚLTIMO IMPRESO:</Text>
          <Text color={theme.text}>╰┈➤ Serie: {lastItem.serial_number}</Text>
          <Text color={theme.text}>╰┈┈┈┈┈┈➤ Equipo: {lastItem.details?.brand} {lastItem.details?.model}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={theme.textDim} italic>
          ╰┈➤ ESC: Cambiar modo ⋆ La pistola imprime automáticamente
        </Text>
      </Box>
    </Box>
  );
};

// ============================================================
// MODO CONTROLADO - Comportamiento original con Enter
// ============================================================
const ControlledScanner: React.FC<{ isActive: boolean; onBack: () => void }> = ({ isActive, onBack }) => {
  const [scanBuffer, setScanBuffer] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('⋆ LISTO PARA BÚSQUEDA GLOBAL');
  const [lastItem, setLastItem] = useState<TechnicalItem | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const { theme } = useTheme();

  useInput((input, key) => {
    if (!isActive) return;
    if (status === 'loading') return;

    if (key.escape) {
      onBack();
      return;
    }

    const isCtrlI = (key.ctrl && (input === 'i' || input === 'I')) || key.tab || input === '\t' || input === '\u0009';

    if (isCtrlI) {
      if (scanBuffer.length > 0) {
        handleGlobalSearch(scanBuffer, true);
        setScanBuffer('');
      } else if (lastItem) {
        PrintService.openLabelInWord(lastItem);
      }
    } else if (key.return) {
      if (scanBuffer.length > 0) {
        handleGlobalSearch(scanBuffer);
        setScanBuffer('');
      }
    } else if (key.backspace) {
      setScanBuffer(prev => prev.slice(0, -1));
    } else if (input && !key.ctrl && !key.meta) {
      setScanBuffer(prev => prev + input);
    }
  });

  const handleGlobalSearch = async (serie: string, openInWord: boolean = false) => {
    setStatus('loading');
    setLocalError(null);
    setMessage(`☕︎ BUSCANDO SERIE: ${serie}...`);
    try {
      const items = await ApiService.fetchGlobalItems(serie);
      if (items && items.length > 0) {
        const item = items[0]!;
        setLastItem(item);

        if (openInWord) {
          setStatus('success');
          setMessage(`☁︎ ABRIENDO EN WORD: ${item.serial_number}`);
          await PrintService.openLabelInWord(item);
        } else {
          setStatus('success');
          setMessage(`₊˚ෆ IMPRIMIENDO: ${item.serial_number}`);
          await PrintService.print(item);
        }

        setTimeout(() => {
          setStatus('idle');
          setMessage('⋆ LISTO PARA BÚSQUEDA GLOBAL');
        }, 2000);
      } else {
        setStatus('error');
        setMessage('☾ NO ENCONTRADO');
        setLocalError(`La serie "${serie}" no existe en el sistema.`);
        setTimeout(() => {
          setStatus('idle');
          setMessage('⋆ LISTO PARA BÚSQUEDA GLOBAL');
          setLocalError(null);
        }, 4000);
      }
    } catch (error: any) {
      setStatus('error');
      setLocalError(error.message);
      setMessage('☾ ERROR DE BÚSQUEDA');
    }
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color={theme.primary} underline>𖤐 MODO CONTROLADO ✴︎ BÚSQUEDA GLOBAL</Text>

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
        <Text color={theme.text}>Serie a buscar: </Text>
        <Text color={theme.primary} bold>{scanBuffer}</Text>
        <Text color="white" backgroundColor="white">{isActive ? ' ' : ''}</Text>
      </Box>

      {lastItem && (
        <Box marginTop={1} flexDirection="column" borderStyle="double" paddingX={1} borderColor={theme.accent}>
          <Text bold color={theme.primary}>✴︎ RESULTADO ENCONTRADO:</Text>
          <Text color={theme.text}>╰┈➤ Serie: {lastItem.serial_number}</Text>
          <Text color={theme.text}>╰┈➤ Equipo: {lastItem.details?.brand} {lastItem.details?.model}</Text>
          <Text color={theme.text}>╰┈┈┈┈┈┈➤ Sucursal: {AuthService.getBranchId()}</Text>
        </Box>
      )}

      <Box marginTop={1}>
        <Text color={theme.textDim} italic>
          ╰┈➤ ESC: Cambiar modo ⋆ ENTER: Imprimir ⋆ CTRL+I: Word
        </Text>
      </Box>
    </Box>
  );
};
