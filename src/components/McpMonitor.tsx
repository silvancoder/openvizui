/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\McpMonitor.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Tag, Button, Space, Tooltip, message, Modal, List, Typography, Badge, Tabs } from 'antd';
import {
    ReloadOutlined,
    SearchOutlined,
    SyncOutlined,
    ToolOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import * as TOML from 'smol-toml';

const { Text, Paragraph } = Typography;

interface McpServerConfig {
    toolName: string;
    key: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
}

interface McpToolInfo {
    name: string;
    description?: string;
}

const McpMonitor: React.FC = () => {
    const { t } = useTranslation();
    const [servers, setServers] = useState<McpServerConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [inspectingKey, setInspectingKey] = useState<string | null>(null);
    const [statusMap, setStatusMap] = useState<Record<string, 'online' | 'offline' | 'error' | 'testing'>>({});
    const [toolsMap, setToolsMap] = useState<Record<string, McpToolInfo[]>>({});

    const TOOLS = [
        { name: 'Claude', configPath: '~/.claude.json', type: 'json' },
        { name: 'Gemini', configPath: '~/.gemini/settings.json', type: 'json' },
        { name: 'OpenCode', configPath: '~/.config/opencode/opencode.json', type: 'json' },
        { name: 'Qoder', configPath: '~/.qoder.json', type: 'json' },
        { name: 'CodeBuddy', configPath: '~/.codebuddy/settings.json', type: 'json' },
        { name: 'Copilot', configPath: '~/.copilot/config.json', type: 'json' },
        { name: 'Codex', configPath: '~/.codex/config.toml', type: 'toml' },
    ];

    const loadAllServers = async () => {
        setLoading(true);
        const allServers: McpServerConfig[] = [];
        try {
            for (const tool of TOOLS) {
                try {
                    const content = await invoke<string>('get_config_file', { path: tool.configPath });
                    if (!content) continue;

                    let config: any;
                    if (tool.type === 'toml') {
                        config = TOML.parse(content);
                    } else {
                        config = JSON.parse(content);
                    }

                    let rawServers: Record<string, any> = {};
                    if (tool.name === 'OpenCode' || tool.name === 'Qoder') {
                        rawServers = config.mcp || {};
                    } else if (tool.type === 'toml') {
                        rawServers = config.mcp_servers || {};
                    } else {
                        rawServers = config.mcpServers || {};
                    }

                    Object.entries(rawServers).forEach(([key, val]: [string, any]) => {
                        // Normalize format
                        let command = '';
                        let args: string[] = [];
                        let env: Record<string, string> | undefined = undefined;

                        if (tool.name === 'OpenCode') {
                            // OpenCode uses { type: "local", command: ["npx", "..."], environment: {} }
                            if (val.command && Array.isArray(val.command)) {
                                command = val.command[0];
                                args = val.command.slice(1);
                            }
                            env = val.environment;
                        } else {
                            // Standard format: { command: "...", args: [], env: {} }
                            command = val.command;
                            args = val.args || [];
                            env = val.env;
                        }

                        if (command) {
                            allServers.push({
                                toolName: tool.name,
                                key,
                                command,
                                args,
                                env
                            });
                        }
                    });
                } catch (e) {
                    console.warn(`Failed to parse config for ${tool.name}:`, e);
                }
            }
            setServers(allServers);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAllServers();
    }, []);

    const inspectServer = async (server: McpServerConfig) => {
        const id = `${server.toolName}-${server.key}`;
        setInspectingKey(id);
        setStatusMap(prev => ({ ...prev, [id]: 'testing' }));

        try {
            const tools = await invoke<McpToolInfo[]>('inspect_mcp_server', {
                command: server.command,
                args: server.args,
                env: server.env
            });
            setToolsMap(prev => ({ ...prev, [id]: tools }));
            setStatusMap(prev => ({ ...prev, [id]: 'online' }));
            message.success(t('aiSettings.mcpMonitor.serverOnline', { serverName: server.key, toolCount: tools.length }));
        } catch (error) {
            console.error('Inspection failed:', error);
            setStatusMap(prev => ({ ...prev, [id]: 'error' }));
            message.error(t('aiSettings.mcpMonitor.serverFailed', { serverName: server.key, error: String(error) }));
        } finally {
            setInspectingKey(null);
        }
    };

    const showTools = (server: McpServerConfig) => {
        const id = `${server.toolName}-${server.key}`;
        const tools = toolsMap[id] || [];

        Modal.info({
            title: t('aiSettings.mcpMonitor.toolsFrom', { serverName: server.key }),
            width: 600,
            content: (
                <div style={{ marginTop: 16 }}>
                    {tools.length === 0 ? (
                        <Text type="secondary">{t('aiSettings.mcpMonitor.noTools', 'No tools found or not inspected yet.')}</Text>
                    ) : (
                        <List
                            dataSource={tools}
                            renderItem={tool => (
                                <List.Item>
                                    <List.Item.Meta
                                        avatar={<ToolOutlined />}
                                        title={<Text strong>{tool.name}</Text>}
                                        description={tool.description || t('aiSettings.mcpMonitor.noDescription', 'No description provided')}
                                    />
                                </List.Item>
                            )}
                        />
                    )}
                </div>
            ),
            okText: t('aiSettings.mcpMonitor.close', 'Close')
        });
    };

    const columns = [
        {
            title: t('aiSettings.mcpMonitor.table.name', 'MCP Server'),
            key: 'name',
            render: (_: any, record: McpServerConfig) => (
                <Space direction="vertical" size={0}>
                    <Text strong>{record.key}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>{t('aiSettings.mcpMonitor.config', { name: record.toolName, defaultValue: `${record.toolName} Config` })}</Text>
                </Space>
            )
        },
        {
            title: t('aiSettings.mcpMonitor.table.command', 'Command'),
            key: 'command',
            render: (_: any, record: McpServerConfig) => (
                <Tooltip title={`${record.command} ${record.args.join(' ')}`}>
                    <Text code style={{ fontSize: 11 }}>{record.command} ...</Text>
                </Tooltip>
            )
        },
        {
            title: t('aiSettings.mcpMonitor.table.status', 'Status'),
            key: 'status',
            render: (_: any, record: McpServerConfig) => {
                const id = `${record.toolName}-${record.key}`;
                const status = statusMap[id];
                if (status === 'testing') return <Badge status="processing" text={t('aiSettings.mcpMonitor.status.testing', 'Testing')} />;
                if (status === 'online') return <Badge status="success" text={t('aiSettings.mcpMonitor.status.online', 'Online')} />;
                if (status === 'error') return <Badge status="error" text={t('aiSettings.mcpMonitor.status.error', 'Error')} />;
                return <Badge status="default" text={t('aiSettings.mcpMonitor.status.unknown', 'Unknown')} />;
            }
        },
        {
            title: t('aiSettings.mcpMonitor.table.tools', 'Tools'),
            key: 'tools',
            render: (_: any, record: McpServerConfig) => {
                const id = `${record.toolName}-${record.key}`;
                const count = toolsMap[id]?.length;
                return count !== undefined ? <Tag color="blue">{t('aiSettings.mcpMonitor.toolsCount', { count, defaultValue: `${count} tools` })}</Tag> : '-';
            }
        },
        {
            title: t('aiSettings.mcpMonitor.table.actions', 'Actions'),
            key: 'actions',
            render: (_: any, record: McpServerConfig) => {
                const id = `${record.toolName}-${record.key}`;
                return (
                    <Space>
                        <Button
                            size="small"
                            icon={statusMap[id] === 'testing' ? <SyncOutlined spin /> : <SearchOutlined />}
                            onClick={() => inspectServer(record)}
                            loading={inspectingKey === id}
                        >
                            {t('aiSettings.mcpMonitor.actions.test', 'Test')}
                        </Button>
                        <Button
                            size="small"
                            icon={<ToolOutlined />}
                            onClick={() => showTools(record)}
                            disabled={!toolsMap[id]}
                        >
                            {t('aiSettings.mcpMonitor.actions.tools', 'Tools')}
                        </Button>
                    </Space>
                );
            }
        }
    ];

    const [activeTab, setActiveTab] = useState('all');

    const filteredServers = activeTab === 'all'
        ? servers
        : servers.filter(s => s.toolName.toLowerCase() === activeTab.toLowerCase());

    return (
        <Card
            title={
                <Space>
                    <SyncOutlined />
                    <span>{t('aiSettings.mcpMonitor.title', 'MCP Server Monitoring')}</span>
                </Space>
            }
            extra={
                <Button
                    icon={<ReloadOutlined />}
                    onClick={loadAllServers}
                    loading={loading}
                >
                    {t('aiSettings.mcpMonitor.refresh', 'Refresh List')}
                </Button>
            }
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                    { key: 'all', label: t('common.all', 'All') },
                    ...TOOLS.map(tool => ({ key: tool.name.toLowerCase(), label: tool.name }))
                ]}
                style={{ marginBottom: 16 }}
            />
            <Table
                columns={columns}
                dataSource={filteredServers}
                rowKey={(record) => `${record.toolName}-${record.key}`}
                pagination={false}
                loading={loading}
                size="middle"
            />

            <div style={{ marginTop: 24 }}>
                <Card size="small" style={{ background: '#fafafa' }}>
                    <Space align="start">
                        <InfoCircleOutlined style={{ color: '#1890ff', marginTop: 4 }} />
                        <div>
                            <Text strong>{t('aiSettings.mcpMonitor.about.title', 'About MCP Monitoring')}</Text>
                            <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 0 }}>
                                {t('aiSettings.mcpMonitor.about.desc', 'This monitor scans your configuration files for AI tools and allows you to verify if the MCP servers (stdio) are working correctly.')}
                            </Paragraph>
                        </div>
                    </Space>
                </Card>
            </div>
        </Card>
    );
};

export default McpMonitor;
