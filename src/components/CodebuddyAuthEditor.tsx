/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\CodebuddyAuthEditor.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, message, Space, Alert, Tabs, Switch, InputNumber, Select, Divider, Row, Col } from 'antd';
import { SaveOutlined, KeyOutlined, ReloadOutlined, SettingOutlined, PlusOutlined, DeleteOutlined, CloudDownloadOutlined, BuildOutlined, ControlOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

const SETTINGS_PATH = '~/.codebuddy/settings.json';

const CodebuddyAuthEditor: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [fetchingModels, setFetchingModels] = useState(false);
    const [fetchedModels, setFetchedModels] = useState<string[]>([]);
    const [form] = Form.useForm();

    const loadConfig = async () => {
        setLoading(true);
        try {
            const content = await invoke<string>('get_config_file', { path: SETTINGS_PATH });
            if (content) {
                const parsed = JSON.parse(content);
                
                // Convert Records to Arrays for Form.List
                const pluginsList = Object.entries(parsed.enabledPlugins || {}).map(([id, enabled]) => ({ id, enabled }));
                const marketplacesList = Object.entries(parsed.extraKnownMarketplaces || {}).map(([id, config]) => ({ id, ...(config as any) }));

                form.setFieldsValue({
                    ...parsed,
                    plugins_list: pluginsList,
                    marketplaces_list: marketplacesList
                });
            } else {
                form.resetFields();
            }
        } catch (error) {
            console.error('Failed to load CodeBuddy settings:', error);
            form.resetFields();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleSave = async (values: any) => {
        try {
            const { plugins_list, marketplaces_list, ...rest } = values;
            
            // Map arrays back to objects
            const enabledPlugins: Record<string, boolean> = {};
            (plugins_list || []).forEach((item: any) => {
                if (item.id) {
                    enabledPlugins[item.id] = !!item.enabled;
                }
            });

            const extraKnownMarketplaces: Record<string, any> = {};
            (marketplaces_list || []).forEach((item: any) => {
                if (item.id) {
                    const { id, ...config } = item;
                    extraKnownMarketplaces[id] = config;
                }
            });

            const finalConfig = {
                ...rest,
                enabledPlugins,
                extraKnownMarketplaces
            };

            await invoke('save_config_file', { path: SETTINGS_PATH, content: JSON.stringify(finalConfig, null, 2) });
            message.success(t('aiSettings.mcpConfig.saved', 'Saved CodeBuddy settings'));
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Failed to save config') + ': ' + error);
        }
    };

    const fetchModels = async () => {
        const env = form.getFieldValue('env') || {};
        const baseUrl = env.CODEBUDDY_BASE_URL || form.getFieldValue('endpoint');
        const apiKey = env.CODEBUDDY_API_KEY;

        if (!baseUrl || !apiKey) {
            message.warning(t('aiSettings.cliConfig.fields.apiKeyRequired', 'Please enter API Key and Base URL first'));
            return;
        }

        setFetchingModels(true);
        try {
            const models = await invoke<string[]>('fetch_remote_models', {
                baseUrl,
                apiKey,
                apiType: 'openai'
            });
            setFetchedModels(models);
            message.success(t('aiSettings.cliConfig.codebuddy.fields.modelsFetched', { count: models.length, defaultValue: `Successfully fetched ${models.length} models` }));
        } catch (error) {
            console.error('Failed to fetch CodeBuddy models:', error);
            message.error(`${t('aiSettings.cliConfig.fetchModelsFailed')}: ${error}`);
        } finally {
            setFetchingModels(false);
        }
    };

    const modelOptions = fetchedModels.length > 0 
        ? fetchedModels.map(m => ({ label: m, value: m }))
        : [
            { label: 'gpt-4o', value: 'gpt-4o' },
            { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
            { label: 'claude-3-5-sonnet', value: 'claude-3-5-sonnet' },
            { label: 'claude-3-haiku', value: 'claude-3-haiku' }
        ];

    const items = [
        {
            key: 'env',
            label: (<span><KeyOutlined />{t('aiSettings.cliConfig.codebuddy.sections.env')}</span>),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name={['env', 'CODEBUDDY_API_KEY']} label={t('aiSettings.cliConfig.codebuddy.fields.apiKey')}>
                                <Input.Password placeholder="sk-..." />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name={['env', 'CODEBUDDY_BASE_URL']} label={t('aiSettings.cliConfig.codebuddy.fields.baseUrl')}>
                        <Input placeholder="https://api.codebuddy.com/v1" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['env', 'CODEBUDDY_INTERNET_ENVIRONMENT']} label={t('aiSettings.cliConfig.codebuddy.fields.internetEnv')}>
                                <Select options={[
                                    { label: t('aiSettings.cliConfig.codebuddy.fields.internal'), value: 'internal' },
                                    { label: t('aiSettings.cliConfig.codebuddy.fields.ioa'), value: 'iOA' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['env', 'CODEBUDDY_AUTH_TOKEN']} label={t('aiSettings.cliConfig.codebuddy.fields.authToken')}>
                                <Input.Password />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16} align="bottom">
                        <Col flex="1">
                            <Form.Item name="model" label={t('aiSettings.cliConfig.codebuddy.fields.model')} style={{ marginBottom: 0 }}>
                                <Select showSearch options={modelOptions} placeholder="Select or type a model" />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button icon={<CloudDownloadOutlined />} onClick={fetchModels} loading={fetchingModels}>
                                {t('aiSettings.cliConfig.codebuddy.fields.fetchModels', 'Fetch Models')}
                            </Button>
                        </Col>
                    </Row>
                </div>
            )
        },
        {
            key: 'general',
            label: (<span><SettingOutlined />{t('aiSettings.cliConfig.codebuddy.sections.general')}</span>),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="language" label={t('aiSettings.cliConfig.codebuddy.fields.language')}>
                                <Select options={[
                                    { label: '简体中文', value: '简体中文' },
                                    { label: 'English', value: 'English' }
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="cleanupPeriodDays" label={t('aiSettings.cliConfig.codebuddy.fields.cleanupDays')}>
                                <InputNumber style={{ width: '100%' }} min={1} max={365} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Space size="large" wrap>
                        <Form.Item name="autoUpdates" label={t('aiSettings.cliConfig.codebuddy.fields.autoUpdates')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="autoCompactEnabled" label={t('aiSettings.cliConfig.codebuddy.fields.autoCompact')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="alwaysThinkingEnabled" label={t('aiSettings.cliConfig.codebuddy.fields.alwaysThinking')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="showTokensCounter" label={t('aiSettings.cliConfig.codebuddy.fields.showTokens')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="promptSuggestionEnabled" label={t('aiSettings.cliConfig.codebuddy.fields.promptSuggestion')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name="memory" label={t('aiSettings.cliConfig.codebuddy.fields.memory')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>
                </div>
            )
        },
        {
            key: 'plugins',
            label: (<span><BuildOutlined />{t('aiSettings.cliConfig.codebuddy.sections.plugins')}</span>),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Divider plain>{t('aiSettings.cliConfig.codebuddy.fields.plugins')}</Divider>
                    <Form.List name="plugins_list">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'id']}
                                            rules={[{ required: true, message: 'Missing Plugin ID' }]}
                                        >
                                            <Input placeholder="plugin-id@namespace" style={{ width: 250 }} />
                                        </Form.Item>
                                        <Form.Item
                                            {...restField}
                                            name={[name, 'enabled']}
                                            valuePropName="checked"
                                        >
                                            <Switch checkedChildren="ON" unCheckedChildren="OFF" />
                                        </Form.Item>
                                        <DeleteOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />
                                    </Space>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add Plugin
                                </Button>
                            </>
                        )}
                    </Form.List>

                    <Divider plain style={{ marginTop: 32 }}>{t('aiSettings.cliConfig.codebuddy.fields.marketplaces')}</Divider>
                    <Form.List name="marketplaces_list">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card key={key} size="small" style={{ marginBottom: 16 }} extra={<DeleteOutlined onClick={() => remove(name)} style={{ color: '#ff4d4f' }} />}>
                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <Form.Item {...restField} name={[name, 'id']} label="Marketplace ID" rules={[{ required: true }]}>
                                                    <Input placeholder="company-tools" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item {...restField} name={[name, 'source', 'source']} label="Source Type">
                                                    <Select options={[{ label: 'GitHub', value: 'github' }, { label: 'GitLab', value: 'gitlab' }]} />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item {...restField} name={[name, 'source', 'repo']} label="Repo Path">
                                                    <Input placeholder="owner/repo" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    Add Marketplace
                                </Button>
                            </>
                        )}
                    </Form.List>
                </div>
            )
        },
        {
            key: 'advanced',
            label: (<span><ControlOutlined />{t('aiSettings.cliConfig.codebuddy.sections.advanced')}</span>),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="endpoint" label={t('aiSettings.cliConfig.codebuddy.fields.endpoint')}>
                                <Input placeholder="https://api.example.com" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="envRouteMode" label={t('aiSettings.cliConfig.codebuddy.fields.envRouteMode')}>
                                <Select options={[
                                    { label: t('aiSettings.cliConfig.codebuddy.fields.production'), value: 'production' },
                                    { label: t('aiSettings.cliConfig.codebuddy.fields.staging'), value: 'staging' },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider plain>Permissions & Mode</Divider>
                    <Form.Item name={['permissions', 'defaultMode']} label={t('aiSettings.cliConfig.codebuddy.fields.permissions')}>
                        <Select options={[
                            { label: t('aiSettings.cliConfig.codebuddy.fields.plan'), value: 'plan' },
                            { label: t('aiSettings.cliConfig.codebuddy.fields.act'), value: 'act' },
                        ]} />
                    </Form.Item>
                    
                    <Divider plain>System & Scripts</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['statusLine', 'type']} label="Status Line Type">
                                <Select options={[{ label: 'Command', value: 'command' }, { label: 'None', value: 'none' }]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['statusLine', 'command']} label={t('aiSettings.cliConfig.codebuddy.fields.statusLineCommand')}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name={['sandbox', 'enabled']} label={t('aiSettings.cliConfig.codebuddy.fields.sandbox')} valuePropName="checked">
                         <Switch />
                    </Form.Item>
                </div>
            )
        }
    ];

    return (
        <Card
            title={
                <Space>
                    <BuildOutlined />
                    <span>CodeBuddy {t('common.settings')}</span>
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

            <Form form={form} layout="vertical" onFinish={handleSave}>
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

export default CodebuddyAuthEditor;
