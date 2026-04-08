#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, unlinkSync, renameSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
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
const SUMATRA_SRC = join(ROOT, 'node_modules', 'pdf-to-printer', 'dist', 'SumatraPDF-3.4.6-32.exe');
const SUMATRA_DEST = join(BUILD_DIR, 'SumatraPDF-3.4.6-32.exe');
const WINDOWS_POWERSHELL_EXE = process.env.WINDIR
  ? join(process.env.WINDIR, 'System32', 'WindowsPowerShell', 'v1.0', 'powershell.exe')
  : 'powershell.exe';

const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf-8'));
const VERSION = pkg.version;
const DIST_ZIP = join(BUILD_DIR, `Zentria-CLI-v${VERSION}.zip`);
const ARCHIVE_DIR = join(BUILD_DIR, 'archive');
const RELEASE_ARCHIVE_DIR = join(ARCHIVE_DIR, 'releases');
const LEGACY_ARCHIVE_DIR = join(ARCHIVE_DIR, 'legacy');
const VERSIONED_ZIP_PATTERN = /^Zentria-CLI-v(\d+\.\d+\.\d+)\.zip$/i;
const LEGACY_ROOT_FILES = new Set([
  'Zentria-Setup.exe',
  'Zentria-CLI.zip',
  'instalar-certificado.bat',
  'SumatraPDF-settings.txt',
  'err.txt',
  'stderr.txt',
  '_sign.ps1',
  '_export-cert.ps1',
  'zentria-cli.exe.old',
]);

if (!existsSync(BUILD_DIR)) mkdirSync(BUILD_DIR, { recursive: true });

const ensureDirectory = (directoryPath) => {
  if (!existsSync(directoryPath)) {
    mkdirSync(directoryPath, { recursive: true });
  }
};

const archiveFile = (sourcePath, destinationDirectory) => {
  ensureDirectory(destinationDirectory);
  const targetPath = join(destinationDirectory, basename(sourcePath));

  if (existsSync(targetPath)) {
    unlinkSync(targetPath);
  }

  renameSync(sourcePath, targetPath);
  console.log(`  ↳ Archivado: ${basename(sourcePath)} → ${destinationDirectory}`);
};

const archivePreviousBuildArtifacts = () => {
  ensureDirectory(ARCHIVE_DIR);
  ensureDirectory(RELEASE_ARCHIVE_DIR);
  ensureDirectory(LEGACY_ARCHIVE_DIR);

  for (const entryName of readdirSync(BUILD_DIR)) {
    const entryPath = join(BUILD_DIR, entryName);

    if (!statSync(entryPath).isFile()) {
      continue;
    }

    const zipMatch = entryName.match(VERSIONED_ZIP_PATTERN);
    if (zipMatch) {
      archiveFile(entryPath, join(RELEASE_ARCHIVE_DIR, `v${zipMatch[1]}`));
      continue;
    }

    if (LEGACY_ROOT_FILES.has(entryName)) {
      archiveFile(entryPath, LEGACY_ARCHIVE_DIR);
    }
  }
};

archivePreviousBuildArtifacts();

const runWindowsPowerShellFile = (scriptPath) => {
  const command = `"${WINDOWS_POWERSHELL_EXE}" -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`;
  execSync(command, { stdio: 'inherit' });
};

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
    js: [
      "import{createRequire}from'node:module';const require=createRequire(import.meta.url);",
      "import{fileURLToPath as __pkg_ftp}from'node:url';import{dirname as __pkg_dn}from'node:path';",
      "var __filename;try{__filename=__pkg_ftp(import.meta.url)}catch{__filename=process.execPath}",
      "var __dirname=__pkg_dn(__filename);",
    ].join(''),
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

// 1b. Copiar SumatraPDF al directorio de distribución (necesario para impresión silenciosa)
if (existsSync(SUMATRA_SRC)) {
  copyFileSync(SUMATRA_SRC, SUMATRA_DEST);
  console.log('  ✓ SumatraPDF copiado a build/');
} else {
  console.warn('  ⚠ SumatraPDF no encontrado en node_modules/pdf-to-printer');
}

