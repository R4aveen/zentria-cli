#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, renameSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';
import * as ResEdit from 'resedit';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BUILD_DIR = join(ROOT, 'build');
const BUNDLE = join(BUILD_DIR, 'bundle.mjs');
const ENTRY = join(ROOT, 'scripts', 'sea-entry.cjs');
const BLOB = join(BUILD_DIR, 'sea-prep.blob');
const EXE = join(BUILD_DIR, 'zentria-cli.exe');
const SEA_CONFIG = join(BUILD_DIR, 'sea-config.json');
const ICO_PATH = join(ROOT, 'public', 'favicon.ico');
const CER_PATH = join(BUILD_DIR, 'ZentriaCertificado.cer');

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
const VERSION = pkg.version;

if (!existsSync(BUILD_DIR)) mkdirSync(BUILD_DIR, { recursive: true });

// Leer variables de .env.production para inyectarlas en build-time
const envProdPath = join(ROOT, '.env.production');
const envVars = { NODE_ENV: 'production' };
if (existsSync(envProdPath)) {
  const envContent = readFileSync(envProdPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim();
    envVars[key] = value;
  }
  console.log('\n✧ Variables de .env.production:', Object.keys(envVars).join(', '));
} else {
  console.warn('\n⚠ No se encontró .env.production, usando valores por defecto');
}

// Plugin que reemplaza process.env['KEY'] (bracket notation) con valores de producción
const envPlugin = {
  name: 'inject-env',
  setup(build) {
    build.onLoad({ filter: /\.(ts|tsx|js|mjs)$/ }, async (args) => {
      if (args.path.includes('node_modules')) return undefined;
      let contents = readFileSync(args.path, 'utf-8');
      let modified = false;
      for (const [key, value] of Object.entries(envVars)) {
        const pattern1 = `process.env['${key}']`;
        const pattern2 = `process.env["${key}"]`;
        if (contents.includes(pattern1)) {
          contents = contents.replaceAll(pattern1, JSON.stringify(value));
          modified = true;
        }
        if (contents.includes(pattern2)) {
          contents = contents.replaceAll(pattern2, JSON.stringify(value));
          modified = true;
        }
      }
      if (modified) {
        const loader = args.path.endsWith('.tsx') ? 'tsx' : args.path.endsWith('.ts') ? 'ts' : 'js';
        return { contents, loader };
      }
      return undefined;
    });
  },
};

// 1. Bundle ESM con esbuild (modo producción + createRequire para Node builtins)
console.log('\n✧ Empaquetando con esbuild...');
await esbuild.build({
  entryPoints: ['source/cli.tsx'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: BUNDLE,
  jsx: 'automatic',
  define: {
    'process.env.NODE_ENV': '"production"',
  },
  banner: {
    js: "import{createRequire}from'node:module';const require=createRequire(import.meta.url);",
  },
  minify: true,
  plugins: [envPlugin, {
    name: 'stub-devtools',
    setup(build) {
      build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
        path: 'react-devtools-core',
        namespace: 'stub',
      }));
      build.onLoad({ filter: /.*/, namespace: 'stub' }, () => ({
        contents: 'export default undefined;',
        loader: 'js',
      }));
    },
  }],
});
console.log('  ✓ Bundle generado');

// 2. Exportar certificado para embeber como asset SEA
console.log('\n✧ Exportando certificado...');
{
  const certScriptPath = join(BUILD_DIR, '_export-cert.ps1');
  const certScript = [
    `$certName = 'ZentriaCLI'`,
    `$cert = Get-ChildItem -Path Cert:\\CurrentUser\\My -CodeSigningCert | Where-Object { $_.Subject -eq "CN=$certName" } | Select-Object -First 1`,
    `if (-not $cert) {`,
    `  Write-Host '  Creando certificado autofirmado...'`,
    `  $cert = New-SelfSignedCertificate -Subject "CN=$certName" -Type CodeSigningCert -CertStoreLocation Cert:\\CurrentUser\\My -NotAfter (Get-Date).AddYears(5)`,
    `}`,
    `Export-Certificate -Cert $cert -FilePath '${CER_PATH}' | Out-Null`,
    `Write-Host "  Thumbprint: $($cert.Thumbprint)"`,
  ].join('\n');
  writeFileSync(certScriptPath, certScript, 'utf-8');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${certScriptPath}"`, { stdio: 'inherit' });
  try { unlinkSync(certScriptPath); } catch {}
  console.log('  ✓ Certificado exportado → build/ZentriaCertificado.cer');
}

