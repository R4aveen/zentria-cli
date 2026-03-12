import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';

export type CertStatus = 'checking' | 'installed' | 'installing' | 'success' | 'error' | 'skipped';

export class CertificateService {
  private static CERT_NAME = 'ZentriaCLI';

  /** Returns true if running as a SEA executable (has embedded cert) */
  static isSeaBuild(): boolean {
    return !!process.env['ZENTRIA_CER_PATH'];
  }

  /** Check if the ZentriaCLI certificate is already trusted in LocalMachine\Root */
  static check(): Promise<boolean> {
    return new Promise((resolve) => {
      const ps = `
        $found = Get-ChildItem -Path Cert:\\LocalMachine\\Root | Where-Object { $_.Subject -eq 'CN=${this.CERT_NAME}' } | Select-Object -First 1;
        if ($found) { Write-Output 'FOUND' } else { Write-Output 'NOT_FOUND' }
      `.trim();

      exec(`powershell -NoProfile -Command "${ps}"`, { timeout: 10000 }, (err, stdout) => {
        if (err) {
          resolve(false);
          return;
        }
        resolve(stdout.trim().includes('FOUND'));
      });
    });
  }

  /** Install the embedded certificate into Trusted Root via UAC elevation */
  static install(): Promise<{ ok: boolean; message: string }> {
    const cerPath = process.env['ZENTRIA_CER_PATH'];
    if (!cerPath || !existsSync(cerPath)) {
      return Promise.resolve({ ok: false, message: 'Certificado embebido no encontrado.' });
    }

    return new Promise((resolve) => {
      // Use Start-Process -Verb RunAs to trigger UAC prompt
      // certutil installs the cert into Trusted Root CA store
      const ps = [
        `$cerPath = '${cerPath.replace(/'/g, "''")}'`,
        `$proc = Start-Process -FilePath 'certutil' -ArgumentList '-addstore','-f','Root',$cerPath -Verb RunAs -Wait -PassThru -WindowStyle Hidden`,
        `if ($proc.ExitCode -eq 0) { Write-Output 'OK' } else { Write-Output 'FAIL' }`,
      ].join('; ');

      exec(`powershell -NoProfile -Command "${ps}"`, { timeout: 60000 }, (err, stdout) => {
        if (err) {
          // User might have cancelled UAC
          resolve({ ok: false, message: 'Permisos de administrador requeridos. Inténtalo de nuevo.' });
          return;
        }
        if (stdout.trim().includes('OK')) {
          resolve({ ok: true, message: 'Certificado instalado correctamente.' });
        } else {
          resolve({ ok: false, message: 'Error al instalar el certificado.' });
        }
      });
    });
  }
}
