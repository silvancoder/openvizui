<div align="center">
  <p>
    <a href="README.md">English</a> | <a href="docs/README_zh.md">中文</a> | <a href="docs/README_de.md">Deutsch</a> | <a href="docs/README_es.md">Español</a> | <a href="docs/README_fr.md">Français</a> | <a href="docs/README_it.md">Italiano</a> | <a href="docs/README_ja.md">日本語</a> | <a href="docs/README_ko.md">한국어</a> | <a href="docs/README_pt.md">Português</a> | <a href="docs/README_ru.md">Русский</a>
  </p>
</div>
<div align="center">
  <img src="public/openvizui.png" alt="OpenVizUI Logo" width="400" height="80" />

  # OpenVizUI

  A modern desktop application built with **Tauri**, **React**, and **Vite**.

  [![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri&logoColor=white)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Rust](https://img.shields.io/badge/Rust-1.77+-orange?logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
  ![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)

  [Official Website](https://www.openvizui.com) | [GitHub Repository](https://github.com/silvancoder/openvizui)
</div>

OpenVizUI is a modern desktop application that provides a unified, beautiful, and efficient visualization interface for AI CLI tools. Built with [Tauri](https://tauri.app/), [React](https://react.dev/), and [Vite](https://vitejs.dev/), it leverages the power of Rust for the backend and the flexibility of React to manage your AI workflows—from skills management to complex configurations.

## Tech Stack

-   **Frontend**:
    -   [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    -   [Vite](https://vitejs.dev/) (Build tool)
    -   [Ant Design](https://ant.design/) (UI Component Library)
    -   [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework)
    -   [Vitest](https://vitest.dev/) (Unit Testing Framework)
-   **Backend**:
    -   [Tauri](https://tauri.app/) (Rust-based application framework)

## Download

You can download the latest version of OpenVizUI from the [Releases Page](https://github.com/silvancoder/openvizui/releases).

## Getting Started

### Prerequisites

Ensure you have the following installed:

-   [Node.js](https://nodejs.org/) (LTS version recommended)
-   [Rust](https://www.rust-lang.org/tools/install) (latest stable)

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/silvancoder/openvizui.git
    cd openvizui
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Development Scripts

The following scripts are available in `package.json`:

-   **`npm run dev`**:
    Starts the frontend development server (Vite). useful for UI development in browser.
    ```bash
    npm run dev
    ```

-   **`npm run tauri dev`**:
    Starts the full Tauri application in development mode.
    ```bash
    npm run tauri dev
    ```

-   **`npm run tauri build`**:
    Builds the frontend and backend for production.
    ```bash
    npm run tauri build
    ```

-   **`npm run test`**:
    Runs the unit tests using Vitest.
    ```bash
    npm run test
    ```

-   **`npm run coverage`**:
    Runs unit tests and generates a code coverage report.
    ```bash
    npm run coverage
    ```

## Project Structure

-   `src/`: React frontend source code.
-   `src-tauri/`: Rust backend source code and Tauri configuration.
-   `public/`: Static assets.

## Related Projects

-   [SteerDock - Another Docker GUI Management Platform](https://github.com/silvancoder/steerdock)

## License

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