# ₊⊹ ࣪ ִֶָ☾. ZENTRIA CLI ✴︎

> Herramienta de terminal interactiva para el flujo de revisión técnica en bodega del ecosistema Zentria ERP.

Construida con **Node.js**, **TypeScript**, **React** e **Ink** (React para terminales). Permite a los operarios autenticarse, escanear equipos mediante pistolas de códigos de barras e imprimir etiquetas térmicas de forma automática.

---

## Características v1.2.0 (Premium)

- **Interfaz TUI Ultra-Estable**: Sistema de "Pantalla Única" con centrado absoluto y sin parpadeo (Flicker-Free).
- **13 Temas Visuales Pro**: Lavanda, Océano, Sakura, Esmeralda, Atardecer, Escarcha, Medianoche, Rosa Dorado + **Cyberpunk, Matrix, Retro, Dracula, Nórdico**.
- **Navegación por Capas**: Submenús de configuración independientes y navegación rápida por teclado (`ESC` dinámico).
- **Control de Paginación**: Selector de temas con ventana deslizante (scrolling) para terminales pequeñas.
- **Recuperación Instantánea**: Atajo `Ctrl+R` para limpiar y redibujar la terminal ante cualquier error visual.
- **Modo Offline Optimizado**: Escaneo y despacho de tickets local con resolución de rutas dinámica en el ejecutable.
- **Fix Crítico de Auth**: Soporte para múltiples esquemas de token (`access_token`, `token`, `data.token`).

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
│   ├── LoginView.tsx             # Login Multi-Token
│   ├── MainMenuView.tsx          # Menú principal equilibrado
│   ├── SettingsMenuView.tsx      # Submenú de configuración [NUEVO]
│   ├── SystemInfoView.tsx        # Diagnóstico Premium [NUEVO]
│   ├── ThemeSelector.tsx         # Selector con paginación
│   └── common/
│       ├── SelectedGradient.tsx  # Motor de gradiente optimizado
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
| [**v1.2.0**](./releases/v1.2.0.md) | 06 abr 2026 | **Premium Evolution**: Pantalla única, ficker-free, 13 temas, paginación, fix auth y recovery Ctrl+R |
| [**v1.1.6**](./releases/v1.1.6.md) | 12 mar 2026 | Firma digital, certificado embebido en SEA, bypass SmartScreen, GitHub Actions |
| [**v1.0.0**](./releases/v1.0.0.md) | 11 mar 2026 | Ejecutable portable .exe, 8 temas, inyección de env vars, icono resedit |

→ Ver [notas de versión detalladas](./releases/README.md) en la carpeta `releases/`.