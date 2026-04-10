import React, { useState } from 'react';
import { Box, useInput } from 'ink';
import { GenerateQrForm } from './components/GenerateQrForm.js';
import { GenerateQrResult } from './components/GenerateQrResult.js';
import { pickLogoFileNative } from './services/native-file-picker.service.js';
import { generateQrImage } from './services/qr-generator.service.js';
import { GenerateQrResult as ResultType, QrFormFocus } from './types.js';

interface GenerateQrModuleProps {
  isActive?: boolean;
  onExit: () => void;
}

const nextFocus = (focus: QrFormFocus): QrFormFocus => {
  if (focus === 'content') return 'fileName';
  if (focus === 'fileName') return 'logo';
  if (focus === 'logo') return 'submit';
  return 'content';
};

const prevFocus = (focus: QrFormFocus): QrFormFocus => {
  if (focus === 'content') return 'submit';
  if (focus === 'submit') return 'logo';
  if (focus === 'logo') return 'fileName';
  return 'content';
};

export const GenerateQrModule: React.FC<GenerateQrModuleProps> = ({
  isActive = true,
  onExit,
}) => {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('qr_zentria');
  const [logoPath, setLogoPath] = useState('');
  const [focus, setFocus] = useState<QrFormFocus>('content');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<ResultType | undefined>();

  const handlePickLogo = () => {
    if (isLoading) return;

    const selected = pickLogoFileNative();
    if (selected) {
      setLogoPath(selected);
      setError('');
    }
  };

  const handleGenerate = async () => {
    if (isLoading) return;
    if (!content.trim()) {
      setError('Debes ingresar el texto que contendrá el QR.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const generated = await generateQrImage({
        content: content.trim(),
        fileName: fileName.trim() || 'qr_zentria',
        logoPath: logoPath.trim() || undefined,
      });
      setResult(generated);
    } catch (generationError: any) {
      setError(generationError?.message || 'No se pudo generar el QR.');
    } finally {
      setIsLoading(false);
    }
  };

  useInput((input, key) => {
    if (!isActive) return;

    if (key.escape) {
      if (isLoading) return;
      onExit();
      return;
    }

    if (result) {
      if (key.return) {
        setResult(undefined);
        setContent('');
        setFileName('qr_zentria');
        setLogoPath('');
        setError('');
        setFocus('content');
      }
      return;
    }

    if (key.tab || key.downArrow) {
      setFocus(current => nextFocus(current));
      return;
    }

    if (key.upArrow) {
      setFocus(current => prevFocus(current));
      return;
    }

    if (input.toLowerCase() === 'f' || (focus === 'logo' && key.return)) {
      handlePickLogo();
      return;
    }

    if (input.toLowerCase() === 'g' || (focus === 'submit' && key.return)) {
      void handleGenerate();
    }
  });

  return (
    <Box width="100%" justifyContent="center" alignItems="center" flexGrow={1}>
      {result ? (
        <GenerateQrResult result={result} />
      ) : (
        <GenerateQrForm
          content={content}
          fileName={fileName}
          logoPath={logoPath}
          focus={focus}
          isLoading={isLoading}
          error={error}
          onContentChange={setContent}
          onFileNameChange={setFileName}
        />
      )}
    </Box>
  );
};
