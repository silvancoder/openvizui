<div align="center">
  <p>
    <a href="../README.md">English</a> | <a href="README_zh.md">中文</a> | <a href="README_de.md">Deutsch</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_it.md">Italiano</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_pt.md">Português</a> | <a href="README_ru.md">Русский</a>
  </p>
</div>
<div align="center">
  <img src="../public/openvizui.png" alt="OpenVizUI Logo" width="400" height="80" />

  # OpenVizUI

  Eine moderne Desktop-Anwendung, erstellt mit **Tauri**, **React** und **Vite**.

  [![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri&logoColor=white)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Rust](https://img.shields.io/badge/Rust-1.77+-orange?logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
  ![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)

  [Offizielle Website](https://www.openvizui.com) | [GitHub Repository](https://github.com/silvancoder/openvizui)
</div>

OpenVizUI ist eine moderne Desktop-Anwendung, die eine einheitliche, schöne und effiziente Visualisierungsoberfläche für AI-CLI-Tools bietet. Erstellt mit [Tauri](https://tauri.app/), [React](https://react.dev/) und [Vite](https://vitejs.dev/), nutzt es die Leistungsfähigkeit von Rust für das Backend und die Flexibilität von React, um Ihre AI-Workflows zu verwalten – von Skill-Management bis hin zu komplexen Konfigurationen.

## Screenshots

### 🛠️ Workbench — KI-Tool-Verwaltung

Verwalten Sie alle AI-CLI-Tools an einem Ort. Zeigen Sie Installationsstatus und Versionsinformationen an und führen Sie Tools mit einem Klick aus, aktualisieren oder deinstallieren Sie sie. Unterstützt Claude Code, Gemini, OpenCode, Qoder, GitHub Copilot und mehr.

![Workbench](ScreenShot_2026-02-21_134214_518.png)

### 🏪 App Store — Entwicklerumgebung

Entdecken und installieren Sie Programmiersprachen, Datenbanken, Webserver, Cache-Systeme und Container-Tools direkt aus dem integrierten App Store. Kategorien: Sprachen, Webdienste, Datenbanken, Cache & Queue, Tools & Container.

![App Store](ScreenShot_2026-02-21_134225_527.png)

### 🤖 AI-Einstellungen — Skills & MCP-Konfiguration

Zentralisieren Sie alle KI-Konfigurationen in einem Panel. Installierte Skills verwalten, CLI-Parameter konfigurieren, MCP-Server einrichten und Skill-Aktivitäten überwachen: Skills, CLI Config, MCP Config, Skill Monitor, MCP Monitor.

![AI Settings](ScreenShot_2026-02-21_134233_038.png)

## Hauptfunktionen

| Funktion | Beschreibung |
|----------|--------------|
| **Multi-Tool-Workbench** | Einheitliches Dashboard für Claude Code, Gemini, OpenCode, Qoder, Copilot & Codex |
| **App Store** | Ein-Klick-Installation/Deinstallation von Dev-Tools, Sprachen, Datenbanken und Diensten |
| **AI-Einstellungen** | Skill-Verwaltung, CLI-Konfiguration, MCP-Server-Setup und Live-Monitoring |
| **Integriertes Terminal** | Eingebautes Terminal mit Multi-Tab, Dateibaum, globaler Suche und Befehlsvorlagen |
| **Internationalisierung** | Vollständige UI-Unterstützung für 10 Sprachen: DE, EN, ZH, ES, FR, IT, JA, KO, PT, RU |
| **Theme & Erscheinungsbild** | Hell-/Dunkel-Modus, benutzerdefinierte Primärfarbe, Schriftart und Fenstertransparenz |
| **MCP-Ökosystem** | Model Context Protocol Server und Skills durchsuchen, installieren und überwachen |

## Tech-Stack

-   **Frontend**:
    -   [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    -   [Vite](https://vitejs.dev/) (Build-Tool)
    -   [Ant Design](https://ant.design/) (UI-Komponentenbibliothek)
    -   [Tailwind CSS](https://tailwindcss.com/) (Utility-First CSS-Framework)
    -   [Vitest](https://vitest.dev/) (Unit-Testing-Framework)
-   **Backend**:
    -   [Tauri](https://tauri.app/) (Rust-basiertes Anwendungsframework)

## Herunterladen

Sie können die neueste Version von OpenVizUI von der [Releases-Seite](https://github.com/silvancoder/openvizui/releases) herunterladen.

## Erste Schritte

### Voraussetzungen

Stellen Sie sicher, dass Sie Folgendes installiert haben:

-   [Node.js](https://nodejs.org/) (LTS-Version empfohlen)
-   [Rust](https://www.rust-lang.org/tools/install) (neueste stabile Version)

### Installation

1.  Klonen Sie das Repository:
    ```bash
    git clone https://github.com/silvancoder/openvizui.git
    cd openvizui
    ```

2.  Installieren Sie die Abhängigkeiten:
    ```bash
    npm install
    ```

## Entwicklungsskripte

Die folgenden Skripte sind in `package.json` verfügbar:

-   **`npm run dev`**:
    Startet den Frontend-Entwicklungsserver (Vite). Nützlich für die UI-Entwicklung im Browser.
    ```bash
    npm run dev
    ```

-   **`npm run tauri dev`**:
    Startet die vollständige Tauri-Anwendung im Entwicklungsmodus.
    ```bash
    npm run tauri dev
    ```

-   **`npm run tauri build`**:
    Baut das Frontend und Backend für die Produktion.
    ```bash
    npm run tauri build
    ```

-   **`npm run test`**:
    Führt die Unit-Tests mit Vitest aus.
    ```bash
    npm run test
    ```

-   **`npm run coverage`**:
    Führt Unit-Tests aus und generiert einen Code-Coverage-Bericht.
    ```bash
    npm run coverage
    ```

## Projektstruktur

-   `src/`: React Frontend-Quellcode.
-   `src-tauri/`: Rust Backend-Quellcode und Tauri-Konfiguration.
-   `public/`: Statische Assets.
-   `CHANGELOG.md`: [Detaillierte Historie der Projektänderungen](../CHANGELOG.md).

## Changelog

Eine detaillierte Historie der Änderungen finden Sie unter [CHANGELOG.md](../CHANGELOG.md).


## Related Projects

-   [SteerDock - Another Docker GUI Management Platform](https://github.com/silvancoder/steerdock)

## Lizenz

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
