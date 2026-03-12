import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import Conf from 'conf';

export type CertStatus = 'checking' | 'installed' | 'installing' | 'success' | 'error' | 'skipped';

const config = new Conf({ projectName: 'zentria-cli' });
const SETUP_DONE_KEY = 'security_setup_done';

export class CertificateService {
  private static CERT_NAME = 'ZentriaCLI';

  /** Returns true if running as a SEA executable (has embedded cert) */
  static isSeaBuild(): boolean {
    return !!process.env['ZENTRIA_CER_PATH'];
  }

  /** Returns true if setup was already completed (local flag) */
  static isSetupDone(): boolean {
    return config.get(SETUP_DONE_KEY) === true;
  }

  /** Mark setup as completed so we never check again */
  private static markSetupDone(): void {
    config.set(SETUP_DONE_KEY, true);
  }

  /** Check if certificate is trusted AND Defender exclusion exists */
  static check(): Promise<boolean> {
    return new Promise((resolve) => {
      const exePath = process.execPath;
      const ps = [
        `$cert = Get-ChildItem -Path Cert:\\LocalMachine\\Root | Where-Object { $_.Subject -eq 'CN=${this.CERT_NAME}' } | Select-Object -First 1`,
        `$excl = (Get-MpPreference).ExclusionPath -contains '${exePath.replace(/\\/g, '\\\\')}'`,
        `if ($cert -and $excl) { Write-Output 'OK' } else { Write-Output 'NEED' }`,
      ].join('; ');

      exec(`powershell -NoProfile -Command "${ps}"`, { timeout: 10000 }, (err, stdout) => {
        if (err) {
          resolve(false);
          return;
        }
        const ok = stdout.trim().includes('OK');
        if (ok) this.markSetupDone();
        resolve(ok);
      });
    });
  }

  /** Install cert + add Defender exclusion via a single UAC elevation */
  static install(): Promise<{ ok: boolean; message: string }> {
    const cerPath = process.env['ZENTRIA_CER_PATH'];
    if (!cerPath || !existsSync(cerPath)) {
      return Promise.resolve({ ok: false, message: 'Certificado embebido no encontrado.' });
    }

    const exePath = process.execPath;

    return new Promise((resolve) => {
      // Write a temp PS1 script that does everything elevated
      const scriptPath = join(tmpdir(), `zentria-setup-${process.pid}.ps1`);
      const script = [
        `# Instalar certificado en Trusted Root`,
        `certutil -addstore -f "Root" "${cerPath}"`,
        `if ($LASTEXITCODE -ne 0) { exit 1 }`,
        ``,
        `# Agregar exclusion de Windows Defender para el ejecutable`,
        `Add-MpPreference -ExclusionPath "${exePath}"`,
        ``,
        `exit 0`,
      ].join('\r\n');
      writeFileSync(scriptPath, script, 'utf-8');

      const ps = [
        `$proc = Start-Process -FilePath 'powershell' -ArgumentList '-NoProfile','-ExecutionPolicy','Bypass','-File','${scriptPath}' -Verb RunAs -Wait -PassThru -WindowStyle Hidden`,
        `Remove-Item '${scriptPath}' -Force -ErrorAction SilentlyContinue`,
        `if ($proc.ExitCode -eq 0) { Write-Output 'OK' } else { Write-Output 'FAIL' }`,
      ].join('; ');

      exec(`powershell -NoProfile -Command "${ps}"`, { timeout: 60000 }, (err, stdout) => {
        try { unlinkSync(scriptPath); } catch {}
        if (err) {
          resolve({ ok: false, message: 'Permisos de administrador requeridos. Inténtalo de nuevo.' });
          return;
        }
        if (stdout.trim().includes('OK')) {
          this.markSetupDone();
          resolve({ ok: true, message: 'Configuración de seguridad completada.' });
        } else {
          resolve({ ok: false, message: 'Error en la configuración. Ejecuta como administrador.' });
        }
      });
    });
  }
}
