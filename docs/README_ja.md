<div align="center">
  <p>
    <a href="../README.md">English</a> | <a href="README_zh.md">中文</a> | <a href="README_de.md">Deutsch</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_it.md">Italiano</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_pt.md">Português</a> | <a href="README_ru.md">Русский</a>
  </p>
</div>
<div align="center">
  <img src="../public/openvizui.png" alt="OpenVizUI Logo" width="400" height="80" />

  # OpenVizUI

  **Tauri**、**React**、**Vite** で構築されたモダンなデスクトップアプリケーション。

  [![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri&logoColor=white)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Rust](https://img.shields.io/badge/Rust-1.77+-orange?logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
  ![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)

  [公式サイト](https://www.openvizui.com) | [GitHub リポジトリ](https://github.com/silvancoder/openvizui)
</div>

OpenVizUIは、AI CLIツールのための統一された、美しく、効率的な可視化インターフェースを提供する最新のデスクトップアプリケーションです。[Tauri](https://tauri.app/)、[React](https://react.dev/)、[Vite](https://vitejs.dev/)で構築されており、バックエンドにRustのパワーを、AIワークフローの管理（スキル管理から複雑な設定まで）にReactの柔軟性を活用しています。

## スクリーンショット

### 🛠️ ワークベンチ — AIツール管理

すべてのAI CLIツールを一か所で管理。インストール状態やバージョン情報を表示し、ワンクリックでツールを実行・更新・アンインストールできます。Claude Code、Gemini、OpenCode、Qoder、GitHub Copilotなどをサポート。

![ワークベンチ](ScreenShot_2026-02-21_134214_518.png)

### 🏪 アプリストア — 開発者環境

組み込みのアプリストアからプログラミング言語、データベース、Webサーバー、キャッシュシステム、コンテナツールを発見インストールできます。カテゴリー：言語、Webサービス、データベース、キャッシュ&キュー、ツール&コンテナ。

![アプリストア](ScreenShot_2026-02-21_134225_527.png)

### 🤖 AI設定 — スキル & MCP設定

すべてのAI設定を一つのパネルに集中。インストール済みスキルを管理し、CLIパラメータを設定し、MCPサーバーを構築し、スキルのアクティビティを監視。タブ：スキル管理、CLI設定、MCP設定、スキルMonitor、MCP Monitor。

![AI設定](ScreenShot_2026-02-21_134233_038.png)

## 主要機能

| 機能 | 説明 |
|------|------|
| **マルチツールワークベンチ** | Claude Code、Gemini、OpenCode、Qoder、Copilotなどを統合管理 |
| **アプリストア** | 開発ツール、言語、DB、サービスをワンクリックでインストール/アンインストール |
| **AI設定** | スキル管理、CLI設定、MCPサーバー設定、リアルタイム監視 |
| **統合ターミナル** | マルチタブターミナル、ファイルツリー、グローバル検索、コマンドプリセット |
| **国際化** | 10言語対応のUI：JA、EN、ZH、DE、ES、FR、IT、KO、PT、RU |
| **テーマ & 外観** | ライト/ダークモード、カスタムカラー、フォント、ウィンドウ透明度 |
| **MCPエコシステム** | Model Context Protocolサーバーとスキルを閲覧・インストール・監視 |

## 技術スタック

-   **フロントエンド**:
    -   [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    -   [Vite](https://vitejs.dev/) (ビルドツール)
    -   [Ant Design](https://ant.design/) (UI コンポーネントライブラリ)
    -   [Tailwind CSS](https://tailwindcss.com/) (ユーティリティファースト CSS フレームワーク)
    -   [Vitest](https://vitest.dev/) (ユニットテストフレームワーク)
-   **バックエンド**:
    -   [Tauri](https://tauri.app/) (Rust ベースのアプリケーションフレームワーク)

## ダウンロード

最新バージョンの OpenVizUI は [リリースページ](https://github.com/silvancoder/openvizui/releases) からダウンロードできます。

## はじめに

### 前提条件

以下がインストールされていることを確認してください：

-   [Node.js](https://nodejs.org/) (LTS バージョン推奨)
-   [Rust](https://www.rust-lang.org/tools/install) (最新の安定版)

### インストール

1.  リポジトリをクローンします：
    ```bash
    git clone https://github.com/silvancoder/openvizui.git
    cd openvizui
    ```

2.  依存関係をインストールします：
    ```bash
    npm install
    ```

## 開発スクリプト

`package.json` で以下のスクリプトが利用可能です：

-   **`npm run dev`**:
    フロントエンド開発サーバー (Vite) を起動します。ブラウザでの UI 開発に便利です。
    ```bash
    npm run dev
    ```

-   **`npm run tauri dev`**:
    完全な Tauri アプリケーションを開発モードで起動します。
    ```bash
    npm run tauri dev
    ```

-   **`npm run tauri build`**:
    本番環境用にフロントエンドとバックエンドをビルドします。
    ```bash
    npm run tauri build
    ```

-   **`npm run test`**:
    Vitest を使用してユニットテストを実行します。
    ```bash
    npm run test
    ```

-   **`npm run coverage`**:
    ユニットテストを実行し、コードカバレッジレポートを生成します。
    ```bash
    npm run coverage
    ```

## プロジェクト構造

-   `src/`: React フロントエンドのソースコード。
-   `src-tauri/`: Rust バックエンドのソースコードと Tauri 設定。
-   `public/`: 静的アセット。

## Related Projects

-   [SteerDock - Another Docker GUI Management Platform](https://github.com/silvancoder/steerdock)

## ライセンス

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