// 2. Exportar certificado para embeber como asset SEA
console.log('\n✧ Exportando certificado...');
{
  const certScriptPath = join(BUILD_DIR, '_export-cert.ps1');
  try { unlinkSync(CER_PATH); } catch {}
  const certScript = [
    `$ErrorActionPreference = 'Stop'`,
    `$certName = 'ZentriaCLI'`,
    `Import-Module Microsoft.PowerShell.Security -ErrorAction SilentlyContinue`,
    `$stores = @('Cert:\\CurrentUser\\My', 'Cert:\\LocalMachine\\My')`,
    `$cert = $null`,
    `foreach ($store in $stores) {`,
    `  if (Test-Path $store) {`,
    `    $cert = Get-ChildItem -Path $store | Where-Object { $_.Subject -eq "CN=$certName" -and $_.HasPrivateKey } | Select-Object -First 1`,
    `    if ($cert) { break }`,
    `  }`,
    `}`,
    `if (-not $cert) {`,
    `  Write-Host '  Creando certificado autofirmado...'`,
    `  try {`,
    `    $cert = New-SelfSignedCertificate -Subject "CN=$certName" -Type CodeSigningCert -CertStoreLocation Cert:\\CurrentUser\\My -NotAfter (Get-Date).AddYears(5)`,
    `  } catch {`,
    `    $cert = New-SelfSignedCertificate -Subject "CN=$certName" -Type CodeSigningCert -CertStoreLocation Cert:\\LocalMachine\\My -NotAfter (Get-Date).AddYears(5)`,
    `  }`,
    `}`,
    `if (-not $cert) { throw 'No se pudo crear ni localizar certificado de firma.' }`,
    `Export-Certificate -Cert $cert -FilePath '${CER_PATH}' -Force | Out-Null`,
    `if (-not (Test-Path '${CER_PATH}')) { throw 'No se pudo exportar el certificado .cer' }`,
    `Write-Host "  Thumbprint: $($cert.Thumbprint)"`,
  ].join('\n');
  writeFileSync(certScriptPath, certScript, 'utf-8');
  runWindowsPowerShellFile(certScriptPath);
  try { unlinkSync(certScriptPath); } catch {}
  if (!existsSync(CER_PATH)) {
    throw new Error('No se generó build/ZentriaCertificado.cer. Build cancelado para evitar distribuir un paquete inválido.');
  }
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
    archiveFile(old, LEGACY_ARCHIVE_DIR);
    console.log('  ⚠ Ejecutable anterior estaba bloqueado, archivado en build/archive/legacy/');
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

// Pequeño delay de seguridad para que Windows suelte el archivo tras los metadatos/antivirus
await new Promise(r => setTimeout(r, 2000));

try {
  const signScriptPath = join(BUILD_DIR, '_sign.ps1');
  const signScript = [
    `$ErrorActionPreference = 'Stop'`,
    `$certName = 'ZentriaCLI'`,
    `Import-Module Microsoft.PowerShell.Security -ErrorAction SilentlyContinue`,
    `$stores = @('Cert:\\CurrentUser\\My', 'Cert:\\LocalMachine\\My')`,
    `$cert = $null`,
    `foreach ($store in $stores) {`,
    `  if (Test-Path $store) {`,
    `    $cert = Get-ChildItem -Path $store | Where-Object { $_.Subject -eq "CN=$certName" -and $_.HasPrivateKey } | Select-Object -First 1`,
    `    if ($cert) { break }`,
    `  }`,
    `}`,
    `if (-not $cert) { throw 'Certificado no encontrado. Ejecuta el build completo.' }`,
    `Set-AuthenticodeSignature -FilePath '${EXE}' -Certificate $cert | Out-Null`,
    `$sig = Get-AuthenticodeSignature -FilePath '${EXE}'`,
    `Write-Host "  Status: $($sig.Status)"`,
  ].join('\n');
  writeFileSync(signScriptPath, signScript, 'utf-8');
  runWindowsPowerShellFile(signScriptPath);
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

// 9b. Generar ZIP con SOLO los archivos necesarios (exe, bat, cer, SumatraPDF)
console.log('\n✧ Validando archivos para distribución...');

// Validar que existan TODOS los archivos críticos
const requiredFiles = [
  { path: EXE, name: 'zentria-cli.exe' },
  { path: CER_PATH, name: 'ZentriaCertificado.cer' },
  { path: INICIAR_BAT, name: 'Iniciar Zentria.bat' },
];

const optionalFiles = [
  { path: SUMATRA_DEST, name: 'SumatraPDF-3.4.6-32.exe' },
];

// Verificar archivos requeridos
let missingRequired = [];
for (const file of requiredFiles) {
  if (!existsSync(file.path)) {
    missingRequired.push(file.name);
    console.error(`  ✗ FALTA: ${file.name}`);
  } else {
    console.log(`  ✓ ${file.name}`);
  }
}

if (missingRequired.length > 0) {
  throw new Error(`\n❌ No se puede generar ZIP. Archivos faltantes: ${missingRequired.join(', ')}`);
}

// Recolectar archivos para el ZIP
const zipFiles = [
  `'${EXE}'`,
  `'${CER_PATH}'`,
  `'${INICIAR_BAT}'`,
];

// Agregar opcionales si existen
for (const file of optionalFiles) {
  if (existsSync(file.path)) {
    zipFiles.push(`'${file.path}'`);
    console.log(`  ✓ ${file.name} (incluido)`);
  } else {
    console.warn(`  ⊘ ${file.name} (no incluido)`);
  }
}

// Generar ZIP
try {
  if (existsSync(DIST_ZIP)) unlinkSync(DIST_ZIP);
  
  const zipCmd = [
    `Compress-Archive -Path`,
    zipFiles.join(','),
    `-DestinationPath '${DIST_ZIP}' -Force`,
  ].join(' ');
  
  console.log('\n✧ Comprimiendo archivos...');
  execSync(`powershell -NoProfile -Command "${zipCmd}"`, { stdio: 'inherit' });
  
  console.log(`\n✓ ZIP generado → ${DIST_ZIP}`);
  console.log(`  Contenido:`);
  console.log(`    - zentria-cli.exe (ejecutable compilado)`);
  console.log(`    - ZentriaCertificado.cer (certificado autofirmado)`);
  console.log(`    - Iniciar Zentria.bat (lanzador con setup)`);
  if (existsSync(SUMATRA_DEST)) {
    console.log(`    - SumatraPDF-3.4.6-32.exe (para impresión)`);
  }
} catch (err) {
  console.error('  ❌ Error generando ZIP:', err.message);
  throw err;
}

console.log(`\n✴︎ Build completado exitosamente!`);
console.log(`\n📦 Para distribuir a usuarios finales:`);
console.log(`  1. Subir "${DIST_ZIP}" como Release Asset en GitHub`);
console.log(`  2. Tag de release: v${VERSION}`);
console.log(`  3. Los usuarios descargan el ZIP`);
console.log(`  4. Descomprimen y ejecutan "Iniciar Zentria.bat"`);
console.log(`\n💡 Nota: Hook useCliVersion.ts buscará archivos que coincidan con:`);
console.log(`    - Nombre: Zentria-CLI-v*.zip`);
console.log(`    - Ubicación: GitHub Releases Assets`);
