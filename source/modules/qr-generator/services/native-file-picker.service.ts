import { execFileSync } from 'node:child_process';

const windir = process.env['WINDIR'];

const WINDOWS_POWERSHELL_EXE = windir
  ? `${windir}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`
  : 'powershell.exe';

export const pickLogoFileNative = (): string | undefined => {
  if (process.platform !== 'win32') {
    return undefined;
  }

  const command = [
    'Add-Type -AssemblyName System.Windows.Forms',
    "$dialog = New-Object System.Windows.Forms.OpenFileDialog",
    "$dialog.Title = 'Selecciona un logo para el QR'",
    "$dialog.Filter = 'Imagenes|*.png;*.jpg;*.jpeg;*.webp;*.bmp'",
    '$dialog.Multiselect = $false',
    'if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write($dialog.FileName) }',
  ].join('; ');

  try {
    const selected = execFileSync(
      WINDOWS_POWERSHELL_EXE,
      ['-NoProfile', '-STA', '-ExecutionPolicy', 'Bypass', '-Command', command],
      { encoding: 'utf8' },
    ).trim();

    return selected || undefined;
  } catch {
    return undefined;
  }
};
