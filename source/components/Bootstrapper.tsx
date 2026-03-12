import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { CertificateService, type CertStatus } from '../services/certificate.service.js';

const SPINNER_FRAMES = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

interface BootstrapperProps {
  onReady: () => void;
}

export const Bootstrapper: React.FC<BootstrapperProps> = ({ onReady }) => {
  const [status, setStatus] = useState<CertStatus>('checking');
  const [message, setMessage] = useState('Verificando integridad del sistema...');
  const [errorMsg, setErrorMsg] = useState('');
  const [frame, setFrame] = useState(0);

  // Spinner animation
  useEffect(() => {
    if (status === 'installed' || status === 'success' || status === 'skipped') return;
    const timer = setInterval(() => setFrame((f) => (f + 1) % SPINNER_FRAMES.length), 80);
    return () => clearInterval(timer);
  }, [status]);

  // Certificate check & install flow
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Skip in dev mode (not a SEA build)
      if (!CertificateService.isSeaBuild()) {
        if (!cancelled) {
          setStatus('skipped');
          onReady();
        }
        return;
      }

      // Check if cert is already trusted
      const found = await CertificateService.check();
      if (cancelled) return;

      if (found) {
        setStatus('installed');
        onReady();
        return;
      }

      // Need to install
      setStatus('installing');
      setMessage('Configurando seguridad inicial. Por favor, acepta los permisos de Administrador...');

      const result = await CertificateService.install();
      if (cancelled) return;

      if (result.ok) {
        setStatus('success');
        setMessage('¡Configuración completada!');
        // Small delay so user sees the success message
        setTimeout(() => { if (!cancelled) onReady(); }, 800);
      } else {
        setStatus('error');
        setErrorMsg(result.message);
      }
    };

    run();
    return () => { cancelled = true; };
  }, []);

  // Don't render anything if skipped or already installed
  if (status === 'skipped' || status === 'installed') return null;

  return (
    <Box flexDirection="column" paddingX={2} paddingY={1}>
      <Box marginBottom={1}>
        <Text bold color="magenta"> ₊⊹ ࣪ ִֶָ☾. ZENTRIA CLI ✴︎ </Text>
      </Box>

      {status === 'error' ? (
        <Box flexDirection="column">
          <Text color="red">  ✗ {errorMsg}</Text>
          <Box marginTop={1}>
            <Text dimColor>  Cierra y vuelve a abrir el programa para reintentar.</Text>
          </Box>
        </Box>
      ) : (
        <Box>
          <Text color="cyan">  {SPINNER_FRAMES[frame]} </Text>
          <Text color="white">{message}</Text>
          {status === 'success' && <Text color="green"> ✓</Text>}
        </Box>
      )}
    </Box>
  );
};
