import type React from 'react';

export interface GenerateQrModuleProps {
  isActive?: boolean;
  onExit: () => void;
}

export const GenerateQrModule: React.FC<GenerateQrModuleProps>;
