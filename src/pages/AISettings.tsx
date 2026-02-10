/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\pages\AISettings.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { Typography, Tabs, Card, List, Button, Input, message, Popconfirm, Tag, Empty, Space, Row, Col, Select, Segmented, Modal } from 'antd';
import * as TOML from 'smol-toml';
import { useTranslation } from 'react-i18next';
import {
    RobotOutlined,
    AppstoreAddOutlined,
    GithubOutlined,
    DeleteOutlined,
    EditOutlined,
    ReloadOutlined,
    CloudDownloadOutlined,
    FolderOpenOutlined,
    GlobalOutlined,
    CodeOutlined,
    SettingOutlined,
    SaveOutlined
} from '@ant-design/icons';
import { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/core';
import VisualConfigEditor from '../components/VisualConfigEditor';
import OpenCodeAuthEditor from '../components/OpenCodeAuthEditor';
import CodexAuthEditor from '../components/CodexAuthEditor';
import ClaudeCodeAuthEditor from '../components/ClaudeCodeAuthEditor';
import GeminiAuthEditor from '../components/GeminiAuthEditor';
import CopilotAuthEditor from '../components/CopilotAuthEditor';
import QoderAuthEditor from '../components/QoderAuthEditor';
import CodebuddyAuthEditor from '../components/CodebuddyAuthEditor';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

// Tools that have their own specialized editors
const SPECIAL_TOOLS = ['Claude', 'Gemini', 'Copilot', 'Qoder', 'CodeBuddy', 'OpenCode', 'Codex'];

interface McpInfo {
    path: string;
    name: string;
}

const AISettings = () => {
    const { t } = useTranslation();
    const [installedMcps, setInstalledMcps] = useState<McpInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [installUrl, setInstallUrl] = useState('');
    const [activeDir, setActiveDir] = useState<string>('agents');

    // Popular skills list for quick install (unchanged)
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
        // ... include other skills if needed, truncated for brevity but in real file we keep them or import them.
        // For the sake of the file replacement, I will include the full list to avoid losing data.
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

    interface McpTool {
        name: string;
        configPath: string;
        type: 'json' | 'yaml' | 'toml';
    }

    const TOOLS: McpTool[] = [
        { name: 'Claude', configPath: '~/.claude.json', type: 'json' },
        { name: 'Gemini', configPath: '~/.gemini/settings.json', type: 'json' },
        { name: 'OpenCode', configPath: '~/.config/opencode/opencode.json', type: 'json' },
        { name: 'Qoder', configPath: '~/.qoder.json', type: 'json' },
        { name: 'CodeBuddy', configPath: '~/.codebuddy/settings.json', type: 'json' },
        { name: 'Copilot', configPath: '~/.copilot/config.json', type: 'json' },
        { name: 'Codex', configPath: '~/.codex/config.toml', type: 'toml' },
    ];

    // Helper function to create command for Windows compatibility
    const createCommand = (command: string, args: string[], env?: Record<string, string>) => {
        const isWindows = typeof window !== 'undefined' && navigator.userAgent.includes('Windows');

        if (isWindows && command === 'npx') {
            return {
                command: 'cmd',
                args: ['/c', 'npx', ...args],
                ...(env && { env })
            };
        }

        return {
            command,
            args,
            ...(env && { env })
        };
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
                "MYSQL_HOST": "your_host",
                "MYSQL_USER": "your_user",
                "MYSQL_PASSWORD": "your_password",
                "MYSQL_DATABASE": "your_database"
            }), desc: 'aiSettings.mcpConfig.quickAdds.mysql.desc'
        }
    };

    const loadConfig = async () => {
        const tool = TOOLS.find(t => t.name === activeTool);
        if (!tool) return;

        setConfigLoading(true);
        try {
            const content = await invoke<string>('get_config_file', { path: tool.configPath });
            setConfigContent(content);
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.loadFailed', 'Failed to load config for ') + `${tool.name}: ${error}`);
            setConfigContent('');
        } finally {
            setConfigLoading(false);
        }
    };

    const saveConfig = async () => {
        const tool = TOOLS.find(t => t.name === activeTool);
        if (!tool) return;
        try {
            await invoke('save_config_file', { path: tool.configPath, content: configContent });
            message.success(t('aiSettings.mcpConfig.saved', 'Saved config for ') + tool.name);
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Failed to save config: ') + error);
        }
    };

    const handleQuickAdd = async (key: string) => {
        const tool = TOOLS.find(t => t.name === activeTool);
        if (!tool) return;
        if (tool.type === 'yaml') {
            message.warning(t('aiSettings.mcpConfig.quickAddWarningYAML', "Quick add does not support YAML yet."));
            const yamlSnippet = `\n# Quick Add: ${key}\n# Please configure manually\n`;
            setConfigContent(prev => prev + yamlSnippet);
            return;
        }

        try {
            let currentConfig: any = {};
            if (configContent.trim()) {
                if (tool.type === 'toml') {
                    currentConfig = TOML.parse(configContent);
                } else {
                    currentConfig = JSON.parse(configContent);
                }
            }

            const quickAddData = QUICK_ADDS[key];
            const mcpConfig = {
                type: "stdio",
                command: quickAddData.command,
                args: quickAddData.args || [],
                ...(quickAddData.env && { env: quickAddData.env })
            };

            if (activeTool === 'OpenCode') {
                if (!currentConfig.mcp) currentConfig.mcp = {};
                if (!currentConfig['$schema']) currentConfig['$schema'] = "https://opencode.ai/config.json";
                if (currentConfig.mcp[key]) {
                    message.warning(`${key}` + t('aiSettings.mcpConfig.exists', ' already exists in config.'));
                    return;
                }
                currentConfig.mcp[key] = {
                    type: "local",
                    command: [quickAddData.command, ...(quickAddData.args || [])],
                    enabled: true,
                    environment: quickAddData.env || {}
                };
            } else if (activeTool === 'Qoder') {
                if (!currentConfig.mcp) currentConfig.mcp = {};
                if (currentConfig.mcp[key]) {
                    message.warning(`${key}` + t('aiSettings.mcpConfig.exists', ' already exists in config.'));
                    return;
                }
                currentConfig.mcp[key] = QUICK_ADDS[key];
            } else if (activeTool === 'Claude') {
                if (!currentConfig.mcpServers) currentConfig.mcpServers = {};
                if (currentConfig.mcpServers[key]) {
                    message.warning(`${key}` + t('aiSettings.mcpConfig.exists', ' already exists in config.'));
                    return;
                }
                currentConfig.mcpServers[key] = QUICK_ADDS[key];
            } else if (tool.type === 'toml') {
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

            let newContent: string;
            if (tool.type === 'toml') {
                newContent = TOML.stringify(currentConfig);
            } else {
                newContent = JSON.stringify(currentConfig, null, 2);
            }

            setConfigContent(newContent);

            // Auto-save
            await invoke('save_config_file', { path: tool.configPath, content: newContent });
            message.success(t('aiSettings.mcpConfig.addedAndSaved', { key, defaultValue: `Added and saved ${key} to config.` }));
        } catch (error) {
            console.error('Quick Add Error:', error);
            message.error(t('aiSettings.mcpConfig.addFailed', "Failed to add MCP. Please check syntax."));
        }
    };

    const handleMcpUninstall = async (key: string) => {
        const tool = TOOLS.find(t => t.name === activeTool);
        if (!tool) return;
        if (tool.type === 'yaml') {
            message.warning(t('aiSettings.mcpConfig.uninstallWarningYAML', "Uninstall does not support YAML files yet."));
            return;
        }

        try {
            let currentConfig: any = {};
            if (configContent.trim()) {
                if (tool.type === 'toml') {
                    currentConfig = TOML.parse(configContent);
                } else {
                    currentConfig = JSON.parse(configContent);
                }
            }

            if (activeTool === 'OpenCode' || activeTool === 'Qoder') {
                if (currentConfig.mcp && currentConfig.mcp[key]) {
                    delete currentConfig.mcp[key];
                }
            } else if (tool.type === 'toml') {
                if (currentConfig.mcp_servers && currentConfig.mcp_servers[key]) {
                    delete currentConfig.mcp_servers[key];
                }
            } else {
                if (currentConfig.mcpServers && currentConfig.mcpServers[key]) {
                    delete currentConfig.mcpServers[key];
                }
            }

            let newContent: string;
            if (tool.type === 'toml') {
                newContent = TOML.stringify(currentConfig);
            } else {
                newContent = JSON.stringify(currentConfig, null, 2);
            }

            setConfigContent(newContent);

            // Auto-save after uninstall
            await invoke('save_config_file', { path: tool.configPath, content: newContent });
            message.success(t('aiSettings.mcpConfig.uninstalled', { key, defaultValue: `Uninstalled ${key} and saved config.` }));
        } catch (error) {
            console.error('Uninstall Error:', error);
            message.error(t('aiSettings.mcpConfig.uninstallFailed', "Failed to uninstall MCP."));
        }
    };

    const handleMcpEdit = (key: string) => {
        try {
            const tool = TOOLS.find(t => t.name === activeTool);
            let config: Record<string, any> = {};
            try {
                config = tool?.type === 'toml' ? TOML.parse(configContent) : JSON.parse(configContent);
            } catch (pErr) {
                message.error(t('aiSettings.mcpConfig.parseError', 'Failed to parse config. Please fix syntax errors first.'));
                return;
            }

            let servers: Record<string, any> = {};
            if (activeTool === 'OpenCode' || activeTool === 'Qoder') {
                servers = config.mcp || {};
            } else if (tool?.type === 'toml') {
                servers = config.mcp_servers || {};
            } else {
                servers = config.mcpServers || {};
            }

            if (servers[key]) {
                const content = tool?.type === 'toml'
                    ? TOML.stringify({ [key]: servers[key] })
                    : JSON.stringify(servers[key], null, 2);
                setEditingMcp({ key, content });
                setModalConfigContent(content);
                setEditModalVisible(true);
            }
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.editError', 'Failed to open edit modal.'));
        }
    };

    const handleMcpSaveFromModal = async () => {
        if (!editingMcp) return;
        const tool = TOOLS.find(t => t.name === activeTool);
        if (!tool) return;

        try {
            let currentConfig: Record<string, any> = {};
            try {
                currentConfig = tool.type === 'toml' ? TOML.parse(configContent) : JSON.parse(configContent);
            } catch (pErr) {
                message.error(t('aiSettings.mcpConfig.parseError'));
                return;
            }

            let editedSnippet: Record<string, any>;
            try {
                if (tool.type === 'toml') {
                    const parsed = TOML.parse(modalConfigContent) as Record<string, any>;
                    // If the user edited [key] format, take the first entry or assume it's the key
                    editedSnippet = parsed[editingMcp.key] || Object.values(parsed)[0];
                } else {
                    editedSnippet = JSON.parse(modalConfigContent);
                }
            } catch (pErr) {
                message.error(t('aiSettings.mcpConfig.snippetParseError', 'Failed to parse edited snippet.'));
                return;
            }

            // Update the specific server
            if (activeTool === 'OpenCode' || activeTool === 'Qoder') {
                if (!currentConfig.mcp) currentConfig.mcp = {};
                currentConfig.mcp[editingMcp.key] = editedSnippet;
            } else if (tool.type === 'toml') {
                if (!currentConfig.mcp_servers) currentConfig.mcp_servers = {};
                currentConfig.mcp_servers[editingMcp.key] = editedSnippet;
            } else {
                if (!currentConfig.mcpServers) currentConfig.mcpServers = {};
                currentConfig.mcpServers[editingMcp.key] = editedSnippet;
            }

            const newContent = tool.type === 'toml'
                ? TOML.stringify(currentConfig)
                : JSON.stringify(currentConfig, null, 2);

            setConfigContent(newContent);
            await invoke('save_config_file', { path: tool.configPath, content: newContent });
            message.success(t('aiSettings.mcpConfig.saved', 'Saved configuration.'));
            setEditModalVisible(false);
            setEditingMcp(null);
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Save failed: ') + error);
        }
    };

    useEffect(() => {
        loadConfig();
    }, [activeTool]);

    const isInstalled = (key: string) => {
        try {
            if (!configContent.trim()) return false;
            const tool = TOOLS.find(t => t.name === activeTool);
            let config: any = {};
            try {
                config = tool?.type === 'toml' ? TOML.parse(configContent) : JSON.parse(configContent);
            } catch (pErr) {
                return false;
            }

            if (activeTool === 'OpenCode' || activeTool === 'Qoder') {
                return config.mcp && config.mcp[key];
            } else if (tool?.type === 'toml') {
                return config.mcp_servers && config.mcp_servers[key];
            }
            return config.mcpServers && config.mcpServers[key];
        } catch {
            return false;
        }
    };

    // --- Derived State for MCP List ---
    const installedMcpList = useMemo(() => {
        try {
            if (!configContent.trim()) return [];
            const tool = TOOLS.find(t => t.name === activeTool);
            let config: any = {};
            try {
                config = tool?.type === 'toml' ? TOML.parse(configContent) : JSON.parse(configContent);
            } catch (pErr) {
                console.warn('Config parse error in useMemo:', pErr);
                return [];
            }

            let servers = {};
            if (activeTool === 'OpenCode' || activeTool === 'Qoder') {
                servers = config.mcp || {};
            } else if (tool?.type === 'toml') {
                servers = config.mcp_servers || {};
            } else {
                servers = config.mcpServers || {};
            }
            return Object.entries(servers).map(([key, value]: [string, any]) => {
                const template = QUICK_ADDS[key];
                return {
                    key,
                    command: value.command || 'Unknown',
                    args: value.args || [],
                    desc: template ? t(template.desc) : 'Custom Configuration'
                };
            });
        } catch {
            return [];
        }
    }, [configContent, activeTool]);


    // --- Render Components moved outside for stability ---

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
                                    t={t}
                                    installedMcps={installedMcps}
                                    activeDir={activeDir}
                                    setActiveDir={setActiveDir}
                                    loadSkills={loadSkills}
                                    loading={loading}
                                    installUrl={installUrl}
                                    setInstallUrl={setInstallUrl}
                                    handleInstall={handleInstall}
                                    handleUninstall={handleUninstall}
                                    POPULAR_SKILLS={POPULAR_SKILLS}
                                    TOOLS={TOOLS}
                                />
                            )
                        },
                        {
                            key: 'CliConfig',
                            label: t('aiSettings.tabs.cliConfig', 'CLI Config'),
                            children: (
                                <CliConfigTab
                                    t={t}
                                    activeTool={activeTool}
                                    setActiveTool={setActiveTool}
                                    TOOLS={TOOLS}
                                    viewMode={viewMode}
                                    setViewMode={setViewMode}
                                    configContent={configContent}
                                    setConfigContent={setConfigContent}
                                    configLoading={configLoading}
                                    loadConfig={loadConfig}
                                    saveConfig={saveConfig}
                                />
                            )
                        },
                        {
                            key: 'McpConfig',
                            label: t('aiSettings.tabs.mcpConfig', 'MCP Config'),
                            children: (
                                <McpConfigTab
                                    t={t}
                                    installedMcpList={installedMcpList}
                                    activeTool={activeTool}
                                    setActiveTool={setActiveTool}
                                    TOOLS={TOOLS}
                                    loadConfig={loadConfig}
                                    QUICK_ADDS={QUICK_ADDS}
                                    isInstalled={isInstalled}
                                    handleQuickAdd={handleQuickAdd}
                                    handleMcpUninstall={handleMcpUninstall}
                                    handleMcpEdit={handleMcpEdit}
                                    editModalVisible={editModalVisible}
                                    setEditModalVisible={setEditModalVisible}
                                    editingMcp={editingMcp}
                                    modalConfigContent={modalConfigContent}
                                    setModalConfigContent={setModalConfigContent}
                                    handleMcpSaveFromModal={handleMcpSaveFromModal}
                                />
                            )
                        },
                        {
                            key: 'coming_soon',
                            label: t('aiSettings.tabs.more', 'More Settings'),
                            children: <Empty description={t('aiSettings.tabs.comingSoon', 'More AI settings coming soon...')} />
                        }
                    ]}
                />
            </div>
        </div>
    );
};

