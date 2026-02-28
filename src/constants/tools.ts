/*
 * @Author: OpenVizUI Contributors
 * @FilePath: \src\constants\tools.ts
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

export interface ToolMetadata {
    id: string;
    nameKey: string; // i18n key like 'tools.claude'
    displayName: string;
    color: string;
    configPath: string;
    configType: 'json' | 'yaml' | 'toml';
    docsUrl: string;
    launchCommand: string;
}

export const TOOLS_METADATA: ToolMetadata[] = [
    {
        id: 'claude',
        nameKey: 'tools.claude',
        displayName: 'Claude',
        color: '#D97757',
        configPath: '~/.claude.json',
        configType: 'json',
        docsUrl: 'https://code.claude.com/docs',
        launchCommand: 'claude',
    },
    {
        id: 'google',
        nameKey: 'tools.google',
        displayName: 'Gemini',
        color: '#4285F4',
        configPath: '~/.gemini/settings.json',
        configType: 'json',
        docsUrl: 'https://geminicli.com/docs',
        launchCommand: 'gemini',
    },
    {
        id: 'opencode',
        nameKey: 'tools.opencode',
        displayName: 'OpenCode',
        color: '#0EA5E9',
        configPath: '~/.config/opencode/opencode.json',
        configType: 'json',
        docsUrl: 'https://opencode.ai/docs',
        launchCommand: 'opencode',
    },
    {
        id: 'qoder',
        nameKey: 'tools.qoder',
        displayName: 'Qoder',
        color: '#8B5CF6',
        configPath: '~/.qoder.json',
        configType: 'json',
        docsUrl: 'https://docs.qoder.com/cli/using-cli',
        launchCommand: 'qodercli',
    },
    {
        id: 'codebuddy',
        nameKey: 'tools.codebuddy',
        displayName: 'CodeBuddy',
        color: '#F59E0B',
        configPath: '~/.codebuddy/settings.json',
        configType: 'json',
        docsUrl: 'https://www.codebuddy.ai/docs/cli/overview',
        launchCommand: 'codebuddy',
    },
    {
        id: 'copilot',
        nameKey: 'tools.copilot',
        displayName: 'Copilot',
        color: '#6366F1',
        configPath: '~/.copilot/config.json',
        configType: 'json',
        docsUrl: 'https://docs.github.com/en/copilot/how-tos/copilot-cli',
        launchCommand: 'copilot',
    },
    {
        id: 'codex',
        nameKey: 'tools.codex',
        displayName: 'Codex',
        color: '#14B8A6',
        configPath: '~/.codex/config.toml',
        configType: 'toml',
        docsUrl: 'https://developers.openai.com/codex/cli',
        launchCommand: 'codex',
    },
];

export const getToolById = (id: string) => TOOLS_METADATA.find(t => t.id === id);
