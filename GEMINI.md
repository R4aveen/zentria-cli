# Zentria CLI - Manual del Desarrollador v1.2.0

## Descripción del Proyecto
Zentria CLI es una herramienta de terminal interactiva para el ecosistema Zentria ERP. Construida con **Node.js**, **TypeScript** e **Ink**, permite a los operarios autenticarse, escanear equipos e imprimir etiquetas térmicas de forma automática.

### Características Principales v1.2.0
- **Shell de Pantalla Única**: Contenedor principal en `app.tsx` que fija la altura y anchura al tamaño de la terminal (`rows - 1`), eliminando el scroll y el parpadeo.
- **Navegación Multinivel**: Implementación de submenús (`SettingsMenuView`, `SystemInfoView`) con gestión de tecla `ESC` jerárquica.
- **Paginación Inteligente**: El `ThemeSelector` utiliza una ventana deslizante para mostrar solo un subconjunto de los 13 temas disponibles.
- **Recuperación de Terminal**: Atajo global `Ctrl+R` que limpia el buffer de `stdout` y fuerza un redibujado completo.
- **Autenticación Resiliente**: Función `handleSubmit` en `LoginView` preparada para detectar el token en diversos formatos de API.

## Arquitectura de Software
Sistema modular y centrado en la estabilidad visual:

- **Vistas (source/components)**:
  - `LoginView`: Pantalla de acceso multi-token.
  - `MainMenuView`: Panel de control principal con grid dinámico.
  - `SettingsMenuView`: Submenú para diagnósticos y apariencia.
  - `ThemeSelector`: Selector con scroll y vista previa.
- **Componentes comunes**:
  - `SelectedGradient.tsx`: Renderizador de gradientes por "chunks" para máximo rendimiento.
- **Servicios**:
  - `ApiService`: Consumo de backend Laravel.
  - `AuthService`: Gestión de tokens y configuración persistente.
  - `PrintService`: Puppeteer -> PDF -> Impresora Térmica.

## Convenciones de Desarrollo
- **Estabilidad de Bordes**: Al usar `Box` de Ink, evitar anidamientos de bordes con `flexGrow` si no hay un ancho fijo, para prevenir artefactos en Windows CMD/PS.
- **Keys Estables**: Todos los elementos de lista deben usar identificadores únicos (como el nombre del tema o el valor del ítem) en la prop `key`.
- **Extensiones de Importación**: Usar `.js` en todas las importaciones locales.

## Guía de Build (SEA)
El proyecto se distribuye como un Single Executable Application (SEA):
1. `npm run build` (TSC)
2. `npm run bundle` (esbuild bundle ESM a `build/bundle.mjs`)
3. `node scripts/build-exe.mjs` (SEA inyección + rcedit de iconos)

El ejecutable final se firma y versiona automáticamente en la carpeta `build/`.
