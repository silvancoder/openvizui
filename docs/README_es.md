<div align="center">
  <p>
    <a href="../README.md">English</a> | <a href="README_zh.md">中文</a> | <a href="README_de.md">Deutsch</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_it.md">Italiano</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_pt.md">Português</a> | <a href="README_ru.md">Русский</a>
  </p>
</div>
<div align="center">
  <img src="../public/openvizui.png" alt="OpenVizUI Logo" width="400" height="80" />

  # OpenVizUI

  Una aplicación de escritorio moderna construida con **Tauri**, **React**, y **Vite**.

  [![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri&logoColor=white)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Rust](https://img.shields.io/badge/Rust-1.77+-orange?logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
  ![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)

  [Sitio Web Oficial](https://www.openvizui.com) | [Repositorio GitHub](https://github.com/silvancoder/openvizui)
</div>

OpenVizUI es una aplicación de escritorio moderna que proporciona una interfaz de visualización unificada, hermosa y eficiente para herramientas CLI de IA. Construida con [Tauri](https://tauri.app/), [React](https://react.dev/) y [Vite](https://vitejs.dev/), aprovecha el poder de Rust para el backend y la flexibilidad de React para gestionar sus flujos de trabajo de IA, desde la gestión de habilidades hasta configuraciones complejas.

## Capturas de Pantalla

### 🛠️ Área de Trabajo — Gestión de Herramientas AI

Gestione todas sus herramientas AI CLI en un solo lugar. Vea el estado de instalación e información de versión, y ejecute, actualice o desinstale herramientas con un solo clic. Compatible con Claude Code, Gemini, OpenCode, Qoder, GitHub Copilot y más.

![Área de Trabajo](ScreenShot_2026-02-21_134214_518.png)

### 🏪 Tienda de Aplicaciones — Entorno de Desarrollo

Descubra e instale lenguajes de programación, bases de datos, servidores web, sistemas de caché y herramientas de contenedores directamente desde la Tienda de Aplicaciones integrada. Categorías: Lenguajes, Servicios Web, Bases de Datos, Caché y Cola, Herramientas y Contenedores.

![Tienda de Aplicaciones](ScreenShot_2026-02-21_134225_527.png)

### 🤖 Configuración AI — Habilidades y MCP

Centralice toda la configuración de AI en un panel. Gestione habilidades instaladas, configure parámetros CLI, configure servidores MCP, monitorice la actividad. Pestañas: Gestión de Habilidades, Config CLI, Config MCP, Monitor de Habilidades, Monitor MCP.

![Configuración AI](ScreenShot_2026-02-21_134233_038.png)

## Características Principales

| Característica | Descripción |
|----------------|-------------|
| **Área de Trabajo Multi-herramienta** | Panel unificado para Claude Code, Gemini, OpenCode, Qoder, Copilot y Codex |
| **Tienda de Aplicaciones** | Instalación/desinstalación con un clic de herramientas, lenguajes, bases de datos y servicios |
| **Configuración AI** | Gestión de habilidades, configuración CLI, configuración de servidores MCP y monitoreo en vivo |
| **Terminal Integrado** | Terminal con multi-pestaña, árbol de archivos, búsqueda global y comandos predefinidos |
| **Internacionalización** | Soporte completo de UI para 10 idiomas: ES, EN, ZH, DE, FR, IT, JA, KO, PT, RU |
| **Tema y Apariencia** | Modo claro/oscuro, color primario personalizado, fuente y transparencia de ventana |
| **Ecosistema MCP** | Buscar, instalar y monitorear servidores y habilidades de Model Context Protocol |

## Stack Tecnológico

-   **Frontend**:
    -   [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    -   [Vite](https://vitejs.dev/) (Herramienta de construcción)
    -   [Ant Design](https://ant.design/) (Biblioteca de componentes UI)
    -   [Tailwind CSS](https://tailwindcss.com/) (Framework CSS de utilidad primero)
    -   [Vitest](https://vitest.dev/) (Framework de pruebas unitarias)
-   **Backend**:
    -   [Tauri](https://tauri.app/) (Framework de aplicación basado en Rust)

## Descargar

Puede descargar la última versión de OpenVizUI desde la [Página de lanzamientos](https://github.com/silvancoder/openvizui/releases).

## Comenzando

### Prerrequisitos

Asegúrese de tener instalados:

-   [Node.js](https://nodejs.org/) (versión LTS recomendada)
-   [Rust](https://www.rust-lang.org/tools/install) (última estable)

### Instalación

1.  Clone el repositorio:
    ```bash
    git clone https://github.com/silvancoder/openvizui.git
    cd openvizui
    ```

2.  Instale las dependencias:
    ```bash
    npm install
    ```

## Scripts de Desarrollo

Los siguientes scripts están disponibles en `package.json`:

-   **`npm run dev`**:
    Inicia el servidor de desarrollo frontend (Vite). Útil para el desarrollo de UI en el navegador.
    ```bash
    npm run dev
    ```

-   **`npm run tauri dev`**:
    Inicia la aplicación Tauri completa en modo de desarrollo.
    ```bash
    npm run tauri dev
    ```

-   **`npm run tauri build`**:
    Construye el frontend y backend para producción.
    ```bash
    npm run tauri build
    ```

-   **`npm run test`**:
    Ejecuta las pruebas unitarias usando Vitest.
    ```bash
    npm run test
    ```

-   **`npm run coverage`**:
    Ejecuta pruebas unitarias y genera un informe de cobertura de código.
    ```bash
    npm run coverage
    ```

## Estructura del Proyecto

-   `src/`: Código fuente del frontend React.
-   `src-tauri/`: Código fuente del backend Rust y configuración de Tauri.
-   `public/`: Activos estáticos.
-   `CHANGELOG.md`: [Historial detallado de los cambios del proyecto](../CHANGELOG.md).

## Registro de cambios

Para obtener un historial detallado de los cambios, consulte [CHANGELOG.md](../CHANGELOG.md).


## Related Projects

-   [SteerDock - Another Docker GUI Management Platform](https://github.com/silvancoder/steerdock)

## Licencia

Copyright 2026 The OpenVizUI Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
