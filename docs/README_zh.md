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

  [官方网站](https://www.openvizui.com) | [Gitee 仓库](https://gitee.com/opcnlin/openvizui)
</div>

OpenVizUI 是一个现代桌面应用程序，为 AI CLI 工具提供了统一、美观且高效的可视化界面。它基于 [Tauri](https://tauri.app/)、[React](https://react.dev/) 和 [Vite](https://vitejs.dev/) 构建，利用 Rust 的后端能力和 React 的灵活性来管理您的 AI 工作流——从技能管理到复杂配置。

## 截图

### 🛠️ 工作台 — AI 工具管理

在一个界面统一管理所有 AI CLI 工具。查看安装状态、版本信息，并可一键运行、更新或卸载工具。支持 Claude Code、Gemini、OpenCode、Qoder、GitHub Copilot 等。

![工作台](openvizui-01.jpg)

### 🏪 应用商店 — 开发者环境

通过内置应用商店发现并安装编程语言、数据库、Web 服务器、缓存系统和容器工具。分类包括：语言、Web 服务、数据库、缓存与队列、工具与容器。

![应用商店](openvizui-02.jpg)

### 🤖 AI 设置 — 技能与 MCP 配置

在一个面板中集中管理所有 AI 配置。管理已安装的技能、配置 CLI 参数、设置 MCP 服务器、监控技能活动。包含：技能管理、CLI 配置、MCP 配置、插件管理、技能监控、MCP 监控等标签页。

![AI 设置](openvizui-03.jpg)

## 核心功能

| 功能 | 说明 |
|------|------|
| **多工具工作台** | 统一管理 Claude Code、Gemini、OpenCode、Qoder、Copilot 等工具 |
| **应用商店** | 一键安装/卸载开发工具、编程语言、数据库和服务 |
| **AI 对话界面** | 现代化的对话 UI，支持模型选择、文件上下文及终端集成 |
| **AI 设置** | 技能管理、CLI 配置、MCP 服务器设置及实时监控 |
| **集成终端** | 内置多标签终端，支持文件树、全局搜索和命令预设 |
| **国际化** | 完整 UI 支持 10 种语言：中英日韩德法西意葡俄 |
| **主题与外观** | 浅色/深色模式、自定义主色调、字体和窗口透明度 |
| **MCP 生态** | 浏览、安装和监控 Model Context Protocol 服务器与技能 |

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
-   `CHANGELOG.md`: [项目变更的详细历史记录](../CHANGELOG.md)。

## 更新日志

有关详细的变更历史，请参阅 [CHANGELOG.md](../CHANGELOG.md)。


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
