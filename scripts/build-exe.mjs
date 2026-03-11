#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BUILD_DIR = join(ROOT, 'build');
const BUNDLE = join(BUILD_DIR, 'bundle.mjs');
const ENTRY = join(ROOT, 'scripts', 'sea-entry.cjs');
const BLOB = join(BUILD_DIR, 'sea-prep.blob');
const EXE = join(BUILD_DIR, 'zentria-cli.exe');
const SEA_CONFIG = join(BUILD_DIR, 'sea-config.json');

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

// 2. Generar configuración SEA (CJS wrapper + ESM bundle como asset)
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
  },
};
writeFileSync(SEA_CONFIG, JSON.stringify(seaConfig, null, 2));

// 3. Generar blob
console.log('\n✧ Generando blob SEA...');
execSync(`node --experimental-sea-config ${SEA_CONFIG}`, { stdio: 'inherit' });

// 4. Copiar node.exe como base del ejecutable
console.log('\n✧ Copiando runtime de Node.js...');
copyFileSync(process.execPath, EXE);

// 5. Inyectar blob en el ejecutable
console.log('\n✧ Inyectando aplicación en ejecutable...');
execSync([
  `npx postject "${EXE}" NODE_SEA_BLOB "${BLOB}"`,
  '--sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2',
  '--overwrite',
].join(' '), { stdio: 'inherit' });

console.log(`\n✴︎ ¡Ejecutable generado exitosamente! → ${EXE}`);
