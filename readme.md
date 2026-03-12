# ₊⊹ ࣪ ִֶָ☾. ZENTRIA CLI ✴︎

> Herramienta de terminal interactiva para el flujo de revisión técnica en bodega del ecosistema Zentria ERP.

Construida con **Node.js**, **TypeScript**, **React** e **Ink** (React para terminales). Permite a los operarios autenticarse, escanear equipos mediante pistolas de códigos de barras e imprimir etiquetas térmicas de forma automática.

---

## Características

- **Interfaz TUI reactiva** con navegación por teclado, gradientes de color y arte ASCII responsivo
- **8 temas visuales**: Lavanda, Océano, Sakura, Esmeralda, Atardecer, Escarcha, Medianoche, Rosa Dorado
- **Modo Online**: autenticación + escaneo por lotes o global + impresión automática de etiquetas
- **Modo Offline**: escaneo local sin conexión para pruebas
- **Escáner rápido y controlado**: modo automático para pistola de códigos de barras y modo manual
- **Impresión silenciosa**: etiquetas 80×60mm vía Puppeteer → PDF → impresora térmica
- **Generación de documentos DOCX** con etiquetas por lote
- **Equipos soportados**: Notebook, Desktop, AIO, Monitor, Docking
- **Ejecutable portable** (.exe) mediante Node.js SEA — sin dependencias externas

## Requisitos Previos

- **Node.js** >= 22.x
- **Google Chrome** instalado (generación de PDFs)
- **Impresora térmica** configurada como predeterminada en Windows (para impresión)

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

El ejecutable se genera en `build/zentria-cli.exe` (~83 MB). No requiere Node.js ni dependencias en la máquina destino.

Pipeline: `esbuild` (bundle ESM) → Node.js SEA (Single Executable Application) → `postject` (inyección en binario).

## Navegación

| Tecla | Acción |
|-------|--------|
| `↑` `↓` `←` `→` | Navegar menú / opciones |
| `Enter` | Seleccionar |
| `Esc` | Volver / salir de submenú |
| `Ctrl+X` | Toggle CLI interna |

## Estructura del Proyecto

```
source/
├── cli.tsx                       # Entry point
├── app.tsx                       # Shell principal + vistas
├── components/
│   ├── LoginView.tsx             # Login + selección de modo
│   ├── MainMenuView.tsx          # Menú principal con grid
│   ├── ThemeSelector.tsx         # Selector de temas interactivo
│   └── common/
│       ├── Menu.tsx              # Componente de menú reutilizable
│       └── GradientText.tsx      # Texto con gradiente multicolor
├── constants/
│   ├── themes.ts                 # 8 paletas de colores
│   └── ascii-art.ts              # Logos ASCII responsivos
├── contexts/
│   └── ThemeContext.tsx           # Provider de tema global
├── hooks/
│   ├── useCommand.ts             # Handler de comandos CLI
│   └── useTerminalSize.ts        # Hook de tamaño de terminal
├── modules/
│   ├── online/
│   │   ├── TicketModule.tsx      # Escáner por lote
│   │   └── GlobalScannerModule.tsx  # Escáner global
│   └── offline/
│       └── TicketModule.tsx      # Escáner offline
├── services/
│   ├── api.service.ts            # Cliente HTTP (axios)
│   ├── auth.service.ts           # Gestión de sesión y config
│   └── print.service.ts          # Generación HTML/PDF/DOCX
└── types/
    └── api.types.ts              # Interfaces del dominio
scripts/
├── build-exe.mjs                 # Pipeline de build del .exe
└── sea-entry.cjs                 # Wrapper CJS para Node.js SEA
```

## Temas

Selecciona un tema desde el menú principal → Configuración → Tema. La preferencia se persiste entre sesiones.

| Tema | Colores |
|------|---------|
| ✧ Lavanda | Púrpura / malva (default) |
| ⋆ Océano | Azul turquesa / cian |
| ☾ Sakura | Rosa / fucsia |
| 𖦹 Esmeralda | Verde |
| ✴︎ Atardecer | Naranja / coral |
| ☁︎ Escarcha | Azul claro / cielo |
| ☾ Medianoche | Púrpura oscuro / índigo |
| ⋆ Rosa Dorado | Rosa pálido / dorado |

## Stack Tecnológico

- **Runtime**: Node.js 22
- **Lenguaje**: TypeScript 5
- **UI**: React 18 + Ink 4
- **HTTP**: Axios
- **PDF**: Puppeteer Core
- **DOCX**: docx
- **Impresión**: pdf-to-printer
- **QR**: qrcode
- **Config**: Conf (almacenamiento persistente)
- **Bundler**: esbuild
- **Ejecutable**: Node.js SEA + postject


## Buildear el proyecto 

### Para poder Buildear correctamente el proyecto debemos hacer lo siguiente:

- Matar cualquier proceso .exe anterior de *zentria-cli* esto asegura un buen buildeo sin fallos

* el comando para poder buildear el proyecto es:

```bash

    node scripts/build-exe.mjs

```

* este nos asegura que corra en cualquier equipo junto con las dependencias de iconos y otras configuraciones actualizadas en la v1.0.0

---

## Historial de versiones

| Versión | Fecha | Highlights |
|---------|-------|------------|
| [**v1.1.6**](./releases/v1.1.6.md) | 12 mar 2026 | Firma digital, certificado embebido en SEA, bypass SmartScreen vía ZIP+.bat, versionado automático del ZIP, GitHub Actions CI/CD |
| [**v1.0.0**](./releases/v1.0.0.md) | 11 mar 2026 | Ejecutable portable .exe (Node.js SEA + esbuild), 8 temas visuales, inyección de variables de entorno, icono y metadatos con resedit |
| [**v0.0.1**](./releases/v0.0.1.md) | 10 mar 2026 | Versión base: autenticación, modos online/offline, módulos de escaneo, impresión de etiquetas |

→ Ver [notas de versión detalladas](./releases/README.md) en la carpeta `releases/`.