// 3. Generar configuración SEA (CJS wrapper + ESM bundle + certificado como assets)
console.log('\n✧ Configurando Node.js SEA...');
const seaConfig = {
  main: ENTRY,
  output: BLOB,
  disableExperimentalSEAWarning: true,
  useSnapshot: false,
  useCodeCache: true,
  assets: {
    'bundle.mjs': BUNDLE,
    'logo_etiqueta.png': join(ROOT, 'public', 'logo_etiqueta.png'),
    'yoga.wasm': join(ROOT, 'node_modules', 'yoga-wasm-web', 'dist', 'yoga.wasm'),
    'ZentriaCertificado.cer': CER_PATH,
  },
};
writeFileSync(SEA_CONFIG, JSON.stringify(seaConfig, null, 2));

// 4. Generar blob
console.log('\n✧ Generando blob SEA...');
execSync(`node --experimental-sea-config ${SEA_CONFIG}`, { stdio: 'inherit' });

// 5. Copiar node.exe como base del ejecutable
console.log('\n✧ Copiando runtime de Node.js...');
if (existsSync(EXE)) {
  try {
    unlinkSync(EXE);
  } catch {
    // Si no se puede eliminar, renombrar para desbloquearlo
    const old = EXE + '.old';
    try { unlinkSync(old); } catch {}
    renameSync(EXE, old);
    console.log('  ⚠ Ejecutable anterior estaba bloqueado, renombrado a .old');
  }
}
copyFileSync(process.execPath, EXE);

// 6. Inyectar blob en el ejecutable PRIMERO
console.log('\n✧ Inyectando aplicación en ejecutable...');
execSync([
  `npx postject "${EXE}" NODE_SEA_BLOB "${BLOB}"`,
  '--sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  '--overwrite',
].join(' '), { stdio: 'inherit' });

// 7. Aplicar icono y metadatos con resedit DESPUÉS
console.log('\n✧ Aplicando icono y metadatos...');
{
  const exeData = readFileSync(EXE);
  const exe = ResEdit.NtExecutable.from(exeData, { ignoreCert: true });
  const res = ResEdit.NtExecutableResource.from(exe);

  // Icono
  const icoData = readFileSync(ICO_PATH);
  const iconFile = ResEdit.Data.IconFile.from(icoData);
  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries, 1, 1033,
    iconFile.icons.map(i => i.data),
  );

  // Metadatos de versión
  const viEntries = ResEdit.Resource.VersionInfo.fromEntries(res.entries);
  const vi = viEntries[0] || ResEdit.Resource.VersionInfo.createEmpty();
  const vParts = VERSION.split('.').map(Number);
  vi.setFileVersion(vParts[0] || 0, vParts[1] || 0, vParts[2] || 0, 0);
  vi.setProductVersion(vParts[0] || 0, vParts[1] || 0, vParts[2] || 0, 0);
  vi.setStringValues({
    lang: 1033,
    codepage: 1200,
  }, {
    ProductName: 'Zentria CLI',
    FileDescription: 'Zentria CLI - Revisión Técnica en Bodega',
    CompanyName: 'Zentria',
    LegalCopyright: 'Zentria © 2026',
    OriginalFilename: 'zentria-cli.exe',
    FileVersion: VERSION,
    ProductVersion: VERSION,
  });
  vi.outputToResourceEntries(res.entries);

  res.outputResource(exe);
  writeFileSync(EXE, Buffer.from(exe.generate()));
  console.log('  ✓ Icono y metadatos aplicados');
}

// 8. Firmar ejecutable con certificado autofirmado
console.log('\n✧ Firmando ejecutable...');

try {
  const signScriptPath = join(BUILD_DIR, '_sign.ps1');
  const signScript = [
    `$certName = 'ZentriaCLI'`,
    `$cert = Get-ChildItem -Path Cert:\\CurrentUser\\My -CodeSigningCert | Where-Object { $_.Subject -eq "CN=$certName" } | Select-Object -First 1`,
    `if (-not $cert) { throw 'Certificado no encontrado. Ejecuta el build completo.' }`,
    `Set-AuthenticodeSignature -FilePath '${EXE}' -Certificate $cert | Out-Null`,
    `$sig = Get-AuthenticodeSignature -FilePath '${EXE}'`,
    `Write-Host "  Status: $($sig.Status)"`,
  ].join('\n');
  writeFileSync(signScriptPath, signScript, 'utf-8');
  execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${signScriptPath}"`, { stdio: 'inherit' });
  try { unlinkSync(signScriptPath); } catch {}
  console.log('  ✓ Ejecutable firmado');
} catch (err) {
  console.warn('  ⚠ No se pudo firmar el ejecutable:', err.message);
  console.warn('    El .exe funcionará pero puede activar alertas de antivirus.');
}

