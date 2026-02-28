/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\pages\AISettings.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { Typography, Tabs, message } from 'antd';
import * as TOML from 'smol-toml';
import { useTranslation } from 'react-i18next';
import { RobotOutlined } from '@ant-design/icons';
import { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';

import SkillsTab from '../components/settings/SkillsTab';
import CliConfigTab from '../components/settings/CliConfigTab';
import McpConfigTab from '../components/settings/McpConfigTab';
import MoreSettingsTab from '../components/settings/MoreSettingsTab';
import SkillMonitor from '../components/SkillMonitor';
import McpMonitor from '../components/McpMonitor';
import PluginManagement from '../components/PluginManagement';
import { TOOLS_METADATA } from '../constants/tools';
import type { McpInfo } from '../lib/tauri';

const { Title } = Typography;

const SPECIAL_TOOLS = ['Claude', 'Gemini', 'Copilot', 'Qoder', 'CodeBuddy', 'OpenCode', 'Codex'];

const AISettings = () => {
    const { t } = useTranslation();
    const [installedMcps, setInstalledMcps] = useState<McpInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [installUrl, setInstallUrl] = useState('');
    const [activeDir, setActiveDir] = useState<string>('agents');

    const POPULAR_SKILLS = [
        {
            name: t('aiSettings.popularPacks.findSkills.name', "Find Skills"),
            command: "npx skills add https://github.com/vercel-labs/skills.git --skill find-skills",
            desc: t('aiSettings.popularPacks.findSkills.desc', "Tools for searching and discovering available skills.")
        },
        {
            name: t('aiSettings.popularPacks.vercelBestPractices.name', "Vercel React Best Practices"),
            command: "npx skills add https://github.com/vercel-labs/agent-skills.git --skill vercel-react-best-practices",
            desc: t('aiSettings.popularPacks.vercelBestPractices.desc', "Official Vercel React development best practices.")
        },
        {
            name: t('aiSettings.popularPacks.webDesign.name', "Web Design Guidelines"),
            command: "npx skills add https://github.com/vercel-labs/agent-skills.git --skill web-design-guidelines",
            desc: t('aiSettings.popularPacks.webDesign.desc', "Modern Web design standards and guidelines.")
        },
        {
            name: t('aiSettings.popularPacks.remotion.name', "Remotion Best Practices"),
            command: "npx skills add https://github.com/remotion-dev/skills.git --skill remotion-best-practices",
            desc: t('aiSettings.popularPacks.remotion.desc', "Best practices for creating videos with React.")
        },
        {
            name: t('aiSettings.popularPacks.frontendDesign.name', "Frontend Design"),
            command: "npx skills add https://github.com/anthropics/skills.git --skill frontend-design",
            desc: t('aiSettings.popularPacks.frontendDesign.desc', "Frontend design patterns and implementation techniques.")
        },
        {
            name: t('aiSettings.popularPacks.composition.name', "Vercel Composition Patterns"),
            command: "npx skills add https://github.com/vercel-labs/agent-skills.git --skill vercel-composition-patterns",
            desc: t('aiSettings.popularPacks.composition.desc', "Vercel component composition patterns.")
        },
        {
            name: t('aiSettings.popularPacks.agentBrowser.name', "Agent Browser"),
            command: "npx skills add https://github.com/vercel-labs/agent-browser.git --skill agent-browser",
            desc: t('aiSettings.popularPacks.agentBrowser.desc', "Enable browser capabilities for Agents.")
        },
        {
            name: t('aiSettings.popularPacks.skillCreator.name', "Skill Creator"),
            command: "npx skills add https://github.com/anthropics/skills.git --skill skill-creator",
            desc: t('aiSettings.popularPacks.skillCreator.desc', "Tools to help create new Skills skills.")
        }
    ];

    const loadSkills = async () => {
        try {
            setLoading(true);
            const mcps = await invoke<McpInfo[]>('list_installed_skills', { target: activeDir });
            setInstalledMcps(mcps);
        } catch (error) {
            message.error(t('aiSettings.errors.loadFailed', 'Failed to load MCPs: ') + error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSkills();
    }, [activeDir]);

    const handleInstall = async (input: string) => {
        if (!input) {
            message.warning(t('aiSettings.warnings.enterUrl', 'Please enter a GitHub URL or npx command'));
            return;
        }

        let url = input;
        let name: string | undefined = undefined;

        if (input.startsWith('npx skills add')) {
            const parts = input.split(' ');
            const urlPart = parts.find(p => p.startsWith('http'));
            if (urlPart) url = urlPart;
            const skillIndex = parts.indexOf('--skill');
            if (skillIndex !== -1 && skillIndex + 1 < parts.length) {
                name = parts[skillIndex + 1];
            }
        }

        const key = 'installing';
        message.loading({ content: t('aiSettings.status.installing', 'Installing Skills...'), key });
        try {
            await invoke('install_skills', { url, name, target: activeDir });
            message.success({ content: t('aiSettings.status.installSuccess', 'Skills Installed Successfully!'), key, duration: 2 });
            setInstallUrl('');
            loadSkills();
        } catch (error) {
            message.error({ content: `${t('aiSettings.errors.installFailed', 'Installation failed: ')}${error}`, key, duration: 5 });
        }
    };

    const handleUninstall = async (path: string) => {
        try {
            await invoke('uninstall_skills', { path });
            message.success(t('aiSettings.status.uninstallSuccess', 'Skills Uninstalled'));
            loadSkills();
        } catch (error) {
            message.error(t('aiSettings.errors.uninstallFailed', 'Uninstall failed: ') + error);
        }
    };

    // --- Configuration State ---
    const [activeTool, setActiveTool] = useState<string>('Claude');
    const [configContent, setConfigContent] = useState<string>('');
    const [configLoading, setConfigLoading] = useState(false);
    const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
    const [activeTabKey, setActiveTabKey] = useState<string>('Skills');
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editingMcp, setEditingMcp] = useState<{ key: string, content: string } | null>(null);
    const [modalConfigContent, setModalConfigContent] = useState<string>('');

    // Quick adds constant for convenience
    const createCommand = (command: string, args: string[], env?: Record<string, string>) => {
        const isWindows = typeof window !== 'undefined' && navigator.userAgent.includes('Windows');
        if (isWindows && command === 'npx') {
            return { command: 'cmd', args: ['/c', 'npx', ...args], ...(env && { env }) };
        }
        return { command, args, ...(env && { env }) };
    };

    const QUICK_ADDS: Record<string, any> = {
        "filesystem": { ...createCommand("npx", ["-y", "@modelcontextprotocol/server-filesystem", "./"]), desc: 'aiSettings.mcpConfig.quickAdds.filesystem.desc' },
        "context7": { ...createCommand("npx", ["-y", "@upstash/context7-mcp", "--api-key", "ctx7sk-..."]), desc: 'aiSettings.mcpConfig.quickAdds.context7.desc' },
        "playwright": { ...createCommand("npx", ["-y", "@executeautomation/playwright-mcp-server"]), desc: 'aiSettings.mcpConfig.quickAdds.playwright.desc' },
        "browserTools": { ...createCommand("npx", ["-y", "@agentdeskai/browser-tools-mcp"]), desc: 'aiSettings.mcpConfig.quickAdds.browserTools.desc' },
        "gitmcp": { ...createCommand("npx", ["mcp-remote", "https://gitmcp.io/{owner}/{repo}"]), desc: 'aiSettings.mcpConfig.quickAdds.gitmcp.desc' },
        "everything": { ...createCommand("npx", ["-y", "@modelcontextprotocol/server-everything"]), desc: 'aiSettings.mcpConfig.quickAdds.everything.desc' },
        "firecrawl-mcp": { ...createCommand("npx", ["-y", "firecrawl-mcp"], { "FIRECRAWL_API_KEY": "YOUR-API-KEY" }), desc: 'aiSettings.mcpConfig.quickAdds.firecrawl.desc' },
        "mysql": {
            ...createCommand("npx", ["-y", "@f4ww4z/mcp-mysql-server"], {
                "MYSQL_HOST": "your_host", "MYSQL_USER": "your_user", "MYSQL_PASSWORD": "your_password", "MYSQL_DATABASE": "your_database"
            }), desc: 'aiSettings.mcpConfig.quickAdds.mysql.desc'
        }
    };

    const loadConfig = async () => {
        const tool = TOOLS_METADATA.find(t => t.displayName === activeTool);
        if (!tool) return;

        setConfigLoading(true);
        try {
            const content = await invoke<string>('get_config_file', { path: tool.configPath });
            setConfigContent(content);
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.loadFailed', 'Failed to load config for ') + `${tool.displayName}: ${error}`);
            setConfigContent('');
        } finally {
            setConfigLoading(false);
        }
    };

    const saveConfig = async () => {
        const tool = TOOLS_METADATA.find(t => t.displayName === activeTool);
        if (!tool) return;
        try {
            await invoke('save_config_file', { path: tool.configPath, content: configContent });
            message.success(t('aiSettings.mcpConfig.saved', 'Saved config for ') + tool.displayName);
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Failed to save config: ') + error);
        }
    };

    const handleQuickAdd = async (key: string) => {
        const tool = TOOLS_METADATA.find(t => t.displayName === activeTool);
        if (!tool) return;
        if (tool.configType === 'yaml') {
            message.warning(t('aiSettings.mcpConfig.quickAddWarningYAML', "Quick add does not support YAML yet."));
            setConfigContent(prev => prev + `\n# Quick Add: ${key}\n# Please configure manually\n`);
            return;
        }

        try {
            let currentConfig: any = {};
            if (configContent.trim()) {
                currentConfig = tool.configType === 'toml' ? TOML.parse(configContent) : JSON.parse(configContent);
            }

            const quickAddData = QUICK_ADDS[key];
            const mcpConfig = {
                type: "stdio", command: quickAddData.command, args: quickAddData.args || [],
                ...(quickAddData.env && { env: quickAddData.env })
            };

            if (activeTool === 'OpenCode' || activeTool === 'Qoder') {
                if (!currentConfig.mcp) currentConfig.mcp = {};
                if (activeTool === 'OpenCode' && !currentConfig['$schema']) currentConfig['$schema'] = "https://opencode.ai/config.json";
                if (currentConfig.mcp[key]) {
                    message.warning(`${key}` + t('aiSettings.mcpConfig.exists', ' already exists in config.'));
                    return;
                }
                currentConfig.mcp[key] = activeTool === 'OpenCode' ? {
                    type: "local", command: [quickAddData.command, ...(quickAddData.args || [])],
                    enabled: true, environment: quickAddData.env || {}
                } : QUICK_ADDS[key];
            } else if (activeTool === 'Claude') {
                if (!currentConfig.mcpServers) currentConfig.mcpServers = {};
                if (currentConfig.mcpServers[key]) {
                    message.warning(`${key}` + t('aiSettings.mcpConfig.exists', ' already exists in config.'));
                    return;
                }
                currentConfig.mcpServers[key] = QUICK_ADDS[key];
            } else if (tool.configType === 'toml') {
                if (!currentConfig.mcp_servers) currentConfig.mcp_servers = {};
                if (currentConfig.mcp_servers[key]) {
                    message.warning(`${key}` + t('aiSettings.mcpConfig.exists', ' already exists in config.'));
                    return;
                }
                currentConfig.mcp_servers[key] = mcpConfig;
            } else {
                if (!currentConfig.mcpServers) currentConfig.mcpServers = {};
                if (currentConfig.mcpServers[key]) {
                    message.warning(`${key}` + t('aiSettings.mcpConfig.exists', ' already exists in config.'));
                    return;
                }
                currentConfig.mcpServers[key] = QUICK_ADDS[key];
            }

            const newContent = tool.configType === 'toml' ? TOML.stringify(currentConfig) : JSON.stringify(currentConfig, null, 2);
            setConfigContent(newContent);
            await invoke('save_config_file', { path: tool.configPath, content: newContent });
            message.success(t('aiSettings.mcpConfig.addedAndSaved', { key, defaultValue: `Added and saved ${key} to config.` }));
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.addFailed', "Failed to add MCP. Please check syntax."));
        }
    };

    const handleMcpUninstall = async (key: string) => {
        const tool = TOOLS_METADATA.find(t => t.displayName === activeTool);
        if (!tool) return;
        if (tool.configType === 'yaml') {
            message.warning(t('aiSettings.mcpConfig.uninstallWarningYAML', "Uninstall does not support YAML files yet."));
            return;
        }

        try {
            let currentConfig = configContent.trim() ? (tool.configType === 'toml' ? TOML.parse(configContent) : JSON.parse(configContent)) : {};

            if (activeTool === 'OpenCode' || activeTool === 'Qoder') {
                if (currentConfig.mcp) delete currentConfig.mcp[key];
            } else if (tool.configType === 'toml') {
                if (currentConfig.mcp_servers) delete currentConfig.mcp_servers[key];
            } else {
                if (currentConfig.mcpServers) delete currentConfig.mcpServers[key];
            }

            const newContent = tool.configType === 'toml' ? TOML.stringify(currentConfig) : JSON.stringify(currentConfig, null, 2);
            setConfigContent(newContent);
            await invoke('save_config_file', { path: tool.configPath, content: newContent });
            message.success(t('aiSettings.mcpConfig.uninstalled', { key, defaultValue: `Uninstalled ${key} and saved config.` }));
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.uninstallFailed', "Failed to uninstall MCP."));
        }
    };

    const handleMcpEdit = (key: string) => {
        const tool = TOOLS_METADATA.find(t => t.displayName === activeTool);
        let config: any = {};
        try {
            config = tool?.configType === 'toml' ? TOML.parse(configContent) : JSON.parse(configContent);
        } catch (pErr) {
            message.error(t('aiSettings.mcpConfig.parseError', 'Failed to parse config. Please fix syntax errors first.'));
            return;
        }

        let servers = (activeTool === 'OpenCode' || activeTool === 'Qoder') ? config.mcp : (tool?.configType === 'toml' ? config.mcp_servers : config.mcpServers);
        servers = servers || {};

        if (servers[key]) {
            const content = tool?.configType === 'toml' ? TOML.stringify({ [key]: servers[key] }) : JSON.stringify(servers[key], null, 2);
            setEditingMcp({ key, content });
            setModalConfigContent(content);
            setEditModalVisible(true);
        }
    };

    const handleMcpSaveFromModal = async () => {
        if (!editingMcp) return;
        const tool = TOOLS_METADATA.find(t => t.displayName === activeTool);
        if (!tool) return;

        try {
            let currentConfig = tool.configType === 'toml' ? TOML.parse(configContent) : JSON.parse(configContent);
            let editedSnippet = tool.configType === 'toml' ? (TOML.parse(modalConfigContent) as any)[editingMcp.key] || Object.values(TOML.parse(modalConfigContent))[0] : JSON.parse(modalConfigContent);

            if (activeTool === 'OpenCode' || activeTool === 'Qoder') {
                if (!currentConfig.mcp) currentConfig.mcp = {};
                currentConfig.mcp[editingMcp.key] = editedSnippet;
            } else if (tool.configType === 'toml') {
                if (!currentConfig.mcp_servers) currentConfig.mcp_servers = {};
                currentConfig.mcp_servers[editingMcp.key] = editedSnippet;
            } else {
                if (!currentConfig.mcpServers) currentConfig.mcpServers = {};
                currentConfig.mcpServers[editingMcp.key] = editedSnippet;
            }

            const newContent = tool.configType === 'toml' ? TOML.stringify(currentConfig) : JSON.stringify(currentConfig, null, 2);
            setConfigContent(newContent);
            await invoke('save_config_file', { path: tool.configPath, content: newContent });
            message.success(t('aiSettings.mcpConfig.saved', 'Saved configuration.'));
            setEditModalVisible(false);
            setEditingMcp(null);
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Save failed: ') + error);
        }
    };

    useEffect(() => { loadConfig(); }, [activeTool]);

    const isInstalled = (key: string) => {
        try {
            if (!configContent.trim()) return false;
            const tool = TOOLS_METADATA.find(t => t.displayName === activeTool);
            const config = tool?.configType === 'toml' ? TOML.parse(configContent) : JSON.parse(configContent);
            if (activeTool === 'OpenCode' || activeTool === 'Qoder') return config.mcp && config.mcp[key];
            if (tool?.configType === 'toml') return config.mcp_servers && config.mcp_servers[key];
            return config.mcpServers && config.mcpServers[key];
        } catch { return false; }
    };

    const installedMcpList = useMemo(() => {
        try {
            if (!configContent.trim()) return [];
            const tool = TOOLS_METADATA.find(t => t.displayName === activeTool);
            const config = tool?.configType === 'toml' ? TOML.parse(configContent) : JSON.parse(configContent);
            const servers = (activeTool === 'OpenCode' || activeTool === 'Qoder') ? config.mcp : (tool?.configType === 'toml' ? config.mcp_servers : config.mcpServers);
            return Object.entries(servers || {}).map(([key, value]: [string, any]) => ({
                key, command: value.command || 'Unknown', args: value.args || [],
                desc: QUICK_ADDS[key] ? t(QUICK_ADDS[key].desc) : 'Custom Configuration'
            }));
        } catch { return []; }
    }, [configContent, activeTool]);

    return (
        <div style={{ margin: '0 auto', width: '100%', height: '100%', overflowY: 'auto' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
                <Title level={2}><RobotOutlined /> {t('aiSettings.title', 'AI Settings')}</Title>
                <Tabs
                    activeKey={activeTabKey}
                    onChange={(key) => setActiveTabKey(key)}
                    items={[
                        {
                            key: 'Skills',
                            label: t('aiSettings.tabs.skills', 'Skills Management'),
                            children: (
                                <SkillsTab
                                    t={t} installedMcps={installedMcps} activeDir={activeDir} setActiveDir={setActiveDir}
                                    loadSkills={loadSkills} loading={loading} installUrl={installUrl} setInstallUrl={setInstallUrl}
                                    handleInstall={handleInstall} handleUninstall={handleUninstall} popularSkills={POPULAR_SKILLS}
                                    tools={TOOLS_METADATA}
                                />
                            )
                        },
                        {
                            key: 'CliConfig',
                            label: t('aiSettings.tabs.cliConfig', 'CLI Config'),
                            children: (
                                <CliConfigTab
                                    t={t} activeTool={activeTool} setActiveTool={setActiveTool} tools={TOOLS_METADATA}
                                    viewMode={viewMode} setViewMode={setViewMode} configContent={configContent}
                                    setConfigContent={setConfigContent} configLoading={configLoading} loadConfig={loadConfig}
                                    saveConfig={saveConfig} specialTools={SPECIAL_TOOLS}
                                />
                            )
                        },
                        {
                            key: 'McpConfig',
                            label: t('aiSettings.tabs.mcpConfig', 'MCP Config'),
                            children: (
                                <McpConfigTab
                                    t={t} installedMcpList={installedMcpList} activeTool={activeTool} setActiveTool={setActiveTool}
                                    tools={TOOLS_METADATA} loadConfig={loadConfig} quickAdds={QUICK_ADDS} isInstalled={isInstalled}
                                    handleQuickAdd={handleQuickAdd} handleMcpUninstall={handleMcpUninstall} handleMcpEdit={handleMcpEdit}
                                    editModalVisible={editModalVisible} setEditModalVisible={setEditModalVisible} editingMcp={editingMcp}
                                    modalConfigContent={modalConfigContent} setModalConfigContent={setModalConfigContent} handleMcpSaveFromModal={handleMcpSaveFromModal}
                                />
                            )
                        },
                        {
                            key: 'SkillMonitor',
                            label: t('aiSettings.tabs.skillMonitor', 'Skill Monitor'),
                            children: <div style={{ padding: '0 24px' }}><SkillMonitor /></div>
                        },
                        {
                            key: 'McpMonitor',
                            label: t('aiSettings.tabs.mcpMonitor', 'MCP Monitor'),
                            children: <div style={{ padding: '0 24px' }}><McpMonitor /></div>
                        },
                        {
                            key: 'PluginManagement',
                            label: t('aiSettings.tabs.plugins', 'Plugins Monitor'),
                            children: <div style={{ padding: '0 24px' }}><PluginManagement /></div>
                        },
                        {
                            key: 'more',
                            label: t('aiSettings.tabs.more', 'More Settings'),
                            children: <MoreSettingsTab t={t} tools={TOOLS_METADATA} />
                        }
                    ]}
                />
            </div>
        </div>
    );
};

export default AISettings;
