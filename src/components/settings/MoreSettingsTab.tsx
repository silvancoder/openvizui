/*
 * @Author: OpenVizUI Contributors
 * @FilePath: \src\components\settings\MoreSettingsTab.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { Card, Button, Input, List, Space, Row, Col, Modal, Form, Radio, Typography, message } from 'antd';
import { 
    InfoCircleOutlined, 
    SaveOutlined, 
    DeploymentUnitOutlined, 
    ThunderboltOutlined, 
    DashboardOutlined, 
    ExportOutlined, 
    ImportOutlined, 
    BookOutlined, 
    GlobalOutlined,
    CopyOutlined
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { save, open } from '@tauri-apps/plugin-dialog';
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';

const { Paragraph, Text } = Typography;

interface MoreSettingsTabProps {
    t: any;
    tools: any[];
}

const MoreSettingsTab = ({ t, tools }: MoreSettingsTabProps) => {
    const [config, setConfig] = useState<any>(null);
    const [diagnostics, setDiagnostics] = useState<any>(null);
    const [diagLoading, setDiagLoading] = useState(false);
    const [localTestLoading, setLocalTestLoading] = useState(false);
    const [form] = Form.useForm();

    useEffect(() => {
        loadAppConfig();
    }, []);

    const loadAppConfig = async () => {
        const cfg = await invoke<any>('get_app_config');
        setConfig(cfg);
        form.setFieldsValue({
            global_instructions: cfg.global_instructions,
            local_ai_base_url: cfg.local_ai_base_url,
            local_ai_provider: cfg.local_ai_provider
        });
    };

    const handleUpdateMore = async (values: any) => {
        try {
            const newConfig = { ...config, ...values };
            await invoke('save_app_config', { config: newConfig });
            setConfig(newConfig);
            message.success(t('aiSettings.moreConfigs.saved'));
        } catch (e) {
            message.error(t('aiSettings.mcpConfig.saveFailed') + e);
        }
    };

    const runDiagnostics = async () => {
        setDiagLoading(true);
        try {
            const status = await invoke<any>('check_environment');
            setDiagnostics(status);

            const report = `AI System Diagnostic Report (${new Date().toLocaleString()})
----------------------------------------
Node.js: ${status.node_version || 'Not Found'}
npm: ${status.npm_version || 'Not Found'}
Git: ${status.git_version || 'Not Found'}
Python: ${status.python_version || 'Not Found'}
Go: ${status.go_version || 'Not Found'}
Java: ${status.java_version || 'Not Found'}
----------------------------------------
Installed Tools:
${tools.map(tool => `- ${tool.displayName}`).join('\n')}
`;

            Modal.info({
                title: t('aiSettings.moreConfigs.diagnostics.reportTitle'),
                width: 600,
                content: (
                    <pre style={{ maxHeight: 400, overflow: 'auto', background: '#f5f5f5', padding: 12 }}>
                        {report}
                    </pre>
                ),
                okText: t('app.config', 'Close'),
                footer: (_, { OkBtn }) => (
                    <Space>
                        <Button
                            icon={<CopyOutlined />}
                            onClick={() => {
                                navigator.clipboard.writeText(report);
                                message.success(t('aiSettings.moreConfigs.diagnostics.copyBtn'));
                            }}
                        >
                            {t('aiSettings.moreConfigs.diagnostics.copyBtn')}
                        </Button>
                        <OkBtn />
                    </Space>
                )
            });
        } catch (e) {
            message.error(t('aiSettings.moreConfigs.diagnostics.failed', { error: String(e) }));
        } finally {
            setDiagLoading(false);
        }
    };

    const testLocalAI = async () => {
        const url = form.getFieldValue('local_ai_base_url');
        setLocalTestLoading(true);
        try {
            const response = await fetch(`${url}/api/tags`).catch(() => fetch(`${url}`));
            if (response.ok) {
                message.success(t('aiSettings.moreConfigs.localAI.checkSuccess'));
            } else {
                message.warning(t('aiSettings.moreConfigs.localAI.checkStatusError', { status: response.status }));
            }
        } catch (e) {
            message.error(t('aiSettings.moreConfigs.localAI.checkError'));
        } finally {
            setLocalTestLoading(false);
        }
    };

    const CLI_DOCS = [
        { name: 'Claude Code', url: 'https://code.claude.com/docs' },
        { name: 'Gemini CLI', url: 'https://geminicli.com/docs/' },
        { name: 'Copilot CLI', url: 'https://docs.github.com/en/copilot/concepts/agents/about-copilot-cli' },
        { name: 'OpenCode', url: 'https://opencode.ai/docs' },
        { name: 'Qoder CLI', url: 'https://docs.qoder.com/cli/using-cli' },
        { name: 'Codex CLI', url: 'https://developers.openai.com/codex/cli' },
        { name: 'CodeBuddy', url: 'https://www.codebuddy.ai/cli' },
    ];

    const handleExport = async () => {
        try {
            const allConfigs: Record<string, string> = {};
            for (const tool of tools) {
                try {
                    const content = await invoke<string>('get_config_file', { path: tool.configPath });
                    if (content) {
                        allConfigs[tool.displayName] = content;
                    }
                } catch (e) {
                    console.warn(`Failed to export ${tool.displayName}:`, e);
                }
            }

            const filePath = await save({
                filters: [{
                    name: 'JSON',
                    extensions: ['json']
                }],
                defaultPath: `antigravity_ai_configs_${new Date().toISOString().split('T')[0]}.json`
            });

            if (!filePath) return;

            await writeTextFile(filePath, JSON.stringify(allConfigs, null, 2));
            message.success(t('aiSettings.moreConfigs.export.success'));
        } catch (error) {
            console.error('Export failed:', error);
            message.error('Export failed: ' + error);
        }
    };

    const handleImport = async () => {
        try {
            const selected = await open({
                multiple: false,
                filters: [{
                    name: 'JSON',
                    extensions: ['json']
                }]
            });

            if (!selected || Array.isArray(selected)) return;

            const content = await readTextFile(selected);
            const allConfigs = JSON.parse(content);

            for (const [name, configContent] of Object.entries(allConfigs)) {
                const tool = tools.find(t => t.displayName === name);
                if (tool && typeof configContent === 'string') {
                    await invoke('save_config_file', { path: tool.configPath, content: configContent });
                }
            }
            message.success(t('aiSettings.moreConfigs.export.importSuccess'));
            setTimeout(() => window.location.reload(), 1500);
        } catch (error) {
            console.error('Import failed:', error);
            message.error('Import failed: ' + error);
        }
    };

    return (
        <div style={{ padding: '0 24px' }}>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleUpdateMore}
            >
                <Row gutter={[24, 24]}>
                    <Col xs={24} md={16}>
                        <Card
                            title={<span><InfoCircleOutlined /> {t('aiSettings.moreConfigs.instructions.title')}</span>}
                        >
                            <Paragraph type="secondary">
                                {t('aiSettings.moreConfigs.instructions.desc')}
                            </Paragraph>
                            <Form.Item name="global_instructions" noStyle>
                                <Input.TextArea
                                    rows={4}
                                    placeholder={t('aiSettings.moreConfigs.instructions.placeholder')}
                                />
                            </Form.Item>
                            <Button
                                type="primary"
                                style={{ marginTop: 16 }}
                                icon={<SaveOutlined />}
                                onClick={() => form.submit()}
                            >
                                {t('aiSettings.moreConfigs.instructions.saveBtn')}
                            </Button>
                        </Card>

                        <Card
                            title={<span><DeploymentUnitOutlined /> {t('aiSettings.moreConfigs.localAI.title')}</span>}
                            style={{ marginTop: 24 }}
                        >
                            <Paragraph type="secondary">
                                {t('aiSettings.moreConfigs.localAI.desc')}
                            </Paragraph>
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item name="local_ai_provider" label={t('aiSettings.moreConfigs.localAI.provider')}>
                                        <Radio.Group>
                                            <Radio value="ollama">Ollama</Radio>
                                            <Radio value="lm-studio">LM Studio</Radio>
                                        </Radio.Group>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="local_ai_base_url" label={t('aiSettings.moreConfigs.localAI.baseUrl')}>
                                        <Input placeholder="http://localhost:11434" />
                                    </Form.Item>
                                </Col>
                            </Row>
                            <Space>
                                <Button
                                    icon={<ThunderboltOutlined />}
                                    onClick={testLocalAI}
                                    loading={localTestLoading}
                                >
                                    {t('aiSettings.moreConfigs.localAI.checkBtn')}
                                </Button>
                                <Button
                                    type="primary"
                                    icon={<SaveOutlined />}
                                    onClick={() => form.submit()}
                                >
                                    {t('aiSettings.moreConfigs.instructions.saveBtn')}
                                </Button>
                            </Space>
                        </Card>

                        <Card
                            title={<span><DeploymentUnitOutlined /> {t('aiSettings.moreConfigs.diagnostics.title')}</span>}
                            style={{ marginTop: 24 }}
                        >
                            <Paragraph type="secondary">
                                {t('aiSettings.moreConfigs.diagnostics.desc')}
                            </Paragraph>
                            {diagnostics && (
                                <div style={{ marginBottom: 16, fontSize: '12px', color: '#8c8c8c' }}>
                                    <InfoCircleOutlined /> Last diagnostic run at: {new Date().toLocaleTimeString()}
                                </div>
                            )}
                            <Button
                                icon={<DashboardOutlined />}
                                onClick={runDiagnostics}
                                loading={diagLoading}
                            >
                                {t('aiSettings.moreConfigs.diagnostics.runBtn')}
                            </Button>
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card
                            title={<span><ExportOutlined /> {t('aiSettings.moreConfigs.export.title')}</span>}
                        >
                            <Paragraph type="secondary">
                                {t('aiSettings.moreConfigs.export.desc')}
                            </Paragraph>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Button
                                    block
                                    icon={<ExportOutlined />}
                                    onClick={handleExport}
                                >
                                    {t('aiSettings.moreConfigs.export.exportBtn')}
                                </Button>
                                <Button
                                    block
                                    icon={<ImportOutlined />}
                                    onClick={handleImport}
                                >
                                    {t('aiSettings.moreConfigs.export.importBtn')}
                                </Button>
                            </Space>
                        </Card>

                        <Card
                            title={<span><BookOutlined /> {t('aiSettings.moreConfigs.docs.title')}</span>}
                            styles={{ body: { padding: '12px 24px' } }}
                            style={{ marginTop: 24 }}
                        >
                             <List
                                 dataSource={CLI_DOCS}
                                 renderItem={item => (
                                     <List.Item
                                         style={{ flexWrap: 'nowrap' }}
                                         actions={[
                                             <Button
                                                 type="link"
                                                 size="small"
                                                 style={{ padding: '0 4px' }}
                                                 icon={<GlobalOutlined />}
                                                 onClick={() => invoke('open_url', { url: item.url })}
                                             >
                                                 {t('aiSettings.moreConfigs.docs.visit')}
                                             </Button>
                                         ]}
                                     >
                                         <List.Item.Meta
                                             title={<Text strong ellipsis={{ tooltip: item.name }}>{item.name}</Text>}
                                             avatar={<InfoCircleOutlined style={{ color: '#1890ff' }} />}
                                         />
                                     </List.Item>
                                 )}
                             />
                        </Card>
                    </Col>
                </Row>
            </Form>
        </div>
    );
};

export default MoreSettingsTab;
