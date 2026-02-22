import React, { useState, useEffect, useMemo } from 'react';
import { Card, List, Button, Typography, Tag, Space, message, Tooltip, Badge, Modal, Form, Input, Select, Row, Col, Segmented } from 'antd';
import { 
    PlusOutlined, 
    GlobalOutlined, 
    InfoCircleOutlined,
    RocketOutlined,
    FormOutlined,
    AppstoreOutlined,
    SafetyCertificateOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { invoke } from '@tauri-apps/api/core';

const { Text, Paragraph, Title } = Typography;

interface PluginSpec {
    command: string;
    args: string[];
    env?: Record<string, string>;
}

interface PluginInfo {
    key: string;
    repo?: string;
    url?: string;
    name?: string;
    desc?: string;
    type: 'mcp' | 'skill' | 'workflow';
    recommendedTool?: string;
    isCustom?: boolean;
    spec?: PluginSpec;
    docsUrl?: string; // Explicit documentation URL
}

const PluginManagement: React.FC = () => {
    const { t } = useTranslation();
    const [installedKeys, setInstalledKeys] = useState<string[]>([]);
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [customPlugins, setCustomPlugins] = useState<PluginInfo[]>([]);
    const [category, setCategory] = useState<string>('all');
    const [editingKey, setEditingKey] = useState<string | null>(null);

    const CURATED_PLUGINS: PluginInfo[] = [
        { 
            key: 'composio', 
            repo: 'ComposioHQ/composio', 
            type: 'mcp', 
            recommendedTool: 'Claude',
            spec: { command: 'npx', args: ['-y', '@composio/mcp-server'] }
        },
        { 
            key: 'mem', 
            repo: 'claudemem/claude-mem', 
            type: 'mcp', 
            recommendedTool: 'Claude',
            spec: { command: 'npx', args: ['-y', '@claudemem/mcp-server'] }
        },
        { 
            key: 'superpowers', 
            repo: 'superpowers/superpowers', 
            type: 'skill', 
            recommendedTool: 'Claude',
            url: 'https://github.com/superpowers/superpowers.git'
        },
        { 
            key: 'localReview', 
            repo: 'agencyenterprise/local-review', 
            type: 'mcp', 
            recommendedTool: 'Claude',
            spec: { command: 'npx', args: ['-y', '@agencyenterprise/local-review-mcp'] }
        },
        { 
            key: 'plannotator', 
            repo: 'm-onz/plannotator', 
            type: 'mcp', 
            recommendedTool: 'Claude',
            spec: { command: 'npx', args: ['-y', 'plannotator-mcp'] }
        },
        { 
            key: 'ralphWiggum', 
            repo: 'jpsim/RalphWiggum', 
            type: 'mcp', 
            recommendedTool: 'Claude',
            spec: { command: 'npx', args: ['-y', 'ralph-wiggum-mcp'] }
        },
        { 
            key: 'shipyard', 
            repo: 'shipyard/shipyard', 
            type: 'mcp', 
            recommendedTool: 'Claude',
            spec: { command: 'npx', args: ['-y', '@shipyard/mcp-server'] }
        },
        { 
            key: 'devBrowser', 
            repo: 'dev-browser/dev-browser', 
            type: 'mcp', 
            recommendedTool: 'Claude',
            spec: { command: 'npx', args: ['-y', '@dev-browser/mcp-server'] }
        },
        { 
            key: 'lsp', 
            repo: 'sourcegraph/cody', 
            type: 'mcp', 
            recommendedTool: 'Claude',
            spec: { command: 'npx', args: ['-y', '@sourcegraph/mcp-server-lsp'] }
        },
        { 
            key: 'peerReview', 
            repo: 'agent-peer-review/agent-peer-review', 
            type: 'mcp', 
            recommendedTool: 'Claude',
            spec: { command: 'npx', args: ['-y', 'agent-peer-review-mcp'] }
        },
    ];

    
    const STORAGE_KEY = 'openviz_custom_plugins';

    // Load custom plugins from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                setCustomPlugins(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved custom plugins", e);
            }
        }
    }, []);

    // Save custom plugins to localStorage when they change
    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customPlugins));
    }, [customPlugins]);
    
    // Config paths mapping (replicated from AISettings.tsx for logic consistency)
    const TOOLS_CONFIG = [
        { name: 'Claude', configPath: '~/.claude.json', type: 'json' },
        { name: 'Gemini', configPath: '~/.gemini/settings.json', type: 'json' },
        { name: 'OpenCode', configPath: '~/.config/opencode/opencode.json', type: 'json' },
        { name: 'Qoder', configPath: '~/.qoder.json', type: 'json' },
        { name: 'CodeBuddy', configPath: '~/.codebuddy/settings.json', type: 'json' },
        { name: 'Copilot', configPath: '~/.copilot/config.json', type: 'json' },
        { name: 'Codex', configPath: '~/.codex/config.toml', type: 'toml' },
    ];

    // Scan installed plugins status from actual configs
    useEffect(() => {
        const scanInstalled = async () => {
            const installed = new Set<string>();
            
            // 1. Scan Skills
            try {
                const skills = await invoke<any[]>('list_installed_skills', { target: 'agents' });
                skills.forEach(s => installed.add(s.name));
            } catch (e) {}

            // 2. Scan MCP Servers in all supported tools
            for (const tool of TOOLS_CONFIG) {
                try {
                    const content = await invoke<string>('get_config_file', { path: tool.configPath });
                    if (!content) continue;
                    const config = JSON.parse(content);
                    const mcpKey = tool.name === 'OpenCode' || tool.name === 'Qoder' ? 'mcp' : 
                                   tool.type === 'toml' ? 'mcp_servers' : 'mcpServers';
                    const servers = config[mcpKey] || {};
                    Object.keys(servers).forEach(key => installed.add(key));
                } catch (e) {}
            }

            setInstalledKeys(Array.from(installed));
        };
        scanInstalled();
    }, [customPlugins]); // Re-scan if custom plugins change

    const allPlugins = useMemo(() => {
        const merged = CURATED_PLUGINS.map(cp => {
            const override = customPlugins.find(p => p.key === cp.key);
            return override ? { ...cp, ...override } : cp;
        });
        const extra = customPlugins.filter(p => !CURATED_PLUGINS.some(cp => cp.key === p.key));
        return [...merged, ...extra];
    }, [customPlugins]); // CURATED_PLUGINS is a constant

    // Filter plugins based on category
    const filteredPlugins = category === 'installed' 
        ? allPlugins.filter(p => installedKeys.includes(p.key) || installedKeys.includes(p.repo?.split('/').pop() || ''))
        : allPlugins;

    const handleInstall = async (plugin: PluginInfo) => {
        setLoading((prev: Record<string, boolean>) => ({ ...prev, [plugin.key]: true }));
        const pluginName = plugin.isCustom ? plugin.name : t(`aiSettings.plugins.list.${plugin.key}.name`);
        
        try {
            if (plugin.type === 'skill') {
                const url = plugin.url || (plugin.repo ? `https://github.com/${plugin.repo}.git` : '');
                await invoke('install_skills', { url, name: plugin.key, target: 'agents' });
            } else if (plugin.type === 'mcp') {
                const toolName = plugin.recommendedTool || 'Claude';
                const tool = TOOLS_CONFIG.find(t => t.name === toolName);
                if (!tool) throw new Error(`Tool ${toolName} not found`);

                // Read current config
                const content = await invoke<string>('get_config_file', { path: tool.configPath });
                let config = JSON.parse(content || '{}');

                // Determine the correct key for MCP servers
                const mcpKey = toolName === 'OpenCode' || toolName === 'Qoder' ? 'mcp' : 
                               tool.type === 'toml' ? 'mcp_servers' : 'mcpServers';
                
                if (!config[mcpKey]) config[mcpKey] = {};

                // Add or update the server
                const command = plugin.spec?.command || (plugin.url?.startsWith('npx') ? 'npx' : plugin.url);
                const args = plugin.spec?.args || (plugin.url?.startsWith('npx') ? plugin.url.split(' ').slice(1) : []);
                
                config[mcpKey][plugin.key] = {
                    command,
                    args,
                    env: plugin.spec?.env || {}
                };

                // Save back
                await invoke('save_config_file', { path: tool.configPath, content: JSON.stringify(config, null, 2) });
            }

            message.success(t('app.messages.installed', { name: pluginName }));
            setInstalledKeys((prev: string[]) => [...prev, plugin.key]);
        } catch (error) {
            console.error(error);
            message.error(t('app.messages.installFailed', { name: pluginName, error: String(error) }));
        } finally {
            setLoading((prev: Record<string, boolean>) => ({ ...prev, [plugin.key]: false }));
        }
    };

    const handleUninstall = async (plugin: PluginInfo) => {
        setLoading((prev: Record<string, boolean>) => ({ ...prev, [plugin.key]: true }));
        const pluginName = plugin.isCustom ? plugin.name : t(`aiSettings.plugins.list.${plugin.key}.name`);
        
        try {
            if (plugin.type === 'skill') {
                const skills = await invoke<any[]>('list_installed_skills', { target: 'agents' });
                const target = Array.isArray(skills) ? skills.find(s => s.name === plugin.key) : null;
                if (target) {
                    await invoke('uninstall_skills', { path: target.path });
                }
            } else if (plugin.type === 'mcp') {
                const toolName = plugin.recommendedTool || 'Claude';
                const tool = TOOLS_CONFIG.find(t => t.name === toolName);
                if (tool) {
                    const content = await invoke<string>('get_config_file', { path: tool.configPath });
                    if (content) {
                        let config = JSON.parse(content);
                        const mcpKey = toolName === 'OpenCode' || toolName === 'Qoder' ? 'mcp' : 
                                       tool.type === 'toml' ? 'mcp_servers' : 'mcpServers';
                        if (config[mcpKey] && config[mcpKey][plugin.key]) {
                            delete config[mcpKey][plugin.key];
                            await invoke('save_config_file', { path: tool.configPath, content: JSON.stringify(config, null, 2) });
                        }
                    }
                }
            }

            message.success(t('app.messages.uninstalled', { name: pluginName }));
            setInstalledKeys((prev: string[]) => prev.filter(k => k !== plugin.key));
        } catch (error) {
            console.error(error);
            message.error(t('app.messages.uninstallFailed', { name: pluginName, error: String(error) }));
        } finally {
            setLoading((prev: Record<string, boolean>) => ({ ...prev, [plugin.key]: false }));
        }
    };

    const handleEdit = (plugin: PluginInfo) => {
        setEditingKey(plugin.key);
        form.setFieldsValue({
            name: plugin.name || t(`aiSettings.plugins.list.${plugin.key}.name`),
            desc: plugin.desc || t(`aiSettings.plugins.list.${plugin.key}.desc`),
            url: plugin.url,
            docsUrl: plugin.docsUrl,
            type: plugin.type,
            recommendedTool: plugin.recommendedTool
        });
        setIsModalVisible(true);
    };

    const handleSave = (values: any) => {
        if (editingKey) {
            // Update existing (could be a curated override or a custom plugin)
            setCustomPlugins((prev: PluginInfo[]) => {
                const existingIndex = prev.findIndex(p => p.key === editingKey);
                const newData = {
                    ...prev.find(p => p.key === editingKey),
                    name: values.name,
                    desc: values.desc,
                    url: values.url,
                    docsUrl: values.docsUrl,
                    type: values.type,
                    recommendedTool: values.recommendedTool,
                    key: editingKey,
                    isCustom: CURATED_PLUGINS.some(cp => cp.key === editingKey) ? false : true
                };

                if (existingIndex > -1) {
                    const newArr = [...prev];
                    newArr[existingIndex] = newData;
                    return newArr;
                } else {
                    return [newData, ...prev];
                }
            });
            message.success(t('aiSettings.moreConfigs.saved'));
        } else {
            // Add new custom plugin
            const newPlugin: PluginInfo = {
                key: `custom-${Date.now()}`,
                name: values.name,
                desc: values.desc,
                url: values.url,
                docsUrl: values.docsUrl,
                type: values.type,
                recommendedTool: values.recommendedTool,
                isCustom: true
            };
            setCustomPlugins((prev: PluginInfo[]) => [newPlugin, ...prev]);
            message.success(t('aiSettings.plugins.installed'));
        }
        
        setIsModalVisible(false);
        setEditingKey(null);
        form.resetFields();
    };

    const openUrl = (url?: string) => {
        if (url) {
            invoke('open_url', { url });
        }
    };

    return (
        <div style={{ padding: '0 24px 24px' }}>
            <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <Title level={3}>{t('aiSettings.tabs.plugins')}</Title>
                <Paragraph type="secondary">
                    {t('aiSettings.plugins.desc')}
                </Paragraph>
                <Space size="middle">
                    <Button 
                        type="primary" 
                        icon={<FormOutlined />} 
                        onClick={() => {
                            setEditingKey(null);
                            form.resetFields();
                            setIsModalVisible(true);
                        }}
                    >
                        {t('aiSettings.plugins.manualInstall')}
                    </Button>
                </Space>
            </div>

            <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
                <Segmented
                    value={category}
                    onChange={(val) => setCategory(val as string)}
                    options={[
                        {
                            label: t('aiSettings.plugins.categories.all'),
                            value: 'all',
                            icon: <AppstoreOutlined />,
                        },
                        {
                            label: t('aiSettings.plugins.categories.installed'),
                            value: 'installed',
                            icon: <SafetyCertificateOutlined />,
                        },
                    ]}
                />
            </div>

            <List
                grid={{
                    gutter: 16,
                    xs: 1,
                    sm: 1,
                    md: 2,
                    lg: 2,
                    xl: 3,
                    xxl: 3,
                }}
                dataSource={filteredPlugins}
                locale={{
                    emptyText: category === 'installed' ? t('aiSettings.plugins.empty.installed') : t('aiSettings.plugins.empty.available')
                }}
                renderItem={(item) => (
                    <List.Item>
                        <Card 
                            hoverable 
                            style={{ height: '100%', border: item.isCustom ? '1px dashed #1890ff' : undefined }}
                            actions={[
                                <Tooltip title={t('aiSettings.plugins.viewDocs')}>
                                    <Button 
                                        type="link" 
                                        icon={<GlobalOutlined />} 
                                        onClick={() => openUrl(item.docsUrl || item.url || (item.repo ? `https://github.com/${item.repo}` : undefined))}
                                        disabled={!item.docsUrl && !item.url && !item.repo}
                                    />
                                </Tooltip>,
                                <Tooltip title={t('aiSettings.mcpConfig.edit', 'Edit')}>
                                    <Button 
                                        type="link" 
                                        icon={<FormOutlined />} 
                                        onClick={() => handleEdit(item)}
                                    />
                                </Tooltip>,
                                installedKeys.includes(item.key) ? (
                                    <Button 
                                        type="text" 
                                        danger
                                        icon={<DeleteOutlined />} 
                                        loading={loading[item.key]}
                                        onClick={() => handleUninstall(item)}
                                    >
                                        {t('app.uninstall')}
                                    </Button>
                                ) : (
                                    <Button 
                                        type="primary" 
                                        ghost 
                                        icon={<PlusOutlined />} 
                                        loading={loading[item.key]}
                                        onClick={() => handleInstall(item)}
                                    >
                                        {t('aiSettings.plugins.install')}
                                    </Button>
                                )
                            ]}
                        >
                            <Card.Meta
                                avatar={
                                    <Badge count={item.isCustom ? 'Manual' : item.recommendedTool} offset={[10, 0]} color={item.isCustom ? 'cyan' : 'blue'}>
                                        <div style={{ 
                                            width: 48, 
                                            height: 48, 
                                            borderRadius: 8, 
                                            backgroundColor: '#f0f2f5',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 24
                                        }}>
                                            {item.isCustom ? <FormOutlined style={{ color: '#13c2c2' }} /> : <RocketOutlined style={{ color: '#1890ff' }} />}
                                        </div>
                                    </Badge>
                                }
                                title={
                                    <Tooltip title={item.name || t(`aiSettings.plugins.list.${item.key}.name`)}>
                                        <Text strong ellipsis style={{ maxWidth: '100%', display: 'block' }}>
                                            {item.name || t(`aiSettings.plugins.list.${item.key}.name`)}
                                        </Text>
                                    </Tooltip>
                                }
                                description={
                                    <Paragraph 
                                        ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
                                        type="secondary"
                                        style={{ height: 66, marginBottom: 0 }}
                                    >
                                        {item.desc || t(`aiSettings.plugins.list.${item.key}.desc`)}
                                    </Paragraph>
                                }
                            />
                            <div style={{ marginTop: 12 }}>
                                <Space size={[0, 4]} wrap>
                                    <Tag color="blue">{item.type.toUpperCase()}</Tag>
                                    {item.recommendedTool && (
                                        <Tag color="orange" icon={<InfoCircleOutlined />}>
                                            {t('aiSettings.plugins.recommendedFor', { tool: item.recommendedTool })}
                                        </Tag>
                                    )}
                                    {item.isCustom && <Tag color="cyan">{t('common.manual', 'Manual')}</Tag>}
                                </Space>
                            </div>
                        </Card>
                    </List.Item>
                )}
            />

            <Modal
                title={editingKey ? t('aiSettings.plugins.modal.editTitle') : t('aiSettings.plugins.modal.title')}
                open={isModalVisible}
                onCancel={() => {
                    setIsModalVisible(false);
                    setEditingKey(null);
                }}
                onOk={() => form.submit()}
                okText={editingKey ? t('common.save') : t('aiSettings.plugins.modal.addBtn')}
                cancelText={t('common.cancel')}
            >
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                    initialValues={{ type: 'mcp' }}
                >
                    <Form.Item
                        name="name"
                        label={t('aiSettings.plugins.modal.name')}
                        rules={[{ required: true, message: t('aiSettings.plugins.modal.namePlaceholder') }]}
                    >
                        <Input placeholder={t('aiSettings.plugins.modal.namePlaceholder')} />
                    </Form.Item>
                    <Form.Item
                        name="desc"
                        label={t('aiSettings.plugins.modal.desc')}
                    >
                        <Input.TextArea placeholder={t('aiSettings.plugins.modal.descPlaceholder')} rows={2} />
                    </Form.Item>
                    <Form.Item
                        name="url"
                        label={t('aiSettings.plugins.modal.url')}
                        rules={[{ required: true, message: t('aiSettings.plugins.modal.urlPlaceholder') }]}
                    >
                        <Input placeholder={t('aiSettings.plugins.modal.urlPlaceholder')} />
                    </Form.Item>
                    <Form.Item
                        name="docsUrl"
                        label={t('aiSettings.plugins.modal.docsUrl')}
                    >
                        <Input placeholder={t('aiSettings.plugins.modal.docsUrlPlaceholder')} />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item
                                name="type"
                                label={t('aiSettings.plugins.modal.type')}
                            >
                                <Select options={[
                                    { value: 'mcp', label: 'MCP' },
                                    { value: 'skill', label: 'Skill' },
                                    { value: 'workflow', label: 'Workflow' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item
                                name="recommendedTool"
                                label={t('aiSettings.plugins.modal.recommendedTool')}
                            >
                                <Select 
                                    allowClear
                                    placeholder="e.g. Claude"
                                    options={[
                                        { value: 'Claude', label: 'Claude' },
                                        { value: 'Gemini', label: 'Gemini' },
                                        { value: 'OpenCode', label: 'OpenCode' },
                                        { value: 'Copilot', label: 'Copilot' },
                                        { value: 'Qoder', label: 'Qoder' },
                                        { value: 'CodeBuddy', label: 'CodeBuddy' },
                                        { value: 'Codex', label: 'Codex' },
                                    ]} 
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </Form>
            </Modal>
        </div>
    );
};

export default PluginManagement;
