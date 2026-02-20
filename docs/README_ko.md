<div align="center">
  <p>
    <a href="../README.md">English</a> | <a href="README_zh.md">中文</a> | <a href="README_de.md">Deutsch</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_it.md">Italiano</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_pt.md">Português</a> | <a href="README_ru.md">Русский</a>
  </p>
</div>
<div align="center">
  <img src="../public/openvizui.png" alt="OpenVizUI Logo" width="400" height="80" />

  # OpenVizUI

  **Tauri**, **React**, **Vite**로 구축된 최신 데스크톱 애플리케이션입니다.

  [![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri&logoColor=white)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Rust](https://img.shields.io/badge/Rust-1.77+-orange?logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
  ![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)

  [공식 웹사이트](https://www.openvizui.com) | [GitHub 리포지토리](https://github.com/silvancoder/openvizui)
</div>

OpenVizUI는 AI CLI 도구를 위한 통합되고 아름답으며 효율적인 시각화 인터페이스를 제공하는 최신 데스크톱 애플리케이션입니다. [Tauri](https://tauri.app/), [React](https://react.dev/), [Vite](https://vitejs.dev/)로 구축되었으며, Rust의 강력한 백엔드 성능과 React의 유연성을 활용하여 스킬 관리부터 복잡한 구성에 이르기까지 AI 워크플로우를 관리합니다.

## 기술 스택

-   **프론트엔드**:
    -   [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    -   [Vite](https://vitejs.dev/) (빌드 도구)
    -   [Ant Design](https://ant.design/) (UI 컴포넌트 라이브러리)
    -   [Tailwind CSS](https://tailwindcss.com/) (유틸리티 중심 CSS 프레임워크)
    -   [Vitest](https://vitest.dev/) (단위 테스트 프레임워크)
-   **백엔드**:
    -   [Tauri](https://tauri.app/) (Rust 기반 애플리케이션 프레임워크)

## 다운로드

[릴리스 페이지](https://github.com/silvancoder/openvizui/releases)에서 OpenVizUI 최신 버전을 다운로드할 수 있습니다.

## 시작하기

### 전제 조건

다음이 설치되어 있는지 확인하세요:

-   [Node.js](https://nodejs.org/) (LTS 버전 권장)
-   [Rust](https://www.rust-lang.org/tools/install) (최신 안정 버전)

### 설치

1.  리포지토리를 복제합니다:
    ```bash
    git clone https://github.com/silvancoder/openvizui.git
    cd openvizui
    ```

2.  의존성을 설치합니다:
    ```bash
    npm install
    ```

## 개발 스크립트

`package.json`에서 다음 스크립트를 사용할 수 있습니다:

-   **`npm run dev`**:
    프론트엔드 개발 서버(Vite)를 시작합니다. 브라우저에서의 UI 개발에 유용합니다.
    ```bash
    npm run dev
    ```

-   **`npm run tauri dev`**:
    전체 Tauri 애플리케이션을 개발 모드로 시작합니다.
    ```bash
    npm run tauri dev
    ```

-   **`npm run tauri build`**:
    프로덕션용 프론트엔드 및 백엔드를 빌드합니다.
    ```bash
    npm run tauri build
    ```

-   **`npm run test`**:
    Vitest를 사용하여 단위 테스트를 실행합니다.
    ```bash
    npm run test
    ```

-   **`npm run coverage`**:
    단위 테스트를 실행하고 코드 커버리지 보고서를 생성합니다.
    ```bash
    npm run coverage
    ```

## 프로젝트 구조

-   `src/`: React 프론트엔드 소스 코드.
-   `src-tauri/`: Rust 백엔드 소스 코드 및 Tauri 구성.
-   `public/`: 정적 리소스.

## Related Projects

-   [SteerDock - Another Docker GUI Management Platform](https://github.com/silvancoder/steerdock)

## 라이선스

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
