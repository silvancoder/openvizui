/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\lib\tauri.ts
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { invoke } from '@tauri-apps/api/core';

export interface EnvironmentStatus {
    node_version: string | null;
    npm_version: string | null;
    git_version: string | null;
    python_version: string | null;
    go_version: string | null;
    java_version: string | null;
    gh_version: string | null;
    claude_version: string | null;
    opencode_version: string | null;
    qoder_version: string | null;
    codebuddy_version: string | null;
}

export const checkEnvironment = async (): Promise<EnvironmentStatus> => {
    try {
        return await invoke('check_environment');
    } catch (e) {
        console.warn("Tauri invoke failed, falling back to mock data (Browser Mode)", e);
        // Return mock data for browser preview
        return {
            node_version: "v20.11.0 (Mock)",
            npm_version: "10.2.4 (Mock)",
            git_version: "2.43.0.windows.1 (Mock)",
            python_version: "3.12.1 (Mock)",
            go_version: "go1.22.0 windows/amd64 (Mock)",
            java_version: "openjdk version \"21.0.2\" 2024-01-16 (Mock)",
            gh_version: "2.40.0 (Mock)",
            claude_version: "0.2.0 (Mock)",
            opencode_version: "1.0.0 (Mock)",
            qoder_version: "0.5.0 (Mock)",
            codebuddy_version: "0.1.0 (Mock)",
        };
    }
};

export const launchTool = async (toolId: string): Promise<string> => {
    try {
        return await invoke('launch_tool', { toolId });
    } catch (e) {
        console.warn("Launch failed (Browser Mode)", e);
        return `Mock Launched ${toolId}`;
    }
};

export interface ToolStatus {
    id: string;
    installed: boolean;
    version: string | null;
}

export const checkToolStatus = async (toolId: string): Promise<ToolStatus> => {
    try {
        return await invoke('check_tool_status', { toolId });
    } catch (e) {
        console.warn("Check status failed (Browser Mode)", e);
        return { id: toolId, installed: false, version: null };
    }
}

export const installTool = async (toolId: string): Promise<string> => {
    try {
        return await invoke('install_tool', { toolId });
    } catch (e) {
        console.warn("Install failed (Browser Mode)", e);
        return `Mock Installed ${toolId}`;
    }
};

export const uninstallTool = async (toolId: string): Promise<string> => {
    try {
        return await invoke('uninstall_tool', { toolId });
    } catch (e) {
        console.warn("Uninstall failed (Browser Mode)", e);
        return `Mock Uninstalled ${toolId}`;
    }
};

export const updateTool = async (toolId: string): Promise<string> => {
    try {
        return await invoke('update_tool', { toolId });
    } catch (e) {
        console.warn("Update failed (Browser Mode)", e);
        return `Mock Updated ${toolId}`;
    }
};

export interface AppConfig {
    proxy_type: string | null;
    proxy_address: string | null;
    theme: string | null;
    language: string | null;
    active_tools: string[] | null;
    primary_color: string | null;
    opacity: number | null;
    font_family: string | null;
    text_color: string | null;
    // Terminal settings
    terminal_font_family: string | null;
    terminal_font_size: number | null;
    terminal_background: string | null;
    terminal_foreground: string | null;
    terminal_cursor_style: string | null;
    terminal_shell: string | null;
    current_directory: string | null;
    active_tool_id: string | null;
    active_chat_tool_id: string | null;
    chat_providers: string[] | null;
    env_status: EnvironmentStatus | null;
    tool_statuses: Record<string, ToolStatus> | null;
    tool_configs: Record<string, { working_directory: string | null }> | null;
    global_instructions: string | null;
    local_ai_base_url: string | null;
    local_ai_provider: string | null;
    ide_path: string | null;
    command_presets: { id: string; name: string; command: string }[] | null;
}

export const getAppConfig = async (): Promise<AppConfig> => {
    try {
        return await invoke('get_app_config');
    } catch (e) {
        console.warn("Get Config failed (Browser Mode)", e);
        return {
            proxy_type: 'none',
            proxy_address: '',
            theme: 'light',
            language: 'en',
            active_tools: [],
            primary_color: '#1677ff',
            opacity: 1.0,
            font_family: 'Segoe UI',
            text_color: null,
            terminal_font_family: 'Cascadia Code',
            terminal_font_size: 14,
            terminal_background: '#1e1e1e',
            terminal_foreground: '#d4d4d4',
            terminal_cursor_style: 'block',
            terminal_shell: 'bash.exe',
            current_directory: null,
            active_tool_id: null,
            active_chat_tool_id: null,
            chat_providers: [],
            env_status: null,
            tool_statuses: null,
            tool_configs: null,
            global_instructions: null,
            local_ai_base_url: 'http://localhost:11434',
            local_ai_provider: 'ollama',
            ide_path: null,
            command_presets: []
        };
    }
};

export const saveAppConfig = async (config: AppConfig): Promise<void> => {
    try {
        await invoke('save_app_config', { config });
    } catch (e) {
        console.warn("Save Config failed (Browser Mode)", e);
    }
};

