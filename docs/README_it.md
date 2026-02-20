<div align="center">
  <p>
    <a href="../README.md">English</a> | <a href="README_zh.md">中文</a> | <a href="README_de.md">Deutsch</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_it.md">Italiano</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_pt.md">Português</a> | <a href="README_ru.md">Русский</a>
  </p>
</div>
<div align="center">
  <img src="../public/openvizui.png" alt="OpenVizUI Logo" width="400" height="80" />

  # OpenVizUI

  Una moderna applicazione desktop costruita con **Tauri**, **React** e **Vite**.

  [![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri&logoColor=white)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Rust](https://img.shields.io/badge/Rust-1.77+-orange?logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
  ![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)

  [Sito Ufficiale](https://www.openvizui.com) | [Repository GitHub](https://github.com/silvancoder/openvizui)
</div>

OpenVizUI è una moderna applicazione desktop che fornisce un'interfaccia di visualizzazione unificata, bella ed efficiente per gli strumenti CLI AI. Costruita con [Tauri](https://tauri.app/), [React](https://react.dev/) e [Vite](https://vitejs.dev/), sfrutta la potenza di Rust per il backend e la flessibilità di React per gestire i tuoi flussi di lavoro AI, dalla gestione delle abilità alle configurazioni complesse.

## Stack Tecnologico

-   **Frontend**:
    -   [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    -   [Vite](https://vitejs.dev/) (Strumento di build)
    -   [Ant Design](https://ant.design/) (Libreria di componenti UI)
    -   [Tailwind CSS](https://tailwindcss.com/) (Framework CSS utility-first)
    -   [Vitest](https://vitest.dev/) (Framework per test unitari)
-   **Backend**:
    -   [Tauri](https://tauri.app/) (Framework per applicazioni basato su Rust)

## Scarica

Puoi scaricare l'ultima versione di OpenVizUI dalla [Pagina delle versioni](https://github.com/silvancoder/openvizui/releases).

## Per Iniziare

### Prerequisiti

Assicurati di avere installato quanto segue:

-   [Node.js](https://nodejs.org/) (versione LTS raccomandata)
-   [Rust](https://www.rust-lang.org/tools/install) (ultima stabile)

### Installazione

1.  Clona il repository:
    ```bash
    git clone https://github.com/silvancoder/openvizui.git
    cd openvizui
    ```

2.  Installa le dipendenze:
    ```bash
    npm install
    ```

## Script di Sviluppo

I seguenti script sono disponibili in `package.json`:

-   **`npm run dev`**:
    Avvia il server di sviluppo frontend (Vite). Utile per lo sviluppo dell'interfaccia utente nel browser.
    ```bash
    npm run dev
    ```

-   **`npm run tauri dev`**:
    Avvia l'applicazione Tauri completa in modalità sviluppo.
    ```bash
    npm run tauri dev
    ```

-   **`npm run tauri build`**:
    Costruisce il frontend e il backend per la produzione.
    ```bash
    npm run tauri build
    ```

-   **`npm run test`**:
    Esegue i test unitari utilizzando Vitest.
    ```bash
    npm run test
    ```

-   **`npm run coverage`**:
    Esegue i test unitari e genera un report di copertura del codice.
    ```bash
    npm run coverage
    ```

## Struttura del Progetto

-   `src/`: Codice sorgente frontend React.
-   `src-tauri/`: Codice sorgente backend Rust e configurazione Tauri.
-   `public/`: Asset statici.

## Related Projects

-   [SteerDock - Another Docker GUI Management Platform](https://github.com/silvancoder/steerdock)

## Licenza

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
