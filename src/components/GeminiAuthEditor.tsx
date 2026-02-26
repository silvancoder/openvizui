/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\GeminiAuthEditor.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, message, Space, Alert, Tabs, Switch, InputNumber, Select, Divider, AutoComplete, Row, Col, Modal } from 'antd';
import { SaveOutlined, KeyOutlined, ReloadOutlined, SettingOutlined, SafetyOutlined, ExperimentOutlined, BugOutlined, CloudDownloadOutlined, GoogleOutlined, UserOutlined, AppstoreOutlined, FilterOutlined, HistoryOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';

const SETTINGS_PATH = '~/.gemini/settings.json';

const GeminiAuthEditor: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [models, setModels] = useState<string[]>([]);
    const [form] = Form.useForm();

    const checkLoginStatus = async () => {
        try {
            const result = await invoke<string>('get_config_file', { path: '~/.gemini/oauth_creds.json' });
            if (result && result.trim() !== '') {
                const parsed = JSON.parse(result);
                if (parsed.access_token || parsed.refresh_token) {
                    setIsLoggedIn(true);
                } else {
                    setIsLoggedIn(false);
                }
            } else {
                setIsLoggedIn(false);
            }
        } catch (error) {
            setIsLoggedIn(false);
        }
    };

    const loadConfig = async () => {
        setLoading(true);
        try {
            const content = await invoke<string>('get_config_file', { path: SETTINGS_PATH });
            if (content) {
                const parsed = JSON.parse(content);
                form.setFieldsValue(parsed);
            } else {
                form.resetFields();
            }
        } catch (error) {
            console.error('Failed to load Gemini settings:', error);
            message.error(t('aiSettings.mcpConfig.loadFailed', 'Failed to load config'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
        checkLoginStatus();
    }, []);

    const handleSave = async (values: any) => {
        try {
            // Read existing config first to preserve fields not in the form
            let existingConfig: any = {};
            try {
                const content = await invoke<string>('get_config_file', { path: SETTINGS_PATH });
                if (content) {
                    existingConfig = JSON.parse(content);
                }
            } catch (e) {
                console.log('No existing config or parse error, starting fresh');
            }

            const updatedConfig = {
                ...existingConfig,
                ...values,
                // Ensure nested objects are merged
                safetySettings: { ...(existingConfig.safetySettings || {}), ...(values.safetySettings || {}) },
                fileFiltering: { ...(existingConfig.fileFiltering || {}), ...(values.fileFiltering || {}) },
                telemetry: { ...(existingConfig.telemetry || {}), ...(values.telemetry || {}) },
                summarizeToolOutput: { ...(existingConfig.summarizeToolOutput || {}), ...(values.summarizeToolOutput || {}) },
                chatCompression: { ...(existingConfig.chatCompression || {}), ...(values.chatCompression || {}) }
            };

            await invoke('save_config_file', { path: SETTINGS_PATH, content: JSON.stringify(updatedConfig, null, 2) });
            message.success(t('aiSettings.mcpConfig.saved', 'Saved Gemini settings'));
            loadConfig();
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Failed to save config') + ': ' + error);
        }
    };

    const fetchGeminiModels = async () => {
        const apiKey = form.getFieldValue('apiKey');
        if (!apiKey) {
            message.warning(t('cliConfig.fields.apiKeyRequired', 'Please enter API Key first'));
            return;
        }

        setFetchingModels(true);
        try {
            // Note: Google AI Studio and Vertex AI have different endpoints. 
            // This assumes a default Google AI Studio endpoint if none provided.
            const modelList = await invoke<string[]>('fetch_remote_models', {
                baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
                apiKey,
                apiType: 'google'
            });
            setModels(modelList);
            message.success(t('cliConfig.modelsFetched', 'Fetched {{count}} models', { count: modelList.length }));
        } catch (error) {
            console.error('Failed to fetch models:', error);
            message.error(t('cliConfig.fetchModelsFailed', 'Failed to fetch models') + ': ' + error);
            // Fallback to common models
            setModels(['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro']);
        } finally {
            setFetchingModels(false);
        }
    };

    const navigate = useNavigate();
    const { setActiveToolId, setPendingCommand } = useAppStore();

    const runOAuthLogin = async () => {
        try {
            Modal.info({
                title: t('cliConfig.oauthTitle', 'Gemini OAuth Steps'),
                content: (
                    <div>
                        <p style={{ whiteSpace: 'pre-wrap' }}>{t('cliConfig.oauthPrompt')}</p>
                    </div>
                ),
                onOk: () => {
                    // Use internal terminal instead of external window
                    setActiveToolId('google');
                    setPendingCommand('gemini /auth');
                    // Navigate to terminal page
                    navigate('/terminal');
                },
                okText: t('common.goToTerminal', 'Go to Terminal'),
            });
        } catch (error) {
            message.error('Failed to launch Gemini CLI for login: ' + error);
        }
    };

    const safetyOptions = [
        { label: 'BLOCK_NONE', value: 'BLOCK_NONE' },
        { label: 'BLOCK_ONLY_HIGH', value: 'BLOCK_ONLY_HIGH' },
        { label: 'BLOCK_MEDIUM_AND_ABOVE', value: 'BLOCK_MEDIUM_AND_ABOVE' },
        { label: 'BLOCK_LOW_AND_ABOVE', value: 'BLOCK_LOW_AND_ABOVE' },
        { label: 'HATE_TASK_DEFAULT', value: 'HATE_TASK_DEFAULT' }
    ];

    const items = [
        {
            key: 'auth',
            label: (
                <span>
                    <UserOutlined />
                    {t('cliConfig.sections.auth', 'Authentication')}
                </span>
            ),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Form.Item name="apiKey" label={t('cliConfig.fields.apiKey', 'API Key')}>
                        <Input.Password placeholder={t('cliConfig.fields.apiKeyPlaceholder', 'Enter your Gemini API Key')} />
                    </Form.Item>
                    <Form.Item label={t('cliConfig.fields.oauthLogin', 'OAuth Login')}>
                        <Button type={isLoggedIn ? "default" : "primary"} icon={<GoogleOutlined />} onClick={runOAuthLogin}>
                            {isLoggedIn ? t('cliConfig.switchAccount', 'Switch Account') : t('cliConfig.fields.loginWithGoogle', 'Login with Google')}
                        </Button>
                    </Form.Item>

                    <Divider plain>{t('cliConfig.fields.model', 'Model')}</Divider>
                    <Row gutter={8}>
                        <Col flex="auto">
                            <Form.Item name="model" label={t('cliConfig.fields.model', 'Model')} style={{ marginBottom: 0 }}>
                                <AutoComplete
                                    options={models.map(m => ({ value: m }))}
                                    placeholder="gemini-1.5-pro"
                                    filterOption={(inputValue, option) =>
                                        option!.value.toLowerCase().includes(inputValue.toLowerCase())
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                icon={<CloudDownloadOutlined />}
                                onClick={fetchGeminiModels}
                                loading={fetchingModels}
                                style={{ marginTop: 30 }}
                            >
                                {t('cliConfig.fetchModels', 'Fetch')}
                            </Button>
                        </Col>
                    </Row>
                </div>
            )
        },
        {
            key: 'parameters',
            label: (
                <span>
                    <SettingOutlined />
                    {t('cliConfig.sections.generation', 'Generation')}
                </span>
            ),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="temperature" label={t('cliConfig.fields.temperature', 'Temperature')}>
                                <InputNumber style={{ width: '100%' }} step={0.1} min={0} max={2} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="maxOutputTokens" label={t('cliConfig.fields.maxOutputTokens', 'Max Output Tokens')}>
                                <InputNumber style={{ width: '100%' }} step={1} min={1} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="topP" label={t('cliConfig.fields.topP', 'Top P')}>
                                <InputNumber style={{ width: '100%' }} step={0.05} min={0} max={1} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="topK" label={t('cliConfig.fields.topK', 'Top K')}>
                                <InputNumber style={{ width: '100%' }} step={1} min={1} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="candidateCount" label={t('cliConfig.fields.candidateCount', 'Candidate Count')}>
                                <InputNumber style={{ width: '100%' }} step={1} min={1} max={8} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="outputFormat" label={t('cliConfig.fields.outputFormat', 'Output Format')}>
                                <Select options={[{ label: t('common.text', 'Text'), value: 'text' }, { label: t('common.json', 'JSON'), value: 'json' }]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Space size="large">
                        <Form.Item name="syntaxHighlighting" label={t('cliConfig.fields.syntaxHighlighting', 'Syntax Highlighting')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="showLineNumbers" label={t('cliConfig.fields.showLineNumbers', 'Show Line Numbers')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="verbose" label={t('cliConfig.fields.verbose', 'Verbose Log')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>
                </div>
            )
        },
        {
            key: 'safety',
            label: (
                <span>
                    <SafetyOutlined />
                    {t('cliConfig.sections.safety', 'Safety')}
                </span>
            ),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Form.Item name={['safetySettings', 'harassment']} label={t('cliConfig.fields.harassment', 'Harassment')}>
                        <Select options={safetyOptions} />
                    </Form.Item>
                    <Form.Item name={['safetySettings', 'hateSpeech']} label={t('cliConfig.fields.hateSpeech', 'Hate Speech')}>
                        <Select options={safetyOptions} />
                    </Form.Item>
                    <Form.Item name={['safetySettings', 'sexuallyExplicit']} label={t('cliConfig.fields.sexuallyExplicit', 'Sexually Explicit')}>
                        <Select options={safetyOptions} />
                    </Form.Item>
                    <Form.Item name={['safetySettings', 'dangerousContent']} label={t('cliConfig.fields.dangerousContent', 'Dangerous Content')}>
                        <Select options={safetyOptions} />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'advanced',
            label: (
                <span>
                    <ExperimentOutlined />
                    {t('cliConfig.sections.features', 'Features')}
                </span>
            ),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Divider orientation={"left" as any}><FilterOutlined /> {t('cliConfig.fields.fileFiltering', 'File Filtering')}</Divider>
                    <Space size="large">
                        <Form.Item name={['fileFiltering', 'respectGitIgnore']} label={t('cliConfig.fields.respectGitIgnore', 'Respect .gitignore')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['fileFiltering', 'enableRecursiveFileSearch']} label={t('cliConfig.fields.recursiveSearch', 'Recursive Search')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>

                    <Divider orientation={"left" as any}><AppstoreOutlined /> {t('cliConfig.fields.toolsAndSandbox', 'Tools & Sandbox')}</Divider>
                    <Form.Item name="autoAccept" label={t('cliConfig.fields.autoAcceptTools', 'Auto Accept Tools')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name="sandbox" label={t('cliConfig.fields.enableSandbox', 'Enable Sandbox')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name="toolDiscoveryCommand" label={t('cliConfig.fields.toolDiscoveryCommand', 'Tool Discovery Command')}>
                        <Input placeholder="e.g. npx find-tools" />
                    </Form.Item>
                    <Form.Item name="toolCallCommand" label={t('cliConfig.fields.toolCallCommand', 'Tool Call Command')}>
                        <Input placeholder="e.g. npx run-tool" />
                    </Form.Item>
                    <Divider orientation={"left" as any}><BugOutlined /> {t('cliConfig.fields.debugAndTelemetry', 'Debug & Telemetry')}</Divider>
                    <Space size="large">
                        <Form.Item name="enabled" label={t('cliConfig.fields.checkpointsEnabled', 'Checkpoints Enabled')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['telemetry', 'enabled']} label={t('cliConfig.fields.telemetryEnabled', 'Telemetry Enabled')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>
                    <Form.Item name={['telemetry', 'otlpEndpoint']} label={t('cliConfig.fields.otlpEndpoint', 'OTLP Endpoint')}>
                        <Input placeholder="http://localhost:4317" />
                    </Form.Item>
                    <Divider orientation={"left" as any}><HistoryOutlined /> {t('cliConfig.fields.sessionManagement', 'Session Management')}</Divider>
                    <Form.Item name="maxSessionTurns" label={t('cliConfig.fields.maxSessionTurns', 'Max Session Turns')}>
                        <InputNumber style={{ width: '100%' }} min={1} max={100} />
                    </Form.Item>
                    <Form.Item name={['chatCompression', 'contextPercentageThreshold']} label={t('cliConfig.fields.compressionThreshold', 'Compression Threshold')}>
                        <InputNumber style={{ width: '100%' }} min={0.1} max={1.0} step={0.1} />
                    </Form.Item>
                </div>
            )
        }
    ];

    return (
        <Card
            title={
                <Space>
                    <KeyOutlined />
                    <span>Gemini {t('common.settings', 'Settings')}</span>
                </Space>
            }
            extra={<Button icon={<ReloadOutlined />} onClick={loadConfig} loading={loading} type="text" />}
            style={{ marginTop: 24, marginBottom: 24 }}
        >
            <Alert
                title={t('aiSettings.mcpConfig.savePathTip', { path: SETTINGS_PATH })}
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Tabs defaultActiveKey="auth" items={items} />
                <Form.Item style={{ marginTop: 24 }}>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                        {t('aiSettings.mcpConfig.save', 'Save Configuration')}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default GeminiAuthEditor;
