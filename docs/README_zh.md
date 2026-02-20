<div align="center">
  <p>
    <a href="../README.md">English</a> | <a href="README_zh.md">中文</a> | <a href="README_de.md">Deutsch</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_it.md">Italiano</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_pt.md">Português</a> | <a href="README_ru.md">Русский</a>
  </p>
</div>
<div align="center">
  <img src="../public/openvizui.png" alt="OpenVizUI Logo" width="400" height="80" />

  # OpenVizUI

  基于 **Tauri**、**React** 和 **Vite** 构建的现代桌面应用程序。

  [![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri&logoColor=white)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Rust](https://img.shields.io/badge/Rust-1.77+-orange?logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
  ![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)

  [官方网站](https://www.openvizui.com) | [Gitee 仓库](https://gitee.com/opcnlin/openvizui
</div>

OpenVizUI 是一个现代桌面应用程序，为 AI CLI 工具提供了统一、美观且高效的可视化界面。它基于 [Tauri](https://tauri.app/)、[React](https://react.dev/) 和 [Vite](https://vitejs.dev/) 构建，利用 Rust 的后端能力和 React 的灵活性来管理您的 AI 工作流——从技能管理到复杂配置。

## 技术栈

-   **前端**:
    -   [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    -   [Vite](https://vitejs.dev/) (构建工具)
    -   [Ant Design](https://ant.design/) (UI 组件库)
    -   [Tailwind CSS](https://tailwindcss.com/) (实用优先的 CSS 框架)
    -   [Vitest](https://vitest.dev/) (单元测试框架)
-   **后端**:
    -   [Tauri](https://tauri.app/) (基于 Rust 的应用程序框架)

## 下载

您可以从 [Releases 页面](https://gitee.com/opcnlin/openvizui/releases) 下载最新版本的 OpenVizUI。

## 快速开始

###先决条件

确保已安装以下内容：

-   [Node.js](https://nodejs.org/) (推荐 LTS 版本)
-   [Rust](https://www.rust-lang.org/tools/install) (最新稳定版)

### 安装

1.  克隆仓库：
    ```bash
    git clone https://gitee.com/opcnlin/openvizui.git
    cd openvizui
    ```

2.  安装依赖：
    ```bash
    npm install
    ```

## 开发脚本

在 `package.json` 中提供了以下脚本：

-   **`npm run dev`**:
    启动前端开发服务器 (Vite)。用于在浏览器中进行 UI 开发。
    ```bash
    npm run dev
    ```

-   **`npm run tauri dev`**:
    在开发模式下启动完整的 Tauri 应用程序。
    ```bash
    npm run tauri dev
    ```

-   **`npm run tauri build`**:
    构建用于生产的前端和后端。
    ```bash
    npm run tauri build
    ```

-   **`npm run test`**:
    使用 Vitest 运行单元测试。
    ```bash
    npm run test
    ```

-   **`npm run coverage`**:
    运行单元测试并生成代码覆盖率报告。
    ```bash
    npm run coverage
    ```

## 项目结构

-   `src/`: React 前端源代码。
-   `src-tauri/`: Rust 后端源代码和 Tauri 配置。
-   `public/`: 静态资源。

## 相关项目

-   [SteerDock - 另一个 Docker 界面化管理平台](https://gitee.com/opcnlin/steerdock)

## 许可证

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
