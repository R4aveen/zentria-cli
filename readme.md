# ₊⊹ ࣪ ִֶָ☾. ZENTRIA CLI ✴︎

> Herramienta de terminal interactiva para el flujo de revisión técnica en bodega del ecosistema Zentria ERP.

Construida con **Node.js**, **TypeScript**, **React** e **Ink** (React para terminales). Permite a los operarios autenticarse, escanear equipos mediante pistolas de códigos de barras e imprimir etiquetas térmicas de forma automática.

---

## Características v1.2.1

- **Renderizado Optimizado**: Sistema de "Pantalla Única" con centrado absoluto y eliminación de parpadeo (Flicker-Free).
- **13 Temas Visuales**: Lavanda, Océano, Sakura, Esmeralda, Atardecer, Escarcha, Medianoche, Rosa Dorado + Cyberpunk, Matrix, Retro, Dracula, Nórdico.
- **Navegación Multicapa**: Submenús de configuración independientes y navegación por teclado optimizada (`ESC` dinámico).
- **Paginación Inteligente**: Selector de temas con ventana deslizante para resoluciones variables de terminal.
- **Recuperación de Plataforma**: Atajo `Ctrl+R` para limpiar y redibujar la terminal ante artefactos del sistema.
- **Modo Offline Mejorado**: Escaneo y despacho de tickets local con resolución de rutas dinámica en el ejecutable.
- **Autenticación Reforzada**: Soporte para múltiples esquemas de token (`access_token`, `token`, `data.token`).
- **Release Pipeline Robusto**: Validación automática de tag vs package.json y verificación obligatoria del ZIP antes de publicar en GitHub Releases.
- **Build Limpio y Trazable**: Archivado automático de versiones anteriores en `build/archive/releases` y residuos legacy en `build/archive/legacy`.
- **Firma/Certificado Estable**: Ejecución explícita con Windows PowerShell para evitar fallos de proveedor `Cert:` en exportación y firma.

## Requisitos Previos

- **Node.js** >= 22.x
- **Google Chrome** instalado (generación de PDFs)
- **Impresora térmica** configurada como predeterminada en Windows (80x60mm)

## Instalación

```bash
# Clonar e instalar dependencias
git clone <repo-url>
cd zentria-cli
npm install --legacy-peer-deps
```

## Configuración

Copia `.env.example` a `.env` y ajusta los valores:

```env
API_BASE_URL=http://tu-api-zentria.com
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

| Variable | Descripción | Default |
|----------|-------------|---------|
| `API_BASE_URL` | URL base del servidor API Laravel | `http://localhost:8000` |
| `CHROME_PATH` | Ruta al ejecutable de Chrome | `C:\Program Files\Google\Chrome\Application\chrome.exe` |

## Uso

### Desarrollo

```bash
# Compilar TypeScript
npm run build

# Compilar en modo observador
npm run dev

# Ejecutar
node dist/cli.js
```

### Ejecutable Portable (.exe)

```bash
# Generar zentria-cli.exe en build/
npm run build:exe
```

El ejecutable se genera en `build/zentria-cli.exe` (~85 MB).

### Publicacion por Tags (GitHub Releases)

Este proyecto publica descargables mediante tags Git, no subiendo ZIPs al repositorio.

Flujo recomendado:

1. Actualiza `version` en `package.json` (por ejemplo `1.2.1`).
2. Crea y empuja el tag con la misma version (`v1.2.1`).
3. GitHub Actions ejecuta `build-exe.mjs`.
4. Se publica `build/Zentria-CLI-v1.2.1.zip` como Release Asset.

Notas importantes:

- `build/` esta ignorado por `.gitignore`, esto no borra archivos, solo evita subir artefactos locales al repo.
- Si `package.json` y el tag no coinciden, el workflow falla para evitar subir una version incorrecta.
- Las versiones viejas se archivan localmente en `build/archive/` durante cada build.

## Navegación

| Tecla | Acción |
|-------|--------|
| `↑` `↓` | Navegar menú / opciones |
| `Enter` | Seleccionar / Aplicar |
| `Esc` | Volver al nivel anterior |
| `Ctrl+R` | **Forzar Refresco (Clear & Redraw)** |
| `Ctrl+X` | Toggle modo CLI manual |

## Estructura del Proyecto

```
source/
├── cli.tsx                       # Entry point
├── app.tsx                       # Shell principal "Single Screen"
├── components/
│   ├── LoginView.tsx             # Autenticación multi-token
│   ├── MainMenuView.tsx          # Menú principal
│   ├── SettingsMenuView.tsx      # Submenú de configuración
│   ├── SystemInfoView.tsx        # Información del sistema
│   ├── ThemeSelector.tsx         # Selector con paginación inteligente
│   └── common/
│       ├── SelectedGradient.tsx  # Motor de renderizado de gradientes
│       └── ...
...
```

## Stack Tecnológico

- **Runtime**: Node.js 22 + SEA
- **Lenguaje**: TypeScript 5
- **UI**: React 18 + Ink 4
- **Bundler**: esbuild
- **Ejecutable**: Node.js SEA + postject

---

## Historial de versiones

| Versión | Fecha | Highlights |
|---------|-------|------------|
| [**v1.2.1**](./releases/v1.2.1.md) | 08 abr 2026 | Release de corrección: estabilidad de compilación/firma, orden de artefactos y publicación confiable por tags |
| [**v1.2.0**](./releases/v1.2.0.md) | 06 abr 2026 | Estabilización UI, renderizado Flicker-Free, paginación inteligente, navegación multicapa, autenticación reforzada y recuperación de plataforma |
| [**v1.1.6**](./releases/v1.1.6.md) | 12 mar 2026 | Firma digital, certificado embebido en SEA, bypass SmartScreen, GitHub Actions |
| [**v1.0.0**](./releases/v1.0.0.md) | 11 mar 2026 | Ejecutable portable .exe, 8 temas, inyección de env vars, icono resedit |

→ Ver [notas de versión detalladas](./releases/README.md) en la carpeta `releases/`.