/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\CodexAuthEditor.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, message, Space, Alert, Tabs, Select, Divider, Row, Col, InputNumber } from 'antd';
import { SaveOutlined, KeyOutlined, EyeInvisibleOutlined, EyeOutlined, ReloadOutlined, SettingOutlined, RocketOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import * as TOML from 'smol-toml';

const AUTH_CONFIG_PATH = '~/.codex/auth.json';
const GENERAL_CONFIG_PATH = '~/.codex/config.toml';

interface AuthEntry {
    type: 'api';
    key: string;
}

interface AuthConfig {
    [provider: string]: AuthEntry;
}

const CodexAuthEditor: React.FC = () => {
    const { t } = useTranslation();
    const [authConfig, setAuthConfig] = useState<AuthConfig>({});
    const [generalConfig, setGeneralConfig] = useState<any>({});
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const loadConfigs = async () => {
        setLoading(true);
        try {
            // Load Auth Config (JSON)
            const authContent = await invoke<string>('get_config_file', { path: AUTH_CONFIG_PATH });
            if (authContent) {
                setAuthConfig(JSON.parse(authContent));
            } else {
                setAuthConfig({});
            }

            // Load General Config (TOML)
            const generalContent = await invoke<string>('get_config_file', { path: GENERAL_CONFIG_PATH });
            if (generalContent) {
                const parsed = TOML.parse(generalContent);
                setGeneralConfig(parsed);
                // Flatten provider settings for the form if needed, but let's just use the structure
                form.setFieldsValue({
                    model: parsed.model,
                    model_reasoning_effort: parsed.model_reasoning_effort,
                    preferred_auth_method: parsed.preferred_auth_method,
                    model_provider: parsed.model_provider,
                    base_url: (parsed.model_providers as any)?.[parsed.model_provider as string]?.base_url,
                    provider_name: (parsed.model_providers as any)?.[parsed.model_provider as string]?.name,
                    wire_api: (parsed.model_providers as any)?.[parsed.model_provider as string]?.wire_api,
                    timeout: parsed.timeout,
                    retry_attempts: parsed.retry_attempts,
                });
            } else {
                setGeneralConfig({});
                form.resetFields();
            }
        } catch (error) {
            console.error('Failed to load codex configs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfigs();
    }, []);

    const handleSave = async (values: any) => {
        setLoading(true);
        try {
            // 1. Save Auth Config (JSON)
            if (values.key) {
                const newAuthConfig = { ...authConfig };
                const provider = values.provider || 'openai';
                newAuthConfig[provider] = {
                    type: 'api',
                    key: values.key,
                };
                await invoke('save_config_file', { path: AUTH_CONFIG_PATH, content: JSON.stringify(newAuthConfig, null, 2) });
                setAuthConfig(newAuthConfig);
            }

            // 2. Save General Config (TOML)
            const updatedConfig = {
                ...generalConfig,
                model: values.model,
                model_reasoning_effort: values.model_reasoning_effort,
                preferred_auth_method: values.preferred_auth_method,
                model_provider: values.model_provider,
                timeout: values.timeout,
                retry_attempts: values.retry_attempts,
            };

            if (values.model_provider) {
                if (!updatedConfig.model_providers) updatedConfig.model_providers = {};
                updatedConfig.model_providers[values.model_provider] = {
                    ...(updatedConfig.model_providers[values.model_provider] || {}),
                    base_url: values.base_url,
                    name: values.provider_name,
                    wire_api: values.wire_api,
                };
            }

            const tomlString = TOML.stringify(updatedConfig);
            await invoke('save_config_file', { path: GENERAL_CONFIG_PATH, content: tomlString });
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
                message={t('aiSettings.mcpConfig.savePathTip', { path: AUTH_CONFIG_PATH })}
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />
            <Form.Item name="provider" label={t('cliConfig.fields.providerName', 'Provider')} initialValue="openai">
                <Select options={[{ label: 'OpenAI', value: 'openai' }, { label: 'Anthropic', value: 'anthropic' }]} />
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
        </div>
    );

    const generalTab = (
        <div style={{ padding: '16px 0' }}>
            <Divider orientation={"left" as any}><SettingOutlined /> {t('cliConfig.codex.sections.general', 'General Settings')}</Divider>
            <Space direction="vertical" style={{ width: '100%' }}>
                <Form.Item name="model" label={t('cliConfig.codex.fields.model', 'Model')}>
                    <Input placeholder="deepseek-reasoner" />
                </Form.Item>
                <Form.Item name="model_reasoning_effort" label={t('cliConfig.codex.fields.reasoningEffort', 'Reasoning Effort')}>
                    <Select options={[{ label: 'Low', value: 'low' }, { label: 'Medium', value: 'medium' }, { label: 'High', value: 'high' }]} />
                </Form.Item>
                <Form.Item name="preferred_auth_method" label={t('cliConfig.codex.fields.preferredAuth', 'Preferred Auth')}>
                    <Select options={[{ label: 'API Key', value: 'apikey' }, { label: 'OAuth', value: 'oauth' }]} />
                </Form.Item>

                <Divider orientation={"left" as any}><RocketOutlined /> {t('cliConfig.codex.sections.provider', 'Provider Settings')}</Divider>
                <Form.Item name="model_provider" label={t('cliConfig.codex.fields.modelProvider', 'Provider Type')}>
                    <Select options={[{ label: 'OpenAI', value: 'openai' }, { label: 'Anthropic', value: 'anthropic' }]} />
                </Form.Item>
                <Form.Item name="base_url" label={t('cliConfig.codex.fields.baseUrl', 'Base URL')}>
                    <Input placeholder="https://api.openai.com/v1" />
                </Form.Item>
                <Form.Item name="provider_name" label={t('cliConfig.codex.fields.providerName', 'Provider Name')}>
                    <Input placeholder="openai" />
                </Form.Item>
                <Form.Item name="wire_api" label={t('cliConfig.codex.fields.wireApi', 'Wire API')}>
                    <Input placeholder="responses" />
                </Form.Item>

                <Divider orientation={"left" as any}><RocketOutlined /> {t('cliConfig.opencode.sections.advanced', 'Advanced Settings')}</Divider>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="timeout" label={t('cliConfig.codex.fields.timeout', 'Timeout (seconds)')}>
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="retry_attempts" label={t('cliConfig.codex.fields.retryAttempts', 'Retry Attempts')}>
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
            </Space>
        </div>
    );

    const tabsItems = [
        { key: 'auth', label: <span><KeyOutlined /> {t('cliConfig.codex.sections.auth', 'Auth')}</span>, children: authTab },
        { key: 'general', label: <span><SettingOutlined /> {t('cliConfig.codex.sections.general', 'General')}</span>, children: generalTab },
    ];

    return (
        <Card
            title={
                <Space>
                    <RocketOutlined />
                    <span>Codex {t('common.settings', 'Settings')}</span>
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

export default CodexAuthEditor;