console.log(`\n✴︎ Ejecutable generado → ${EXE}`);

// 9. Generar paquete de distribución (ZIP con .bat lanzador)
// SmartScreen NO bloquea archivos .bat ni .zip — solo .exe desconocidos
console.log('\n✧ Generando paquete de distribución...');
const DIST_ZIP = join(BUILD_DIR, `Zentria-CLI-v${VERSION}.zip`);
const INICIAR_BAT = join(BUILD_DIR, 'Iniciar Zentria.bat');

// 9a. Crear "Iniciar Zentria.bat" — instala cert + exclusión Defender + lanza el CLI
const iniciarContent = [
  '@echo off',
  'chcp 65001 >nul 2>&1',
  'title Zentria CLI',
  'color 0A',
  'echo.',
  'echo  ===================================================',
  'echo    ZENTRIA CLI - Iniciando...',
  'echo  ===================================================',
  'echo.',
  '',
  ':: Desbloquear archivos (quitar marca de internet/SmartScreen)',
  'powershell -NoProfile -Command "Get-ChildItem -Path \'%~dp0\' | Unblock-File" >nul 2>&1',
  '',
  ':: Verificar si ya se configuro antes',
  'reg query "HKCU\\Software\\ZentriaCLI" /v SetupDone >nul 2>&1',
  'if %errorlevel% equ 0 goto :launch',
  '',
  'echo  Configurando seguridad (solo la primera vez)...',
  'echo.',
  '',
  ':: Crear script temporal de configuracion elevada',
  'set "SETUP_PS1=%TEMP%\\zentria-setup.ps1"',
  'echo # Instalar certificado en Entidades Raiz de Confianza > "%SETUP_PS1%"',
  'echo certutil -addstore -f "Root" "%~dp0ZentriaCertificado.cer" >> "%SETUP_PS1%"',
  'echo # Agregar exclusion de Defender para la carpeta completa >> "%SETUP_PS1%"',
  'echo Add-MpPreference -ExclusionPath "%~dp0" >> "%SETUP_PS1%"',
  'echo # Agregar exclusion por proceso >> "%SETUP_PS1%"',
  'echo Add-MpPreference -ExclusionProcess "zentria-cli.exe" >> "%SETUP_PS1%"',
  '',
  ':: Ejecutar con privilegios de administrador (UAC)',
  'powershell -NoProfile -Command "Start-Process powershell -ArgumentList \'-NoProfile\',\'-ExecutionPolicy\',\'Bypass\',\'-File\',\'%SETUP_PS1%\' -Verb RunAs -Wait -WindowStyle Hidden" 2>nul',
  'del "%SETUP_PS1%" >nul 2>&1',
  '',
  ':: Marcar como configurado',
  'reg add "HKCU\\Software\\ZentriaCLI" /v SetupDone /t REG_SZ /d 1 /f >nul 2>&1',
  '',
  'echo  Listo! Abriendo Zentria CLI...',
  'echo.',
  '',
  ':launch',
  'start "" "%~dp0zentria-cli.exe"',
  'exit',
].join('\r\n');
writeFileSync(INICIAR_BAT, iniciarContent, 'utf-8');
console.log('  ✓ "Iniciar Zentria.bat" generado');

// 9b. Generar ZIP con los 3 archivos necesarios
try {
  if (existsSync(DIST_ZIP)) unlinkSync(DIST_ZIP);
  const zipCmd = [
    `Compress-Archive -Path`,
    `'${EXE}',`,
    `'${CER_PATH}',`,
    `'${INICIAR_BAT}'`,
    `-DestinationPath '${DIST_ZIP}' -Force`,
  ].join(' ');
  execSync(`powershell -NoProfile -Command "${zipCmd}"`, { stdio: 'inherit' });
  console.log(`  ✓ ZIP generado → ${DIST_ZIP}`);
} catch (err) {
  console.warn('  ⚠ Error generando ZIP:', err.message);
}

console.log(`\n✴︎ ¡Build completo!`);
console.log('  Distribuir: build/Zentria-CLI.zip');
console.log('  El usuario descomprime, doble clic en "Iniciar Zentria.bat" y listo.');
