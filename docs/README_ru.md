<div align="center">
  <p>
    <a href="../README.md">English</a> | <a href="README_zh.md">中文</a> | <a href="README_de.md">Deutsch</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_it.md">Italiano</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_pt.md">Português</a> | <a href="README_ru.md">Русский</a>
  </p>
</div>
<div align="center">
  <img src="../public/openvizui.png" alt="OpenVizUI Logo" width="400" height="80" />

  # OpenVizUI

  Современное настольное приложение, созданное с использованием **Tauri**, **React** и **Vite**.

  [![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri&logoColor=white)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Rust](https://img.shields.io/badge/Rust-1.77+-orange?logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
  ![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)

  [Официальный сайт](https://www.openvizui.com) | [GitHub Репозиторий](https://github.com/silvancoder/openvizui)
</div>

OpenVizUI — это современное настольное приложение, предоставляющее единый, красивый и эффективный интерфейс визуализации для инструментов AI CLI. Созданное с использованием [Tauri](https://tauri.app/), [React](https://react.dev/) и [Vite](https://vitejs.dev/), оно использует мощь Rust для бэкенда и гибкость React для управления вашими рабочими процессами ИИ — от управления навыками до сложных конфигураций.

## Технологический стек

-   **Фронтенд**:
    -   [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    -   [Vite](https://vitejs.dev/) (Инструмент сборки)
    -   [Ant Design](https://ant.design/) (Библиотека UI компонентов)
    -   [Tailwind CSS](https://tailwindcss.com/) (CSS фреймворк)
    -   [Vitest](https://vitest.dev/) (Фреймворк для модульного тестирования)
-   **Бэкенд**:
    -   [Tauri](https://tauri.app/) (Фреймворк приложений на базе Rust)

## Скачать

Вы можете скачать последнюю версию OpenVizUI со [страницы релизов](https://github.com/silvancoder/openvizui/releases).

## Начало работы

### Предварительные требования

Убедитесь, что у вас установлено следующее:

-   [Node.js](https://nodejs.org/) (рекомендуется версия LTS)
-   [Rust](https://www.rust-lang.org/tools/install) (последняя стабильная версия)

### Установка

1.  Клонируйте репозиторий:
    ```bash
    git clone https://github.com/silvancoder/openvizui.git
    cd openvizui
    ```

2.  Установите зависимости:
    ```bash
    npm install
    ```

## Скрипты разработки

Следующие скрипты доступны в `package.json`:

-   **`npm run dev`**:
    Запускает сервер разработки фронтенда (Vite). Полезно для разработки UI в браузере.
    ```bash
    npm run dev
    ```

-   **`npm run tauri dev`**:
    Запускает полное приложение Tauri в режиме разработки.
    ```bash
    npm run tauri dev
    ```

-   **`npm run tauri build`**:
    Собирает фронтенд и бэкенд для продакшна.
    ```bash
    npm run tauri build
    ```

-   **`npm run test`**:
    Запускает модульные тесты с использованием Vitest.
    ```bash
    npm run test
    ```

-   **`npm run coverage`**:
    Запускает модульные тесты и генерирует отчет о покрытии кода.
    ```bash
    npm run coverage
    ```

## Структура проекта

-   `src/`: Исходный код фронтенда React.
-   `src-tauri/`: Исходный код бэкенда Rust и конфигурация Tauri.
-   `public/`: Статические ресурсы.

## Related Projects

-   [SteerDock - Another Docker GUI Management Platform](https://github.com/silvancoder/steerdock)


## Лицензия

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
