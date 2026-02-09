/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\ClaudeCodeAuthEditor.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, message, Space, Alert, Tabs, Switch, InputNumber, Select, Divider, AutoComplete, Row, Col } from 'antd';
import { SaveOutlined, KeyOutlined, ReloadOutlined, SettingOutlined, SafetyOutlined, ExperimentOutlined, BugOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
const SETTINGS_PATH = '~/.claude.json';

const ClaudeCodeAuthEditor: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [models, setModels] = useState<string[]>([]);
    const [form] = Form.useForm();

    const loadConfig = async () => {
        setLoading(true);
        try {
            const content = await invoke<string>('get_config_file', { path: SETTINGS_PATH });
            if (content) {
                const parsed = JSON.parse(content);
                form.setFieldsValue(parsed);

                // Sync model field with ANTHROPIC_MODEL on load
                if (parsed?.env?.ANTHROPIC_MODEL) {
                    form.setFieldValue('model', parsed.env.ANTHROPIC_MODEL);
                }
            } else {
                form.resetFields();
            }
        } catch (error) {
            console.error('Failed to load Claude settings:', error);
            message.error(t('aiSettings.mcpConfig.loadFailed', 'Failed to load config'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleSave = async (values: any) => {
        try {
            // Read existing config first to preserve fields not in the form (like mcpServers)
            let existingConfig: any = {};
            try {
                const content = await invoke<string>('get_config_file', { path: SETTINGS_PATH });
                if (content) {
                    existingConfig = JSON.parse(content);
                }
            } catch (e) {
                console.log('No existing config or parse error, starting fresh');
            }

            // Merge form values into existing config
            const updatedConfig = {
                ...existingConfig,
                ...values,
                // Ensure nested objects are merged if they exist in both
                env: { ...(existingConfig.env || {}), ...(values.env || {}) },
                permissions: { ...(existingConfig.permissions || {}), ...(values.permissions || {}) }
            };

            await invoke('save_config_file', { path: SETTINGS_PATH, content: JSON.stringify(updatedConfig, null, 2) });
            message.success(t('aiSettings.mcpConfig.saved', 'Saved Claude settings'));

            // Reload to sync the whole page if needed
            loadConfig();
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Failed to save config') + ': ' + error);
        }
    };

    const fetchClaudeModels = async () => {
        const apiKey = form.getFieldValue(['env', 'ANTHROPIC_AUTH_TOKEN']);
        const baseUrl = form.getFieldValue(['env', 'ANTHROPIC_BASE_URL']) || 'https://api.anthropic.com';

        if (!apiKey) {
            message.warning(t('aiSettings.cliConfig.fields.apiKeyRequired', 'Please enter API Key first'));
            return;
        }

        setFetchingModels(true);
        try {
            const modelList = await invoke<string[]>('fetch_remote_models', {
                baseUrl,
                apiKey,
                apiType: 'anthropic'
            });
            setModels(modelList);
            message.success(t('aiSettings.cliConfig.modelsFetched', `Fetched ${modelList.length} models`));
        } catch (error) {
            console.error('Failed to fetch models:', error);
            message.error(t('aiSettings.cliConfig.fetchModelsFailed', 'Failed to fetch models') + ': ' + error);
        } finally {
            setFetchingModels(false);
        }
    };

    const handleValuesChange = (changedValues: any) => {
        // Sync model with ANTHROPIC_MODEL
        if (changedValues?.env?.ANTHROPIC_MODEL) {
            form.setFieldValue('model', changedValues.env.ANTHROPIC_MODEL);
        }
    };

    const items = [
        {
            key: 'env',
            label: (
                <span>
                    <BugOutlined />
                    {t('aiSettings.cliConfig.sections.env', 'Environment')}
                </span>
            ),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Form.Item name={['env', 'ANTHROPIC_AUTH_TOKEN']} label="ANTHROPIC_AUTH_TOKEN (API Key)" rules={[{ required: true }]}>
                        <Input.Password placeholder="sk-..." />
                    </Form.Item>
                    <Form.Item name={['env', 'ANTHROPIC_BASE_URL']} label="ANTHROPIC_BASE_URL">
                        <Input placeholder="https://api.anthropic.com" />
                    </Form.Item>
                    <Row gutter={8}>
                        <Col flex="auto">
                            <Form.Item name={['env', 'ANTHROPIC_MODEL']} label="ANTHROPIC_MODEL" style={{ marginBottom: 0 }}>
                                <AutoComplete
                                    options={models.map(m => ({ value: m }))}
                                    placeholder="claude-3-5-sonnet-20241022"
                                    filterOption={(inputValue, option) =>
                                        option!.value.toLowerCase().includes(inputValue.toLowerCase())
                                    }
                                />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                icon={<CloudDownloadOutlined />}
                                onClick={fetchClaudeModels}
                                loading={fetchingModels}
                                style={{ marginTop: 30 }}
                            >
                                {t('aiSettings.cliConfig.fetchModels', 'Fetch')}
                            </Button>
                        </Col>
                    </Row>

                    <Divider plain>{t('aiSettings.cliConfig.sections.controls', 'Feature Controls')}</Divider>
                    <Space wrap>
                        <Form.Item name={['env', 'DISABLE_AUTOUPDATER']} label="Disable Auto-Updater" valuePropName="value" getValueProps={(v) => ({ checked: v === 'true' })} getValueFromEvent={(e) => e ? 'true' : 'false'}>
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['env', 'DISABLE_TELEMETRY']} label="Disable Telemetry" valuePropName="value" getValueProps={(v) => ({ checked: v === 'true' })} getValueFromEvent={(e) => e ? 'true' : 'false'}>
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['env', 'DISABLE_PROMPT_CACHING']} label="Disable Prompt Caching" valuePropName="value" getValueProps={(v) => ({ checked: v === 'true' })} getValueFromEvent={(e) => e ? 'true' : 'false'}>
                            <Switch />
                        </Form.Item>
                    </Space>

                    <Divider plain>{t('aiSettings.cliConfig.sections.limits', 'Limits')}</Divider>
                    <Form.Item name={['env', 'MAX_THINKING_TOKENS']} label="MAX_THINKING_TOKENS">
                        <InputNumber
                            style={{ width: '100%' }}
                            placeholder="16000"
                            min={1000}
                            max={100000}
                            step={1000}
                        />
                    </Form.Item>
                    <Form.Item name={['env', 'HTTP_PROXY']} label="HTTP_PROXY">
                        <Input placeholder="http://127.0.0.1:7890" />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'basic',
            label: (
                <span>
                    <SettingOutlined />
                    {t('aiSettings.cliConfig.sections.basic', 'Basic')}
                </span>
            ),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Form.Item name="model" label={t('aiSettings.cliConfig.fields.model', 'Model')}>
                        <Input placeholder="claude-3-5-sonnet-20241022" disabled />
                    </Form.Item>
                    <Form.Item name="language" label={t('aiSettings.cliConfig.fields.language', 'Response Language')}>
                        <Select
                            showSearch
                            placeholder="Select language"
                            options={[
                                { label: 'English', value: 'English' },
                                { label: '简体中文 (Simplified Chinese)', value: 'Chinese' },
                                { label: '繁體中文 (Traditional Chinese)', value: 'Traditional Chinese' },
                                { label: '日本語 (Japanese)', value: 'Japanese' },
                                { label: '한국어 (Korean)', value: 'Korean' },
                                { label: 'Español (Spanish)', value: 'Spanish' },
                                { label: 'Français (French)', value: 'French' },
                                { label: 'Deutsch (German)', value: 'German' },
                                { label: 'Italiano (Italian)', value: 'Italian' },
                                { label: 'Português (Portuguese)', value: 'Portuguese' },
                                { label: 'Русский (Russian)', value: 'Russian' },
                                { label: 'العربية (Arabic)', value: 'Arabic' },
                                { label: 'हिन्दी (Hindi)', value: 'Hindi' },
                                { label: 'Türkçe (Turkish)', value: 'Turkish' },
                                { label: 'Nederlands (Dutch)', value: 'Dutch' },
                                { label: 'Polski (Polish)', value: 'Polish' },
                                { label: 'Tiếng Việt (Vietnamese)', value: 'Vietnamese' },
                                { label: 'ไทย (Thai)', value: 'Thai' },
                                { label: 'Bahasa Indonesia', value: 'Indonesian' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name="cleanupPeriodDays" label={t('aiSettings.cliConfig.fields.cleanupDays', 'Cleanup Period (Days)')}>
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Space size="large">
                        <Form.Item name="alwaysThinkingEnabled" label={t('aiSettings.cliConfig.fields.thinkingMode', 'Always Thinking')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="showTurnDuration" label={t('aiSettings.cliConfig.fields.showDuration', 'Show Turn Duration')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>
                    <Form.Item name="autoUpdatesChannel" label={t('aiSettings.cliConfig.fields.updateChannel', 'Update Channel')}>
                        <Select options={[
                            { label: 'Stable', value: 'stable' },
                            { label: 'Latest', value: 'latest' },
                        ]} />
                    </Form.Item>
                    <Form.Item name="plansDirectory" label={t('aiSettings.cliConfig.fields.plansDir', 'Plans Directory')}>
                        <Input placeholder="./plans" />
                    </Form.Item>
                    <Space size="large">
                        <Form.Item name="spinnerTipsEnabled" label={t('aiSettings.cliConfig.fields.spinnerTips', 'Spinner Tips')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="terminalProgressBarEnabled" label={t('aiSettings.cliConfig.fields.progressBar', 'Terminal Progress Bar')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>
                </div>
            )
        },
        {
            key: 'permissions',
            label: (
                <span>
                    <SafetyOutlined />
                    {t('aiSettings.cliConfig.sections.permissions', 'Permissions')}
                </span>
            ),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Form.Item name={['permissions', 'defaultMode']} label={t('aiSettings.cliConfig.fields.defaultPermission', 'Default Mode')}>
                        <Select
                            placeholder="Select permission mode"
                            options={[
                                { label: 'Default (Standard behavior)', value: 'default' },
                                { label: 'Accept Edits (Ask before file changes)', value: 'acceptEdits' },
                                { label: 'Plan (Analysis only, no changes)', value: 'plan' },
                                { label: 'Bypass Permissions (Auto-accept all)', value: 'bypassPermissions' },
                                { label: 'Delegate', value: 'delegate' },
                                { label: "Don't Ask", value: 'dontAsk' },
                            ]}
                        />
                    </Form.Item>
                    <Form.Item name={['permissions', 'allow']} label={t('aiSettings.cliConfig.fields.allowList', 'Allow List')}>
                        <Select mode="tags" placeholder="e.g. Bash(npm run lint)" />
                    </Form.Item>
                    <Form.Item name={['permissions', 'deny']} label={t('aiSettings.cliConfig.fields.denyList', 'Deny List')}>
                        <Select mode="tags" placeholder="e.g. Bash(curl:*)" />
                    </Form.Item>
                    <Form.Item name={['permissions', 'additionalDirectories']} label={t('aiSettings.cliConfig.fields.allowedDirs', 'Additional Directories')}>
                        <Select mode="tags" placeholder="e.g. ../docs/" />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'sandbox',
            label: (
                <span>
                    <ExperimentOutlined />
                    {t('aiSettings.cliConfig.sections.sandbox', 'Sandbox')}
                </span>
            ),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Space size="large">
                        <Form.Item name={['sandbox', 'enabled']} label={t('common.enabled', 'Enabled')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['sandbox', 'autoAllowBashIfSandboxed']} label={t('aiSettings.cliConfig.fields.autoAllowBash', 'Auto-Allow Bash in Sandbox')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>
                    <Form.Item name={['sandbox', 'excludedCommands']} label={t('aiSettings.cliConfig.fields.excludedCmds', 'Excluded Commands')}>
                        <Select mode="tags" />
                    </Form.Item>
                    <Divider plain>{t('aiSettings.cliConfig.sections.network', 'Network')}</Divider>
                    <Form.Item name={['sandbox', 'network', 'allowLocalBinding']} label={t('aiSettings.cliConfig.fields.allowLocalBind', 'Allow Local Binding')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item name={['sandbox', 'network', 'allowUnixSockets']} label={t('aiSettings.cliConfig.fields.unixSockets', 'Allow Unix Sockets')}>
                        <Select mode="tags" />
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
                    <span>Claude Code {t('common.settings', 'Settings')}</span>
                </Space>
            }
            extra={<Button icon={<ReloadOutlined />} onClick={loadConfig} loading={loading} type="text" />}
            style={{ marginTop: 24, marginBottom: 24 }}
        >
            <Alert
                message={t('aiSettings.mcpConfig.savePathTip', { path: SETTINGS_PATH })}
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Form form={form} layout="vertical" onFinish={handleSave} onValuesChange={handleValuesChange}>
                <Tabs defaultActiveKey="env" items={items} />
                <Form.Item style={{ marginTop: 24 }}>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                        {t('aiSettings.mcpConfig.save', 'Save Configuration')}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default ClaudeCodeAuthEditor;
