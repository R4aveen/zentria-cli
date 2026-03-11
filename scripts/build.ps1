# ✴︎ Zentria CLI - Script de Build
# Uso: .\scripts\build.ps1 [dev|bundle|exe|all]

param(
  [string]$Mode = "all"
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "₊⊹ ִֶָ☾. ZENTRIA CLI - Build" -ForegroundColor Magenta
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor DarkGray
Write-Host ""

function Build-TS {
  Write-Host "✧ Compilando TypeScript..." -ForegroundColor Cyan
  npx tsc
  if ($LASTEXITCODE -ne 0) { throw "Error en compilacion TypeScript" }
  Write-Host "  ✓ Compilacion completada → dist/" -ForegroundColor Green
  Write-Host ""
}

function Build-Bundle {
  Write-Host "✧ Generando bundle ESM..." -ForegroundColor Cyan
  npx esbuild source/cli.tsx `
    --bundle `
    --platform=node `
    --format=esm `
    --target=node22 `
    --outfile=build/bundle.mjs `
    --jsx=automatic `
    "--define:process.env.NODE_ENV=`"production`"" `
    --minify
  if ($LASTEXITCODE -ne 0) { throw "Error generando bundle" }
  Write-Host "  ✓ Bundle generado → build/bundle.mjs" -ForegroundColor Green
  Write-Host ""
}

function Build-Exe {
  Write-Host "✧ Generando ejecutable portable..." -ForegroundColor Cyan
  node scripts/build-exe.mjs
  if ($LASTEXITCODE -ne 0) { throw "Error generando ejecutable" }
  Write-Host ""
}

switch ($Mode) {
  "dev" {
    Build-TS
    Write-Host "✴︎ Build de desarrollo completado." -ForegroundColor Magenta
  }
  "bundle" {
    Build-Bundle
    Write-Host "✴︎ Bundle generado." -ForegroundColor Magenta
  }
  "exe" {
    Build-Exe
    Write-Host "✴︎ Ejecutable generado → build/zentria-cli.exe" -ForegroundColor Magenta
  }
  "all" {
    Build-TS
    Build-Exe
    Write-Host "✴︎ Build completo finalizado." -ForegroundColor Magenta
  }
  default {
    Write-Host "Uso: .\scripts\build.ps1 [dev|bundle|exe|all]"
    Write-Host ""
    Write-Host "  dev     Compilar TypeScript (dist/)"
    Write-Host "  bundle  Generar bundle ESM (build/bundle.mjs)"
    Write-Host "  exe     Generar ejecutable portable (build/zentria-cli.exe)"
    Write-Host "  all     Compilar TS + generar ejecutable (default)"
    exit 1
  }
}
