/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\OpenCodeAuthEditor.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, AutoComplete, message, Space, Alert, Tabs, Switch, InputNumber, Select, Row, Col, Divider } from 'antd';
import { SaveOutlined, KeyOutlined, EyeInvisibleOutlined, EyeOutlined, ReloadOutlined, SettingOutlined, CloudServerOutlined, SafetyOutlined, ExperimentOutlined, AppstoreOutlined, GlobalOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

const AUTH_CONFIG_PATH = '~/.local/share/opencode/auth.json';
const GENERAL_CONFIG_PATH = '~/.config/opencode/opencode.json';

interface AuthEntry {
    type: 'api';
    key: string;
    address?: string;
    description?: string;
}

interface AuthConfig {
    [provider: string]: AuthEntry;
}

export const PROVIDERS = [
    'OpenCode Zen',
    'Anthropic',
    'GitHub Copilot',
    'OpenAI',
    'Google',
    'OpenRouter',
    'Vercel AI Gateway',
    '302.AI',
    'AIHubMix',
    'Abacus',
    'Alibaba',
    'Alibaba(China)',
    'Amazon Bedrock',
    'Azure',
    'Azure Cognitive Services',
    'Bailing',
    'Baseten',
    'Berget.AI',
    'Cerebras',
    'Chutes',
    'Cloudflare AI Gateway',
    'Cloudflare Workers AI',
    'Cohere',
    'Cortecs',
    'Deep Infra',
    'DeepSeek',
    'FastRouter',
    'Fireworks AI',
    'Firmware',
    'Friendli',
    'GitHub Models',
    'GitLab Duo',
    'Groq',
    'Helicone',
    'Hugging Face',
    'IO.NET',
    'Inception',
    'Inference',
    'Kimi For Coding',
    'LMStudio',
    'Llama',
    'LucidQuery AI',
    'MiniMax(minimax.io)',
    'MiniMax(minimaxi.com)',
    'MiniMax Coding Plan(minimax.io)',
    'MiniMax Coding Plan(minimaxi.com)',
    'Mistral',
    'Moark',
    'ModelScope',
    'Moonshot AI',
    'Moonshot AI(China)',
    'Morph',
    'NanoGPT',
    'Nebius Token Factory',
    'Nova',
    'NovitaAI',
    'Nvidia',
    'OVHcloud AI Endpoints',
    'Ollama Cloud',
    'Perplexity',
    'Poe',
    'Privatemode AI',
    'Requesty',
    'SAP AI Core',
    'Scaleway',
    'SiliconFlow',
    'SiliconFlow(China)',
    'Synthetic',
    'Together AI',
    'Upstage',
    'Venice AI',
    'Vertex',
    'Vertex(Anthropic)',
    'Vivgrid',
    'Vultr',
    'Weights & Biases',
    'Xiaomi',
    'Z.AI',
    'Z.AI Coding Plan',
    'ZenMux',
    'Zhipu AI',
    'Zhipu AI Coding Plan',
    'iFlow',
    'submodel',
    'v0',
    'xAI',
    'Other'
];

const configAuthContentHasKey = (content: string | undefined, key: string) => {
    if (!content) return false;
    try {
        const parsed = JSON.parse(content);
        return !!parsed[key];
    } catch { return false; }
};

const OpenCodeAuthEditor: React.FC = () => {
    const { t } = useTranslation();
    const [authConfig, setAuthConfig] = useState<AuthConfig>({});
    const [generalConfig, setGeneralConfig] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [fetchProvider, setFetchProvider] = useState<string>('');
    const [modelList, setModelList] = useState<string[]>([]);
    const [form] = Form.useForm();

    const loadConfigs = async () => {
        setLoading(true);
        try {
            // Load Auth Config
            let firstAuthProvider = '';
            const authContent = await invoke<string>('get_config_file', { path: AUTH_CONFIG_PATH });
            if (authContent) {
                const parsed = JSON.parse(authContent);
                setAuthConfig(parsed);
                firstAuthProvider = Object.keys(parsed)[0];
            } else {
                setAuthConfig({});
            }

            // Load General Config
            const generalContent = await invoke<string>('get_config_file', { path: GENERAL_CONFIG_PATH });
            if (generalContent) {
                const parsed = JSON.parse(generalContent);
                setGeneralConfig(parsed);
                form.setFieldsValue(parsed);
                
                if (parsed.fetchFrom && configAuthContentHasKey(authContent, parsed.fetchFrom)) {
                     setFetchProvider(parsed.fetchFrom);
                } else if (firstAuthProvider) {
                     setFetchProvider(firstAuthProvider);
                     form.setFieldsValue({ fetchFrom: firstAuthProvider });
                }
            } else {
                setGeneralConfig({});
                form.resetFields();
                if (firstAuthProvider) {
                    setFetchProvider(firstAuthProvider);
                    form.setFieldsValue({ fetchFrom: firstAuthProvider });
                }
            }
        } catch (error) {
            console.error('Failed to load configs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfigs();
    }, []);

    const handleProviderChange = (provider: string) => {
        if (authConfig[provider]) {
            form.setFieldsValue({ 
                key: authConfig[provider].key,
                address: authConfig[provider].address || ''
            });
        } else {
            form.setFieldsValue({ key: '', address: '' });
        }
    };

    const fetchModels = async () => {
        if (!fetchProvider || !authConfig[fetchProvider]) {
            message.warning(t('aiSettings.mcpConfig.selectProviderFirst', 'Please select a provider first'));
            return;
        }

        const { key, address } = authConfig[fetchProvider];
        const providerName = fetchProvider;

        setFetchingModels(true);
        try {
            let models: string[] = [];
            if (address && key) {
                // Use remote fetch if address and key are provided
                models = await invoke<string[]>('fetch_remote_models', { 
                    baseUrl: address, 
                    apiKey: key, 
                    apiType: providerName.toLowerCase().includes('anthropic') ? 'anthropic' : 
                             providerName.toLowerCase().includes('google') ? 'google' : 'openai'
                });
            } else {
                // Fallback to local CLI command
                models = await invoke<string[]>('get_models', { provider: providerName });
            }
            setModelList(models);
            message.success(t('aiSettings.mcpConfig.modelsFetched', 'Fetched {{count}} models', { count: models.length }));
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.fetchModelsFailed', 'Failed to fetch models: ') + error);
        } finally {
            setFetchingModels(false);
        }
    };

    const handleSave = async (values: any) => {
        setLoading(true);
        try {
            // 1. Save Auth Config (if provider and key are present)
            if (values.provider && values.key) {
                const newAuthConfig = { ...authConfig };
                newAuthConfig[values.provider] = {
                    type: 'api',
                    key: values.key,
                    address: values.address
                };
                await invoke('save_config_file', { path: AUTH_CONFIG_PATH, content: JSON.stringify(newAuthConfig, null, 2) });
                setAuthConfig(newAuthConfig);
            }

            // 2. Save General Config
            const updatedConfig = {
                ...generalConfig,
                ...values,
                server: { ...(generalConfig.server || {}), ...(values.server || {}) },
                permission: { ...(generalConfig.permission || {}), ...(values.permission || {}) },
                compaction: { ...(generalConfig.compaction || {}), ...(values.compaction || {}) },
                tools: { ...(generalConfig.tools || {}), ...(values.tools || {}) }
            };
            // Clean up temporary form values that shouldn't go into opencode.json
            delete (updatedConfig as any).provider;
            delete (updatedConfig as any).key;
            delete (updatedConfig as any).address;

            await invoke('save_config_file', { path: GENERAL_CONFIG_PATH, content: JSON.stringify(updatedConfig, null, 2) });
            setGeneralConfig(updatedConfig);

            message.success(t('aiSettings.mcpConfig.saved', 'Settings saved successfully'));
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Failed to save settings:') + ' ' + error);
        } finally {
            setLoading(false);
        }
    };

    const authTab = (
        <div style={{ padding: '16px 0' }}>
            <Alert
                title={t('aiSettings.mcpConfig.savePathTip', { path: AUTH_CONFIG_PATH })}
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Form.Item
                name="provider"
                label={t('cliConfig.fields.providerName', 'Provider')}
            >
                <AutoComplete
                    options={PROVIDERS.map(p => ({ value: p }))}
                    placeholder={t('aiSettings.mcpConfig.selectProvider', 'Select or type provider name')}
                    filterOption={(inputValue, option) =>
                        (option?.value?.toString().toUpperCase().indexOf(inputValue.toUpperCase()) ?? -1) !== -1
                    }
                    onSelect={handleProviderChange}
                    onChange={handleProviderChange}
                />
            </Form.Item>
            <Form.Item
                name="key"
                label={t('cliConfig.fields.apiKey', 'API Key')}
            >
                <Input.Password
                    placeholder="sk-..."
                    iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                />
            </Form.Item>
            <Form.Item
                name="address"
                label={t('cliConfig.opencode.fields.address', 'Address')}
            >
                <Input placeholder="https://api.openai.com/v1" />
            </Form.Item>
        </div>
    );

    const generalTab = (
        <div style={{ padding: '16px 0' }}>
            <Row gutter={16} align="bottom">
                <Col span={12}>
                    <Form.Item name="fetchFrom" label={t('cliConfig.opencode.fields.fetchFrom', 'Fetch Models From')}>
                        <Select 
                            placeholder={t('aiSettings.mcpConfig.selectProvider', 'Select provider')}
                            options={Object.keys(authConfig).map(k => ({ label: k, value: k }))}
                            onChange={(v) => setFetchProvider(v)}
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item>
                        <Button 
                            type="primary"
                            icon={<CloudDownloadOutlined />} 
                            onClick={fetchModels} 
                            loading={fetchingModels}
                            block
                        >
                            {t('cliConfig.opencode.fields.readModels', 'Read Models')}
                        </Button>
                    </Form.Item>
                </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="theme" label={t('cliConfig.opencode.fields.theme', 'Theme')}>
                        <Select options={[{ label: 'OpenCode', value: 'opencode' }, { label: 'GitHub', value: 'github' }, { label: 'VS Code', value: 'vscode' }]} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="autoupdate" label={t('cliConfig.opencode.fields.autoupdate', 'Auto Update')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="model" label={t('cliConfig.opencode.fields.model', 'Primary Model')}>
                        <AutoComplete
                            options={modelList.map(m => ({ value: m }))}
                            placeholder="e.g. anthropic/claude-3-5-sonnet"
                        />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="small_model" label={t('cliConfig.opencode.fields.smallModel', 'Small Model')}>
                        <AutoComplete
                            options={modelList.map(m => ({ value: m }))}
                            placeholder="e.g. anthropic/claude-3-haiku"
                        />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="share" label={t('cliConfig.opencode.fields.share', 'Share Mode')}>
                        <Select options={[{ label: 'Manual', value: 'manual' }, { label: 'Auto', value: 'auto' }, { label: 'Disabled', value: 'disabled' }]} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="default_agent" label={t('cliConfig.opencode.fields.defaultAgent', 'Default Agent')}>
                        <Select options={[{ label: 'Plan', value: 'plan' }, { label: 'Act', value: 'act' }]} />
                    </Form.Item>
                </Col>
            </Row>
        </div>
    );

    const serverTab = (
        <div style={{ padding: '16px 0' }}>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name={['server', 'port']} label={t('cliConfig.opencode.fields.serverPort', 'Port')}>
                        <InputNumber style={{ width: '100%' }} min={1} max={65535} />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name={['server', 'hostname']} label={t('cliConfig.opencode.fields.serverHostname', 'Hostname')}>
                        <Input placeholder="localhost" />
                    </Form.Item>
                </Col>
            </Row>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name={['server', 'mdns']} label={t('cliConfig.opencode.fields.serverMdns', 'mDNS Discovery')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name={['server', 'mdnsDomain']} label={t('cliConfig.opencode.fields.serverMdnsDomain', 'mDNS Domain')}>
                        <Input placeholder="opencode.local" />
                    </Form.Item>
                </Col>
            </Row>
            <Form.Item name={['server', 'cors']} label={t('cliConfig.opencode.fields.serverCors', 'CORS Allowed Origins')}>
                <Select mode="tags" style={{ width: '100%' }} placeholder="http://localhost:5173" />
            </Form.Item>
        </div>
    );

    const permissionsTab = (
        <div style={{ padding: '16px 0' }}>
            <Alert title={t('cliConfig.opencode.sections.permissions', 'Permission Controls')} type="warning" showIcon style={{ marginBottom: 16 }} />
            <Row gutter={[16, 16]}>
                {[
                    { key: 'edit', label: t('cliConfig.opencode.fields.permEdit') },
                    { key: 'bash', label: t('cliConfig.opencode.fields.permBash') },
                    { key: 'read', label: t('cliConfig.opencode.fields.permRead') },
                    { key: 'grep', label: t('cliConfig.opencode.fields.permGrep') },
                    { key: 'glob', label: t('cliConfig.opencode.fields.permGlob') },
                    { key: 'list', label: t('cliConfig.opencode.fields.permList') },
                    { key: 'skill', label: t('cliConfig.opencode.fields.permSkill') },
                    { key: 'todowrite', label: t('cliConfig.opencode.fields.permTodoWrite') },
                    { key: 'todoread', label: t('cliConfig.opencode.fields.permTodoRead') },
                    { key: 'webfetch', label: t('cliConfig.opencode.fields.permWebFetch') },
                    { key: 'question', label: t('cliConfig.opencode.fields.permQuestion') },
                ].map(p => (
                    <Col span={8} key={p.key}>
                        <Form.Item name={['permission', p.key]} label={p.label}>
                            <Select options={[
                                { label: t('common.allow', 'Allow'), value: 'allow' },
                                { label: t('common.ask', 'Ask'), value: 'ask' },
                                { label: t('common.deny', 'Deny'), value: 'deny' }
                            ]} />
                        </Form.Item>
                    </Col>
                ))}
            </Row>
        </div>
    );

    const advancedTab = (
        <div style={{ padding: '16px 0' }}>
            <Divider orientation={"left" as any}><AppstoreOutlined /> {t('cliConfig.opencode.sections.advanced', 'Advanced Options')}</Divider>
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name={['tools', 'write']} label={t('cliConfig.opencode.fields.toolsWrite', 'Allow File Write')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name={['tools', 'bash']} label={t('cliConfig.opencode.fields.toolsBash', 'Allow Command Execution')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>
            </Row>
            <Divider />
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name={['compaction', 'auto']} label={t('cliConfig.opencode.fields.compactionAuto', 'Auto Compaction')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name={['compaction', 'prune']} label={t('cliConfig.opencode.fields.compactionPrune', 'Prune Context')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                </Col>
            </Row>
            <Divider />
            <Form.Item name="plugin" label={t('cliConfig.opencode.fields.plugins', 'Enabled Plugins')}>
                <Select mode="tags" style={{ width: '100%' }} placeholder="e.g. opencode-helicone-session" />
            </Form.Item>
            <Form.Item name="instructions" label={t('cliConfig.opencode.fields.instructions', 'Model Instructions')}>
                <Select mode="tags" style={{ width: '100%' }} placeholder="e.g. CONTRIBUTING.md" />
            </Form.Item>
        </div>
    );

    const tabsItems = [
        { key: 'auth', label: <span><KeyOutlined /> {t('cliConfig.opencode.sections.auth', 'Auth')}</span>, children: authTab },
        { key: 'general', label: <span><SettingOutlined /> {t('cliConfig.opencode.sections.general', 'General')}</span>, children: generalTab },
        { key: 'server', label: <span><CloudServerOutlined /> {t('cliConfig.opencode.sections.server', 'Server')}</span>, children: serverTab },
        { key: 'permissions', label: <span><SafetyOutlined /> {t('cliConfig.opencode.sections.permissions', 'Permissions')}</span>, children: permissionsTab },
        { key: 'advanced', label: <span><ExperimentOutlined /> {t('cliConfig.opencode.sections.advanced', 'Advanced')}</span>, children: advancedTab },
    ];

    return (
        <Card
            title={
                <Space>
                    <GlobalOutlined />
                    <span>OpenCode {t('common.settings', 'Settings')}</span>
                </Space>
            }
            extra={<Button icon={<ReloadOutlined />} onClick={loadConfigs} loading={loading} type="text" />}
            style={{ marginTop: 24, marginBottom: 24 }}
        >
            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Tabs defaultActiveKey="auth" items={tabsItems} />
                <Form.Item style={{ marginTop: 24 }}>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                        {t('aiSettings.mcpConfig.save', 'Save All Settings')}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default OpenCodeAuthEditor;
