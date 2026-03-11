// CJS entry point for Node.js SEA
// Extracts the ESM bundle from SEA assets and runs it via dynamic import
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');

(async () => {
  let sea;
  try { sea = require('node:sea'); } catch {}

  if (sea && sea.isSea()) {
    const tmpDir = path.join(os.tmpdir(), `zentria-${process.pid}`);
    fs.mkdirSync(tmpDir, { recursive: true });

    const bundlePath = path.join(tmpDir, 'bundle.mjs');
    fs.writeFileSync(bundlePath, sea.getAsset('bundle.mjs', 'utf-8'));

    // yoga-wasm-web resuelve yoga.wasm relativo al módulo
    const wasmPath = path.join(tmpDir, 'yoga.wasm');
    fs.writeFileSync(wasmPath, Buffer.from(sea.getRawAsset('yoga.wasm')));

    try {
      await import(pathToFileURL(bundlePath).href);
    } finally {
      try {
        fs.unlinkSync(bundlePath);
        fs.unlinkSync(wasmPath);
        fs.rmdirSync(tmpDir);
      } catch {}
    }
  } else {
    // Dev fallback
    const bundlePath = path.join(__dirname, '..', 'build', 'bundle.mjs');
    await import(pathToFileURL(bundlePath).href);
  }
})();
