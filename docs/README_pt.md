<div align="center">
  <p>
    <a href="../README.md">English</a> | <a href="README_zh.md">中文</a> | <a href="README_de.md">Deutsch</a> | <a href="README_es.md">Español</a> | <a href="README_fr.md">Français</a> | <a href="README_it.md">Italiano</a> | <a href="README_ja.md">日本語</a> | <a href="README_ko.md">한국어</a> | <a href="README_pt.md">Português</a> | <a href="README_ru.md">Русский</a>
  </p>
</div>
<div align="center">
  <img src="../public/openvizui.png" alt="OpenVizUI Logo" width="400" height="80" />

  # OpenVizUI

  Uma aplicação desktop moderna construída com **Tauri**, **React** e **Vite**.

  [![Tauri](https://img.shields.io/badge/Tauri-2.0-blue?logo=tauri&logoColor=white)](https://tauri.app/)
  [![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
  [![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Rust](https://img.shields.io/badge/Rust-1.77+-orange?logo=rust&logoColor=white)](https://www.rust-lang.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![License](https://img.shields.io/badge/License-Apache%202.0-green.svg)](https://opensource.org/licenses/Apache-2.0)
  ![Test Coverage](https://img.shields.io/badge/coverage-100%25-brightgreen.svg)

  [Site Oficial](https://www.openvizui.com) | [Repositório GitHub](https://github.com/silvancoder/openvizui)
</div>

OpenVizUI é uma aplicação desktop moderna que fornece uma interface de visualização unificada, bonita e eficiente para ferramentas de CLI de IA. Construída com [Tauri](https://tauri.app/), [React](https://react.dev/) e [Vite](https://vitejs.dev/), aproveita o poder do Rust para o backend e a flexibilidade do React para gerenciar seus fluxos de trabalho de IA — desde o gerenciamento de habilidades até configurações complexas.

## Capturas de Tela

### 🛠️ Estação de Trabalho — Gerenciamento de Ferramentas AI

Gerencie todas as suas ferramentas AI CLI em um só lugar. Visualize status de instalação e informações de versão, e execute, atualize ou desinstale ferramentas com um único clique. Suporta Claude Code, Gemini, OpenCode, Qoder, GitHub Copilot e mais.

![Estação de Trabalho](ScreenShot_2026-02-21_134214_518.png)

### 🏪 Loja de Aplicativos — Ambiente de Desenvolvimento

Descubra e instale linguagens de programação, bancos de dados, servidores web, sistemas de cache e ferramentas de contêineres diretamente da Loja de Aplicativos integrada. Categorias: Linguagens, Serviços Web, Bancos de Dados, Cache & Fila, Ferramentas & Contêineres.

![Loja de Aplicativos](ScreenShot_2026-02-21_134225_527.png)

### 🤖 Configurações AI — Skills & Configuração MCP

Centralize toda a configuração AI em um painel. Gerencie skills instaladas, configure parâmetros CLI, configure servidores MCP, monitore atividades. Abas: Gerenciamento de Skills, Config CLI, Config MCP, Monitor de Skills, Monitor MCP.

![Configurações AI](ScreenShot_2026-02-21_134233_038.png)

## Funcionalidades Principais

| Funcionalidade | Descrição |
|----------------|------------|
| **Estação Multi-ferramenta** | Painel unificado para Claude Code, Gemini, OpenCode, Qoder, Copilot e Codex |
| **Loja de Aplicativos** | Instalação/desinstalação com um clique de ferramentas, linguagens, bancos de dados e serviços |
| **Configurações AI** | Gerenciamento de skills, configuração CLI, setup de servidores MCP e monitoramento ao vivo |
| **Terminal Integrado** | Terminal com multi-aba, árvore de arquivos, pesquisa global e comandos predefinidos |
| **Internacionalização** | Suporte completo de UI para 10 idiomas: PT, EN, ZH, DE, ES, FR, IT, JA, KO, RU |
| **Tema & Aparência** | Modo claro/escuro, cor primária personalizada, fonte e transparência de janela |
| **Ecossistema MCP** | Navegar, instalar e monitorar servidores e skills do Model Context Protocol |

## Stack Tecnológico

-   **Frontend**:
    -   [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
    -   [Vite](https://vitejs.dev/) (Ferramenta de build)
    -   [Ant Design](https://ant.design/) (Biblioteca de componentes UI)
    -   [Tailwind CSS](https://tailwindcss.com/) (Framework CSS utility-first)
    -   [Vitest](https://vitest.dev/) (Framework de testes unitários)
-   **Backend**:
    -   [Tauri](https://tauri.app/) (Framework de aplicação baseado em Rust)

## Baixar

Você pode baixar a versão mais recente do OpenVizUI na [Página de lançamentos](https://github.com/silvancoder/openvizui/releases).

## Começando

### Pré-requisitos

Certifique-se de ter o seguinte instalado:

-   [Node.js](https://nodejs.org/) (versão LTS recomendada)
-   [Rust](https://www.rust-lang.org/tools/install) (última estável)

### Instalação

1.  Clone o repositório:
    ```bash
    git clone https://github.com/silvancoder/openvizui.git
    cd openvizui
    ```

2.  Instale as dependências:
    ```bash
    npm install
    ```

## Scripts de Desenvolvimento

Os seguintes scripts estão disponíveis no `package.json`:

-   **`npm run dev`**:
    Inicia o servidor de desenvolvimento frontend (Vite). Útil para o desenvolvimento da UI no navegador.
    ```bash
    npm run dev
    ```

-   **`npm run tauri dev`**:
    Inicia a aplicação Tauri completa em modo de desenvolvimento.
    ```bash
    npm run tauri dev
    ```

-   **`npm run tauri build`**:
    Constrói o frontend e o backend para produção.
    ```bash
    npm run tauri build
    ```

-   **`npm run test`**:
    Executa os testes unitários usando Vitest.
    ```bash
    npm run test
    ```

-   **`npm run coverage`**:
    Executa testes unitários e gera um relatório de cobertura de código.
    ```bash
    npm run coverage
    ```

## Estrutura do Projeto

-   `src/`: Código-fonte frontend React.
-   `src-tauri/`: Código-fonte backend Rust e configuração Tauri.
-   `public/`: Ativos estáticos.

## Related Projects

-   [SteerDock - Another Docker GUI Management Platform](https://github.com/silvancoder/steerdock)

## Licença

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
