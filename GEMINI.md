# Zentria CLI - Manual del Desarrollador

## Descripción del Proyecto
Zentria CLI es una herramienta de línea de comandos (CLI) interactiva diseñada para agilizar el flujo de revisión técnica en bodega del ecosistema Zentria ERP. Construida con **Node.js**, **TypeScript** e **Ink** (React para terminales), permite a los operarios autenticarse, escanear equipos mediante pistolas de códigos de barras e imprimir etiquetas térmicas de forma automática y silenciosa.

### Características Principales
- **Interfaz Reactiva**: Interfaz de terminal moderna con cursores parpadeantes y feedback visual.
- **Autenticación Persistente**: Gestión de sesiones mediante tokens almacenados localmente.
- **Modo Escáner**: Captura automática de entradas de teclado (simulando escáneres) para búsquedas instantáneas.
- **Impresión Silenciosa**: Generación de etiquetas en formato PDF (vía Puppeteer) y envío directo a impresoras térmicas (80mm x 60mm).
- **Soporte Multidispositivo**: Plantillas de impresión específicas para Notebooks, Desktops, AIO, Monitores y Dockings.

## Arquitectura de Software
El proyecto sigue una arquitectura modular y orientada a servicios:

- **Vistas (source/components)**:
  - `LoginView`: Interfaz de acceso con campos de texto interactivos.
  - `ScannerView`: Modo de escucha principal para el proceso de bodega.
- **Servicios (source/services)**:
  - `ApiService`: Comunicación centralizada con el backend de Laravel.
  - `AuthService`: Gestión de configuración y tokens (soporta `.env`).
  - `PrintService`: Lógica de renderizado HTML y procesos de impresión.
- **Tipos (source/types)**: Definiciones de interfaces para el dominio técnico.

## Guía de Inicio Rápido

### Requisitos Previos
- Node.js >= 16.
- Google Chrome instalado (necesario para la generación de PDFs).
- Impresora térmica configurada como predeterminada en Windows.

### Instalación
```bash
npm install
```

### Configuración
Crea un archivo `.env` en la raíz basado en `.env.example`:
```env
API_BASE_URL=http://tu-api-zentria.com
CHROME_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

### Comandos de Desarrollo
- **Compilar**: `npm run build`
- **Modo Observador**: `npm run dev`
- **Ejecutar Localmente**: `node dist/cli.js`
- **Vincular Globalmente**: `npm link` (luego usar el comando `zentria-cli`)

## Convenciones de Desarrollo
- **Extensiones de Importación**: Debido al uso de ESM (ECMAScript Modules), todas las importaciones locales en los archivos fuente deben incluir la extensión `.js` (ej: `import { Service } from './service.js'`).
- **Nomenclatura**: Uso de PascalCase para Componentes de Ink y camelCase para servicios y métodos.
- **Estilos de Terminal**: Priorizar el uso de componentes `Box` y `Text` de Ink para mantener la consistencia visual.
- **Validaciones**: Las peticiones a la API deben manejarse dentro del `ApiService` con bloques try/catch para proporcionar feedback descriptivo al usuario en la terminal.
