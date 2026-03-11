#!/bin/bash
# ✴︎ Zentria CLI - Script de Build
# Uso: bash scripts/build.sh [dev|exe|all]

set -e

MODE=${1:-all}

echo ""
echo "₊⊹ ࣪ ִֶָ☾. ZENTRIA CLI - Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Compilar TypeScript
build_ts() {
  echo "✧ Compilando TypeScript..."
  npx tsc
  echo "  ✓ Compilación completada → dist/"
  echo ""
}

# Generar bundle ESM con esbuild
build_bundle() {
  echo "✧ Generando bundle ESM..."
  npx esbuild source/cli.tsx \
    --bundle \
    --platform=node \
    --format=esm \
    --target=node22 \
    --outfile=build/bundle.mjs \
    --jsx=automatic \
    --define:process.env.NODE_ENV=\"production\" \
    --minify
  echo "  ✓ Bundle generado → build/bundle.mjs"
  echo ""
}

# Generar ejecutable portable
build_exe() {
  echo "✧ Generando ejecutable portable..."
  node scripts/build-exe.mjs
  echo ""
}

case "$MODE" in
  dev)
    build_ts
    echo "✴︎ Build de desarrollo completado."
    ;;
  bundle)
    build_bundle
    echo "✴︎ Bundle generado."
    ;;
  exe)
    build_exe
    echo "✴︎ Ejecutable generado → build/zentria-cli.exe"
    ;;
  all)
    build_ts
    build_exe
    echo "✴︎ Build completo finalizado."
    ;;
  *)
    echo "Uso: bash scripts/build.sh [dev|bundle|exe|all]"
    echo ""
    echo "  dev     Compilar TypeScript (dist/)"
    echo "  bundle  Generar bundle ESM (build/bundle.mjs)"
    echo "  exe     Generar ejecutable portable (build/zentria-cli.exe)"
    echo "  all     Compilar TS + generar ejecutable (default)"
    exit 1
    ;;
esac