export const openUrl = async (url: string): Promise<void> => {
    try {
        await invoke('open_url', { url });
    } catch (e) {
        console.warn("Open URL failed", e);
        window.open(url, '_blank');
    }
};

export const ptyOpen = async (id: string, cols: number, rows: number): Promise<void> => {
    try {
        await invoke('pty_open', { id, cols, rows });
    } catch (e) {
        console.warn("PTY Open failed", e);
    }
};

export const ptyClose = async (id: string): Promise<void> => {
    try {
        await invoke('pty_close', { id });
    } catch (e) {
        console.warn("PTY Close failed", e);
    }
};

export const ptyWrite = async (id: string, data: string): Promise<void> => {
    try {
        await invoke('pty_write', { id, data });
    } catch (e) {
        console.warn("PTY Write failed", e);
    }
};

export const ptyResize = async (id: string, cols: number, rows: number): Promise<void> => {
    try {
        await invoke('pty_resize', { id, cols, rows });
    } catch (e) {
        console.warn("PTY Resize failed", e);
    }
};

export const ptyExists = async (id: string): Promise<boolean> => {
    try {
        return await invoke<boolean>('pty_exists', { id });
    } catch (e) {
        console.warn("PTY Exists check failed", e);
        return false;
    }
};

export const fetchRemoteModels = async (baseUrl: string, apiKey: string): Promise<string[]> => {
    try {
        return await invoke('fetch_remote_models', { baseUrl, apiKey });
    } catch (e) {
        console.warn("Fetch Models failed (Browser Mode)", e);
        // Mock data for browser
        return ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"];
    }
};

export interface SearchResult {
    file: string;
    line: number | null;
    content: string | null;
}

export const searchFiles = async (query: string, path: string, contentSearch: boolean): Promise<SearchResult[]> => {
    try {
        return await invoke('search_files', { query, path, contentSearch });
    } catch (e) {
        console.warn("Search failed (Browser Mode)", e);
        return [];
    }
}

export const getGitDiff = async (filePath: string): Promise<string> => {
    try {
        return await invoke('get_git_diff', { filePath });
    } catch (e) {
        console.warn("Get Diff failed (Browser Mode)", e);
        return `diff --git a/${filePath} b/${filePath}\nindex 0000000..0000000 100644\n--- a/${filePath}\n+++ b/${filePath}\n@@ -1 +1 @@\n-Mock Diff\n+Actual Diff Content`;
    }
}

export const getChangedFiles = async (): Promise<string[]> => {
    try {
        return await invoke('get_changed_files');
    } catch (e) {
        console.warn("Get Changed Files failed (Browser Mode)", e);
        return ["mock/file1.ts", "mock/file2.rs"];
    }
}

export const getSystemFonts = async (): Promise<string[]> => {
    try {
        return await invoke('get_system_fonts');
    } catch (e) {
        console.warn("Get System Fonts failed (Browser Mode)", e);
        return ["Arial", "Helvetica", "Times New Roman", "Courier New"];
    }
}

export interface McpInfo {
    path: string;
    name: string;
}

export const listInstalledSkills = async (target: string): Promise<McpInfo[]> => {
    try {
        return await invoke('list_installed_skills', { target });
    } catch (e) {
        console.warn("List Installed Skills failed (Browser Mode)", e);
        return [];
    }
}

export const installSkills = async (url: string, name: string | null, target: string): Promise<void> => {
    try {
        await invoke('install_skills', { url, name, target });
    } catch (e) {
        console.warn("Install Skills failed (Browser Mode)", e);
        throw e;
    }
}

export const getConfig = async (path: string): Promise<string> => {
    try {
        return await invoke('get_config_file', { path });
    } catch (e) {
        console.warn("Get Config failed (Browser Mode)", e);
        return "";
    }
}

export const saveConfig = async (path: string, content: string): Promise<void> => {
    try {
        await invoke('save_config_file', { path, content });
    } catch (e) {
        console.warn("Save Config failed (Browser Mode)", e);
        throw e;
    }
}

export const uninstallSkills = async (path: string): Promise<void> => {
    try {
        await invoke('uninstall_skills', { path });
    } catch (e) {
        console.warn("Uninstall Skills failed (Browser Mode)", e);
        throw e;
    }
}

export const openFolder = async (path: string): Promise<void> => {
    try {
        await invoke('open_folder', { path });
    } catch (e) {
        console.warn("Open Folder failed (Browser Mode)", e);
        throw e;
    }
}

export interface McpToolInfo {
    name: string;
    description: string | null;
}

export const inspectMcpServer = async (command: string, args: string[], env?: Record<string, string>): Promise<McpToolInfo[]> => {
    try {
        return await invoke('inspect_mcp_server', { command, args, env });
    } catch (e) {
        return [];
    }
}

export const getLocalModels = async (provider: string): Promise<string[]> => {
    try {
        return await invoke('get_models', { provider });
    } catch (e) {
        console.warn("Get Models failed (Browser Mode)", e);
        return [];
    }
}
