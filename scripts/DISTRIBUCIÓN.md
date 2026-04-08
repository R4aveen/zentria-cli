# 🚀 Guía de Distribución - Zentria CLI

## Flujo Completo

### 1. **Build Local** → Genera archivos compilados

```bash
npm run build:exe
```

**Genera:**
- `build/zentria-cli.exe` — Ejecutable compilado
- `build/ZentriaCertificado.cer` — Certificado autofirmado
- `build/Iniciar Zentria.bat` — Script de instalación
- `build/SumatraPDF-3.4.6-32.exe` — Motor de impresión (si existe)
- **`build/Zentria-CLI-v1.2.0.zip`** ← El archivo para distribuir
- `build/archive/` — Historial automático de zips viejos y artefactos legacy

### 2. **Upload a GitHub** → Sube el ZIP como Release Asset

```powershell
.\scripts\upload-release.ps1 -Token <GITHUB_TOKEN>
```

O con versión específica:
```powershell
.\scripts\upload-release.ps1 -Version 1.2.0 -Token <GITHUB_TOKEN>
```

**¿Cómo obtener el token?**
1. GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Crear nuevo token con scope: `public_repo`, `repo`
3. Copiar token (solo se muestra una vez)

### 3. **Cliente Descarga** → Hook verifica y descarga

El hook `useCliVersion.ts` en la app:
```javascript
const distZipAsset = data.assets?.find((asset: any) => {
    const name = asset.name.toLowerCase();
    return name.startsWith('zentria-cli-v') && 
           name.endsWith('.zip');
});
```

**Busca específicamente:**
- ✅ `Zentria-CLI-v1.2.0.zip` (compilado - correcto)
- ❌ `zentria-cli-1.2.0.zip` (source code - ignorado)
- ❌ Archivo `archive/refs/tags/` - ignorado

### 4. **Usuario Final** → Ejecuta e instala

1. Descomprime `Zentria-CLI-v1.2.0.zip`
2. Doble clic en `Iniciar Zentria.bat`
3. UAC pide permisos (primera vez)
4. Se instala certificado
5. Se abre Zentria CLI

---

## 📋 Checklist Antes de Subir

```bash
# 1. Actualizar versión en package.json
npm version minor  # o patch/major

# 2. Hacer build
npm run build:exe

# 3. Verificar archivos generados
ls -la build/Zentria-CLI-v*.zip
ls -la build/zentria-cli.exe
ls -la build/ZentriaCertificado.cer
ls -la build/*.bat

# 4. Hacer commit y push
git add .
git commit -m "v1.2.0 - Release"
git push origin main

# 5. Subir a GitHub (con token)
.\scripts\upload-release.ps1 -Token $env:GITHUB_TOKEN
```

---

## 🔧 Archivos Involucrados

| Archivo | Función |
|---------|---------|
| `build-exe.mjs` | Genera ZIP con validaciones |
| `upload-release.ps1` | Sube ZIP a GitHub como Asset |
| `useCliVersion.ts` | Hook que descarga desde GitHub |
| `Iniciar Zentria.bat` | Script de instalación para usuarios |

## 🗂️ Estructura de Archivos Generada

```text
build/
├── Zentria-CLI-v1.2.0.zip
├── zentria-cli.exe
├── ZentriaCertificado.cer
├── Iniciar Zentria.bat
├── SumatraPDF-3.4.6-32.exe
└── archive/
    ├── releases/
    │   └── v1.1.6/
    │       └── Zentria-CLI-v1.1.6.zip
    └── legacy/
        ├── Zentria-Setup.exe
        ├── instalar-certificado.bat
        └── zentria-cli.exe.old
```

---

## ✅ Validaciones Automáticas

El script `build-exe.mjs` valida:
- ✓ Ejecutable compilado existe
- ✓ Certificado exportado existe
- ✓ Batch de inicio creado
- ✓ SumatraPDF disponible (opcional)
- ✓ ZIP se puede comprimir

**Si falta algo crítico, el build falla** con mensaje claro.

---

## 📲 Estructura del ZIP para Usuario

```
Zentria-CLI-v1.2.0/
├── zentria-cli.exe              (ejecutable)
├── ZentriaCertificado.cer       (certificado para UAC)
├── Iniciar Zentria.bat          (hace setup + abre app)
└── SumatraPDF-3.4.6-32.exe      (impresor PDF)
```

El usuario solo necesita:
1. Descomprimir
2. Ejecutar `Iniciar Zentria.bat`
3. ¡Listo!

---

## 🐛 Troubleshooting

**"No se encontró asset Zentria-CLI-v*.zip"**
→ Ejecuta `npm run build:exe` primero

**Error en `upload-release.ps1`**
→ Verifica que el token tenga permisos correctos

**Usuario descarga el source code en lugar del ZIP**
→ El hook ahora valida el nombre exacto, problema resuelto ✓