// --- Extracted Components ---

interface SkillsTabProps {
    t: any;
    installedMcps: McpInfo[];
    activeDir: string;
    setActiveDir: (dir: string) => void;
    loadSkills: () => void;
    loading: boolean;
    installUrl: string;
    setInstallUrl: (url: string) => void;
    handleInstall: (input: string) => void;
    handleUninstall: (path: string) => void;
    POPULAR_SKILLS: any[];
    TOOLS: any[];
}

const SkillsTab = ({
    t, installedMcps, activeDir, setActiveDir, loadSkills, loading,
    installUrl, setInstallUrl, handleInstall, handleUninstall, POPULAR_SKILLS, TOOLS
}: SkillsTabProps) => (
    <div style={{ padding: '0 24px' }}>
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={14}>
                <Card
                    title={
                        <Space>
                            <AppstoreAddOutlined />
                            <span>{t('aiSettings.installedTitle', 'Installed MCPs')}</span>
                            <Tag color="blue">{installedMcps.length}</Tag>
                        </Space>
                    }
                    extra={
                        <Space>
                            <Select
                                value={activeDir}
                                onChange={(val) => setActiveDir(val)}
                                options={[
                                    { label: '.agents (Default)', value: 'agents' },
                                    ...TOOLS.map(t => ({ label: `.${t.name.toLowerCase()}`, value: t.name.toLowerCase() }))
                                ]}
                                style={{ width: 160 }}
                            />
                            <Button icon={<ReloadOutlined />} onClick={loadSkills}>{t('aiSettings.refresh', 'Refresh')}</Button>
                        </Space>
                    }
                >
                    <List
                        loading={loading}
                        dataSource={installedMcps}
                        pagination={{ position: 'bottom', align: 'center', pageSize: 10 }}
                        locale={{ emptyText: <Empty description={t('aiSettings.noMcps', 'No MCPs installed yet')} /> }}
                        renderItem={item => (
                            <List.Item
                                actions={[
                                    <Popconfirm
                                        title={t('aiSettings.uninstallConfirmTitle', 'Confirm Uninstall')}
                                        description={t('aiSettings.uninstallConfirmDesc', 'Are you sure you want to remove this Skills?')}
                                        onConfirm={() => handleUninstall(item.path)}
                                        okText={t('common.confirm', 'Yes')}
                                        cancelText={t('common.cancel', 'No')}
                                    >
                                        <Button danger size="small" icon={<DeleteOutlined />}>{t('aiSettings.uninstall', 'Uninstall')}</Button>
                                    </Popconfirm>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<FolderOpenOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                    title={<Text strong>{item.name}</Text>}
                                    description={<Text type="secondary" style={{ fontSize: 12 }}>{item.path}</Text>}
                                />
                            </List.Item>
                        )}
                    />
                </Card>
                <Card title={t('aiSettings.quickInstallTitle', 'Quick Install')} style={{ marginTop: 24 }}>
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>{t('aiSettings.installViaUrl', 'Install via Command or URL')}</Text>
                        <Paragraph type="secondary" style={{ fontSize: 12 }}>
                            {t('aiSettings.installHint', 'Enter "npx skills add <url> --skill <name>" or just a GitHub URL.')}
                        </Paragraph>
                        <Search
                            placeholder="npx skills add https://github.com/owner/repo --skill name"
                            enterButton={t('aiSettings.install', 'Install')}
                            value={installUrl}
                            onChange={e => setInstallUrl(e.target.value)}
                            onSearch={handleInstall}
                            loading={loading}
                        />
                    </div>
                </Card>
            </Col>
            <Col xs={24} lg={10}>
                <Card title={<span><CloudDownloadOutlined /> {t('aiSettings.popularTitle', 'Popular MCPs')}</span>}>
                    <List
                        dataSource={POPULAR_SKILLS}
                        renderItem={item => (
                            <List.Item actions={[<Button type="link" icon={<CloudDownloadOutlined />} onClick={() => handleInstall(item.command)} disabled={loading}>{t('aiSettings.install', 'Install')}</Button>]}>
                                <List.Item.Meta
                                    avatar={<GithubOutlined style={{ fontSize: 20 }} />}
                                    title={<a href={item.command.split(' ')[3]?.replace('.git', '') || '#'} target="_blank" rel="noopener noreferrer">{item.name}</a>}
                                    description={item.desc}
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            </Col>
        </Row>
    </div>
);

interface CliConfigTabProps {
    t: any;
    activeTool: string;
    setActiveTool: (tool: string) => void;
    TOOLS: any[];
    viewMode: 'visual' | 'code';
    setViewMode: (mode: 'visual' | 'code') => void;
    configContent: string;
    setConfigContent: (content: string) => void;
    configLoading: boolean;
    loadConfig: () => void;
    saveConfig: () => void;
}

const CliConfigTab = ({
    t, activeTool, setActiveTool, TOOLS, viewMode, setViewMode,
    configContent, setConfigContent, configLoading, loadConfig, saveConfig
}: CliConfigTabProps) => (
    <Card
        title={
            <Space>
                <span>{t('aiSettings.mcpConfig.tool', 'CLI Tool')}:</span>
                <Select
                    value={activeTool}
                    onChange={(val: string) => setActiveTool(val)}
                    options={TOOLS.map(t => ({ label: t.name, value: t.name }))}
                    style={{ width: 120 }}
                    variant="filled"
                />
                <Segmented
                    options={[
                        { label: t('aiSettings.mcpConfig.view.visual', 'Visual'), value: 'visual' },
                        { label: t('aiSettings.mcpConfig.view.code', 'Code'), value: 'code' }
                    ]}
                    value={viewMode}
                    onChange={(val) => setViewMode(val as 'visual' | 'code')}
                />
            </Space>
        }
        extra={null}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
    >
        {activeTool === 'OpenCode' && <OpenCodeAuthEditor />}
        {activeTool === 'Codex' && <CodexAuthEditor />}
        {activeTool === 'Claude' && <ClaudeCodeAuthEditor />}
        {activeTool === 'Gemini' && <GeminiAuthEditor />}
        {activeTool === 'Copilot' && <CopilotAuthEditor />}
        {activeTool === 'Qoder' && <QoderAuthEditor />}
        {activeTool === 'CodeBuddy' && <CodebuddyAuthEditor />}
        
        {(!SPECIAL_TOOLS.includes(activeTool) || viewMode === 'code') && (
            <>
                <div style={{ marginBottom: 8, marginTop: SPECIAL_TOOLS.includes(activeTool) ? 16 : 0 }}>
                    <Text type="secondary">{t('aiSettings.mcpConfig.configPath', 'Config Path')}: {TOOLS.find(t => t.name === activeTool)?.configPath}</Text>
                </div>
                {viewMode === 'code' ? (
                    <Input.TextArea
                        value={configContent}
                        onChange={e => setConfigContent(e.target.value)}
                        style={{ flex: 1, fontFamily: 'monospace', minHeight: 400, resize: 'none' }}
                        spellCheck={false}
                        disabled={configLoading}
                    />
                ) : (
                    <VisualConfigEditor
                        toolName={activeTool}
                        configContent={configContent}
                        onChange={setConfigContent}
                    />
                )}
            </>
        )}

        {(!SPECIAL_TOOLS.includes(activeTool) || viewMode === 'code') && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button icon={<ReloadOutlined />} onClick={loadConfig}>{t('aiSettings.mcpConfig.reload', 'Reload')}</Button>
                <Button type="primary" onClick={saveConfig} icon={<SaveOutlined />} loading={configLoading}>{t('aiSettings.mcpConfig.save', 'Save Config')}</Button>
            </div>
        )}
    </Card>
);

interface McpConfigTabProps {
    t: any;
    installedMcpList: any[];
    activeTool: string;
    setActiveTool: (tool: string) => void;
    TOOLS: any[];
    loadConfig: () => void;
    QUICK_ADDS: Record<string, any>;
    isInstalled: (key: string) => boolean;
    handleQuickAdd: (key: string) => void;
    handleMcpUninstall: (key: string) => void;
    handleMcpEdit: (key: string) => void;
    editModalVisible: boolean;
    setEditModalVisible: (visible: boolean) => void;
    editingMcp: { key: string, content: string } | null;
    modalConfigContent: string;
    setModalConfigContent: (content: string) => void;
    handleMcpSaveFromModal: () => void;
}

const McpConfigTab = ({
    t, installedMcpList, activeTool, setActiveTool, TOOLS, loadConfig,
    QUICK_ADDS, isInstalled, handleQuickAdd, handleMcpUninstall, handleMcpEdit,
    editModalVisible, setEditModalVisible, editingMcp, modalConfigContent,
    setModalConfigContent, handleMcpSaveFromModal
}: McpConfigTabProps) => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Row gutter={[24, 24]} style={{ flex: 1, minHeight: 0 }}>
            <Col xs={24} md={12} style={{ height: '100%' }}>
                <Card
                    title={
                        <Space>
                            <SettingOutlined />
                            <span>{t('aiSettings.mcpConfig.configured', 'Configured MCPs')}</span>
                            <Tag color="cyan">{installedMcpList.length}</Tag>
                        </Space>
                    }
                    extra={
                        <Space>
                            <span>{t('aiSettings.mcpConfig.tool', 'CLI Tool')}:</span>
                            <Select
                                value={activeTool}
                                onChange={(val: string) => setActiveTool(val)}
                                options={TOOLS.map(t => ({ label: t.name, value: t.name }))}
                                style={{ width: 120 }}
                                variant="filled"
                            />
                            <Button icon={<ReloadOutlined />} onClick={loadConfig} size="small" />
                        </Space>
                    }
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    styles={{ body: { flex: 1, overflow: 'auto' } }}
                >
                    <List
                        dataSource={installedMcpList}
                        pagination={{ pageSize: 10, size: 'small' }}
                        locale={{ emptyText: <Empty description="No MCPs found in Configuration" /> }}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<CodeOutlined style={{ fontSize: 24, color: '#13c2c2' }} />}
                                    title={<Text strong>{item.key}</Text>}
                                    description={
                                        <div>
                                            {item.desc !== 'Custom Configuration' && <Tag color="green" style={{ marginBottom: 4 }}>Template</Tag>}
                                            <div style={{ fontSize: 12, color: '#888' }}>
                                                {item.desc}
                                            </div>
                                        </div>
                                    }
                                />
                                <Space>
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => handleMcpEdit(item.key)}
                                    />
                                    <Button
                                        size="small"
                                        danger
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleMcpUninstall(item.key)}
                                    />
                                </Space>
                            </List.Item>
                        )}
                    />
                </Card>
            </Col>
            <Col xs={24} md={12} style={{ height: '100%' }}>
                <Card title={t('aiSettings.mcpConfig.quickAdd', 'Quick Add MCP')} style={{ height: '100%', display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, overflow: 'auto' } }}>
                    <List
                        dataSource={Object.keys(QUICK_ADDS)}
                        pagination={{ pageSize: 10, size: 'small' }}
                        renderItem={key => {
                            const installed = isInstalled(key);
                            return (
                                <List.Item>
                                    <List.Item.Meta
                                        title={
                                            <Space>
                                                {key}
                                                {installed && <Tag color="green">{t('app.installed', 'Installed')}</Tag>}
                                            </Space>
                                        }
                                        description={t(QUICK_ADDS[key].desc)}
                                    />
                                    <Button
                                        size="small"
                                        type={installed ? 'default' : 'primary'}
                                        ghost={!installed}
                                        disabled={installed}
                                        onClick={() => handleQuickAdd(key)}
                                    >
                                        {installed ? t('app.installed', 'Installed') : t('common.add', 'Add')}
                                    </Button>
                                </List.Item>
                            );
                        }}
                    />
                </Card>
            </Col>
        </Row>
        <div style={{ marginTop: 16 }}>
            <Space wrap>
                <Button href="https://github.com/punkpeye/awesome-mcp-servers" target="_blank" icon={<GithubOutlined />}>{t('aiSettings.mcpConfig.links.awesome', 'Awesome MCP')}</Button>
                <Button href="https://github.com/modelcontextprotocol/" target="_blank" icon={<GithubOutlined />}>{t('aiSettings.mcpConfig.links.official', 'Official MCP')}</Button>
                <Button href="https://cursor.directory/" target="_blank" icon={<GlobalOutlined />}>{t('aiSettings.mcpConfig.links.cursor', 'Cursor Directory')}</Button>
                <Button href="https://mcp.so/zh" target="_blank" icon={<GlobalOutlined />}>{t('aiSettings.mcpConfig.links.chinese', 'MCP Chinese')}</Button>
            </Space>
        </div>

        <Modal
            title={(editingMcp ? `${t('aiSettings.mcpConfig.editTitle', 'Edit MCP Server')}: ${editingMcp.key}` : t('aiSettings.mcpConfig.editTitle', 'Edit MCP Server'))}
            open={editModalVisible}
            onOk={handleMcpSaveFromModal}
            onCancel={() => setEditModalVisible(false)}
            width={700}
            destroyOnClose
            okText={t('common.save', 'Save')}
            cancelText={t('common.cancel', 'Cancel')}
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary">{t('aiSettings.mcpConfig.editDesc', 'Update the configuration for this MCP server below.')}</Text>
            </div>
            <Input.TextArea
                value={modalConfigContent}
                onChange={(e) => setModalConfigContent(e.target.value)}
                autoSize={{ minRows: 10, maxRows: 20 }}
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
                spellCheck={false}
            />
        </Modal>
    </div>
);

export default AISettings;
