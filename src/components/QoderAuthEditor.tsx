/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\QoderAuthEditor.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, message, Space, Alert, Tabs, Switch, InputNumber, Select, Divider, Row, Col, Tooltip } from 'antd';
import { SaveOutlined, KeyOutlined, ReloadOutlined, SettingOutlined, DesktopOutlined, SafetyOutlined, ExperimentOutlined, GlobalOutlined, PlusOutlined, DeleteOutlined, CloudDownloadOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

const SETTINGS_PATH = '~/.qoder/settings.json';

const QoderAuthEditor: React.FC = () => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [fetchingModels, setFetchingModels] = useState<Record<string, boolean>>({});
    const [fetchingAll, setFetchingAll] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string>('all');
    const [providerModels, setProviderModels] = useState<Record<string, string[]>>({});
    const [form] = Form.useForm();
    const providers = Form.useWatch('api_keys_list', form) || [];

    const loadConfig = async () => {
        setLoading(true);
        try {
            const content = await invoke<string>('get_config_file', { path: SETTINGS_PATH });
            if (content) {
                const parsed = JSON.parse(content);
                
                // Map nested api_keys object to array for Form.List
                const apiKeysArray = Object.entries(parsed.api_keys || {}).map(([name, config]) => ({
                    name,
                    ...(config as any)
                }));
                
                form.setFieldsValue({
                    ...parsed,
                    api_keys_list: apiKeysArray
                });
            } else {
                form.resetFields();
            }
        } catch (error) {
            console.error('Failed to load Qoder settings:', error);
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
            const { api_keys_list, ...rest } = values;
            
            // Map array back to object for settings.json
            const api_keys: Record<string, any> = {};
            (api_keys_list || []).forEach((item: any) => {
                if (item.name) {
                    const { name, ...config } = item;
                    api_keys[name] = config;
                }
            });

            const finalConfig = {
                ...rest,
                api_keys
            };

            await invoke('save_config_file', { path: SETTINGS_PATH, content: JSON.stringify(finalConfig, null, 2) });
            message.success(t('aiSettings.mcpConfig.saved', 'Saved Qoder settings'));
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Failed to save config') + ': ' + error);
        }
    };

    const fetchModels = async (index: number) => {
        const list = form.getFieldValue('api_keys_list');
        const provider = list[index];
        
        if (!provider || !provider.name || !provider.key || !provider.endpoint) {
            message.warning(t('cliConfig.fields.apiKeyRequired', 'Please enter Name, API Key and Endpoint first'));
            return;
        }

        setFetchingModels(prev => ({ ...prev, [provider.name]: true }));
        try {
            const fetchedModels = await invoke<string[]>('fetch_remote_models', {
                baseUrl: provider.endpoint,
                apiKey: provider.key,
                apiType: 'openai' // Qoder usually follows OpenAI-compatible formats
            });
            
            setProviderModels(prev => ({ ...prev, [provider.name]: fetchedModels }));
            message.success(t('cliConfig.qoder.fields.modelsFetched', { count: fetchedModels.length }));
        } catch (error) {
            console.error(`Failed to fetch models for ${provider.name}:`, error);
            message.error(`${t('cliConfig.fetchModelsFailed')}: ${error}`);
        } finally {
            setFetchingModels(prev => ({ ...prev, [provider.name]: false }));
        }
    };

    const fetchTargetModels = async () => {
        const list = form.getFieldValue('api_keys_list') || [];
        if (list.length === 0) {
            message.warning(t('cliConfig.qoder.fields.addProvider'));
            return;
        }

        setFetchingAll(true);
        let totalFetched = 0;
        const newProviderModels = { ...providerModels };

        const providersToFetch = selectedProvider === 'all' 
            ? list 
            : list.filter((p: any) => p.name === selectedProvider);

        if (providersToFetch.length === 0 && selectedProvider !== 'all') {
            message.error(t('cliConfig.fetchModelsFailed'));
            setFetchingAll(false);
            return;
        }

        for (const provider of providersToFetch) {
            if (provider.name && provider.key && provider.endpoint) {
                try {
                    const fetchedModels = await invoke<string[]>('fetch_remote_models', {
                        baseUrl: provider.endpoint,
                        apiKey: provider.key,
                        apiType: 'openai'
                    });
                    newProviderModels[provider.name] = fetchedModels;
                    totalFetched += fetchedModels.length;
                } catch (error) {
                    console.error(`Failed to fetch models for ${provider.name}:`, error);
                }
            }
        }

        setProviderModels(newProviderModels);
        setFetchingAll(false);
        message.success(t('cliConfig.qoder.fields.modelsFetched', { count: totalFetched }));
    };

    const allModelOptions = Object.values(providerModels).flat().map(m => ({ label: m, value: m }));
    // Add some default common models if list is empty
    const finalModelOptions = allModelOptions.length > 0 ? allModelOptions : [
        { label: 'claude-3-5-sonnet', value: 'claude-3-5-sonnet' },
        { label: 'claude-3-haiku', value: 'claude-3-haiku' },
        { label: 'gpt-4o', value: 'gpt-4o' },
        { label: 'gpt-4-turbo', value: 'gpt-4-turbo' },
        { label: 'gemini-1.5-pro', value: 'gemini-1.5-pro' }
    ];

    const items = [
        {
            key: 'api_keys',
            label: (<span><KeyOutlined />{t('cliConfig.qoder.sections.apiKeys')}</span>),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Form.List name="api_keys_list">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Card 
                                        key={key} 
                                        size="small" 
                                        style={{ marginBottom: 16 }}
                                        title={`${t('cliConfig.qoder.fields.providerName')} #${name + 1}`}
                                        extra={
                                            <Space>
                                                <Tooltip title={t('cliConfig.qoder.fields.fetchModels')}>
                                                    <Button 
                                                        icon={<CloudDownloadOutlined />} 
                                                        onClick={() => fetchModels(name)} 
                                                        loading={fetchingModels[form.getFieldValue(['api_keys_list', name, 'name'])]}
                                                        type="text"
                                                    />
                                                </Tooltip>
                                                <Button 
                                                    icon={<DeleteOutlined />} 
                                                    onClick={() => remove(name)} 
                                                    danger 
                                                    type="text" 
                                                />
                                            </Space>
                                        }
                                    >
                                        <Row gutter={16}>
                                            <Col span={8}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'name']}
                                                    label={t('cliConfig.qoder.fields.providerName')}
                                                    rules={[{ required: true }]}
                                                >
                                                    <Input placeholder="openai / deepseek" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={16}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'key']}
                                                    label="API Key"
                                                    rules={[{ required: true }]}
                                                >
                                                    <Input.Password placeholder="sk-..." />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={16}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'endpoint']}
                                                    label={t('cliConfig.qoder.fields.endpoint')}
                                                    rules={[{ required: true }]}
                                                >
                                                    <Input placeholder="https://api.openai.com/v1" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={8}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'organization']}
                                                    label={t('cliConfig.qoder.fields.organization')}
                                                >
                                                    <Input placeholder="org-..." />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                        <Row gutter={16}>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'timeout']}
                                                    label={t('cliConfig.qoder.fields.timeout')}
                                                >
                                                    <InputNumber min={1000} step={1000} style={{ width: '100%' }} placeholder="30000" />
                                                </Form.Item>
                                            </Col>
                                            <Col span={12}>
                                                <Form.Item
                                                    {...restField}
                                                    name={[name, 'max_retries']}
                                                    label={t('cliConfig.qoder.fields.maxRetries')}
                                                >
                                                    <InputNumber min={0} max={10} style={{ width: '100%' }} placeholder="3" />
                                                </Form.Item>
                                            </Col>
                                        </Row>
                                    </Card>
                                ))}
                                <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                    {t('cliConfig.qoder.fields.addProvider')}
                                </Button>
                            </>
                        )}
                    </Form.List>
                </div>
            )
        },
        {
            key: 'editor',
            label: (<span><DesktopOutlined />{t('cliConfig.qoder.sections.appearance')}</span>),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['editor', 'theme', 'mode']} label={t('cliConfig.qoder.fields.themeMode')}>
                                <Select options={[
                                    { label: t('common.auto'), value: 'auto' },
                                    { label: t('common.light'), value: 'light' },
                                    { label: t('common.dark'), value: 'dark' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['editor', 'theme', 'contrast']} label={t('cliConfig.qoder.fields.contrast')}>
                                <Select options={[
                                    { label: t('common.low'), value: 'low' },
                                    { label: t('common.normal'), value: 'normal' },
                                    { label: t('common.high'), value: 'high' },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['editor', 'theme', 'light_theme']} label={t('cliConfig.qoder.fields.lightTheme')}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['editor', 'theme', 'dark_theme']} label={t('cliConfig.qoder.fields.darkTheme')}>
                                <Input />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider plain>{t('cliConfig.qoder.fields.fontFamily')}</Divider>
                    <Form.Item name={['editor', 'font', 'family']} label={t('cliConfig.qoder.fields.fontFamily')}>
                        <Input placeholder="'JetBrains Mono', 'Fira Code', monospace" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name={['editor', 'font', 'size']} label={t('cliConfig.qoder.fields.fontSize')}>
                                <InputNumber min={8} max={72} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['editor', 'font', 'line_height']} label={t('cliConfig.qoder.fields.lineHeight')}>
                                <InputNumber step={0.1} min={1} max={3} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['editor', 'font', 'ligatures']} label={t('cliConfig.qoder.fields.ligatures')} valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider plain>{t('cliConfig.qoder.fields.cursorStyle')}</Divider>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name={['editor', 'cursor', 'style']} label={t('cliConfig.qoder.fields.cursorStyle')}>
                                <Select options={[
                                    { label: t('cliConfig.qoder.fields.line'), value: 'line' },
                                    { label: t('cliConfig.qoder.fields.block'), value: 'block' },
                                    { label: t('cliConfig.qoder.fields.underline'), value: 'underline' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['editor', 'cursor', 'blink']} label={t('cliConfig.qoder.fields.blink')} valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['editor', 'cursor', 'smooth_caret']} label={t('cliConfig.qoder.fields.smoothCaret')} valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>
            )
        },
        {
            key: 'behavior',
            label: (<span><SettingOutlined />{t('cliConfig.qoder.sections.behavior')}</span>),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Divider plain>{t('cliConfig.qoder.sections.formatting')}</Divider>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name={['editor', 'formatting', 'tab_size']} label={t('cliConfig.qoder.fields.tabSize')}>
                                <InputNumber min={1} max={8} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['editor', 'formatting', 'insert_spaces']} label={t('cliConfig.qoder.fields.insertSpaces')} valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['editor', 'formatting', 'trim_trailing_whitespace']} label={t('cliConfig.qoder.fields.trimWhitespace')} valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item name={['editor', 'formatting', 'word_wrap']} label={t('cliConfig.qoder.fields.wordWrap')}>
                                <Select options={[
                                    { label: t('common.off'), value: 'off' },
                                    { label: t('common.on'), value: 'on' },
                                    { label: t('cliConfig.qoder.fields.bounded'), value: 'bounded' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['editor', 'formatting', 'word_wrap_column']} label={t('cliConfig.qoder.fields.wordWrapColumn')}>
                                <InputNumber min={40} max={300} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['editor', 'formatting', 'insert_final_newline']} label={t('cliConfig.qoder.fields.finalNewline')} valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider plain>{t('cliConfig.qoder.sections.behavior')}</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['editor', 'behavior', 'auto_save']} label={t('cliConfig.qoder.fields.autoSave')}>
                                <Select options={[
                                    { label: t('common.off'), value: 'off' },
                                    { label: t('cliConfig.qoder.fields.afterDelay'), value: 'afterDelay' },
                                    { label: t('cliConfig.qoder.fields.onFocusChange'), value: 'onFocusChange' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['editor', 'behavior', 'auto_save_delay']} label={t('cliConfig.qoder.fields.autoSaveDelay')}>
                                <InputNumber min={100} step={500} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Space size="large" wrap>
                        <Form.Item name={['editor', 'behavior', 'format_on_save']} label={t('cliConfig.qoder.fields.formatOnSave')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['editor', 'behavior', 'format_on_paste']} label={t('cliConfig.qoder.fields.formatOnPaste')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['editor', 'behavior', 'format_on_type']} label={t('cliConfig.qoder.fields.formatOnType')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>

                    <Divider plain>{t('cliConfig.qoder.sections.minimap')}</Divider>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item name={['editor', 'minimap', 'enabled']} label={t('common.enabled')} valuePropName="checked">
                                <Switch />
                            </Form.Item>
                        </Col>
                        <Col span={10}>
                            <Form.Item name={['editor', 'minimap', 'show_slider']} label={t('cliConfig.qoder.fields.showSlider')}>
                                <Select options={[{ label: t('cliConfig.qoder.fields.always'), value: 'always' }, { label: t('cliConfig.qoder.fields.mouseover'), value: 'mouseover' }]} />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item name={['editor', 'minimap', 'side']} label={t('cliConfig.qoder.fields.side')}>
                                <Select options={[{ label: t('cliConfig.qoder.fields.left'), value: 'left' }, { label: t('cliConfig.qoder.fields.right'), value: 'right' }]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name={['editor', 'minimap', 'scale']} label={t('cliConfig.qoder.fields.scale')}>
                        <InputNumber min={1} max={5} style={{ width: '100%' }} />
                    </Form.Item>

                    <Divider plain>{t('cliConfig.qoder.sections.highlighting')}</Divider>
                    <Space wrap>
                        <Form.Item name={['syntax_highlighting', 'enabled']} label={t('common.enabled')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['syntax_highlighting', 'semantic_highlighting']} label={t('cliConfig.qoder.fields.semanticHighlighting')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['syntax_highlighting', 'bracket_matching']} label={t('cliConfig.qoder.fields.bracketMatching')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['syntax_highlighting', 'color_decorators']} label={t('cliConfig.qoder.fields.colorDecorators')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['syntax_highlighting', 'indent_guides']} label={t('cliConfig.qoder.fields.indentGuides')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['syntax_highlighting', 'highlight_active_line']} label={t('cliConfig.qoder.fields.activeLineHighlight')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['syntax_highlighting', 'highlight_modified_tabs']} label={t('cliConfig.qoder.fields.modifiedTabsHighlight')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>
                    <Form.Item name={['syntax_highlighting', 'line_numbers']} label={t('cliConfig.qoder.fields.lineNumbers')}>
                        <Select options={[
                            { label: t('common.off'), value: 'off' },
                            { label: t('common.on'), value: 'on' },
                            { label: t('common.auto'), value: 'relative' }, // Assuming relative is similar to auto/contextual here
                        ]} />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'ai',
            label: (<span><ExperimentOutlined />{t('cliConfig.qoder.sections.aiModels')}</span>),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                        <Select 
                            value={selectedProvider} 
                            onChange={setSelectedProvider}
                            style={{ width: 200 }}
                            placeholder={t('cliConfig.qoder.fields.providerName')}
                            options={[
                                { label: t('common.all'), value: 'all' },
                                ...providers.map((p: any) => ({
                                    label: p?.name || 'Unknown',
                                    value: p?.name
                                }))
                            ]}
                        />
                        <Button 
                            icon={<CloudDownloadOutlined />} 
                            onClick={fetchTargetModels} 
                            loading={fetchingAll}
                            type="primary"
                            ghost
                        >
                            {t('cliConfig.qoder.fields.fetchModels')}
                        </Button>
                    </div>
                    <Form.Item name={['ai_models', 'primary_model']} label={t('cliConfig.qoder.fields.primaryModel')}>
                        <Select showSearch options={finalModelOptions} placeholder="claude-3-5-sonnet" />
                    </Form.Item>
                    <Form.Item name={['ai_models', 'fallback_model']} label={t('cliConfig.qoder.fields.fallbackModel')}>
                        <Select showSearch options={finalModelOptions} placeholder="claude-3-haiku" />
                    </Form.Item>
                    <Form.Item name={['ai_models', 'auto_model_selection']} label={t('cliConfig.qoder.fields.autoModelSelection')} valuePropName="checked">
                        <Switch />
                    </Form.Item>

                    <Divider plain>{t('cliConfig.qoder.fields.preferences')}</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['ai_models', 'model_preferences', 'code_completion']} label={t('cliConfig.qoder.fields.codeCompletion')}>
                                <Select showSearch options={finalModelOptions} placeholder="claude-3-haiku" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['ai_models', 'model_preferences', 'code_review']} label={t('cliConfig.qoder.fields.codeReview')}>
                                <Select showSearch options={finalModelOptions} placeholder="claude-3-5-sonnet" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['ai_models', 'model_preferences', 'architecture_design']} label={t('cliConfig.qoder.fields.archDesign')}>
                                <Select showSearch options={finalModelOptions} placeholder="gpt-4-turbo" />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['ai_models', 'model_preferences', 'documentation']} label={t('cliConfig.qoder.fields.documentation')}>
                                <Select showSearch options={finalModelOptions} placeholder="gemini-pro" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Divider plain>{t('cliConfig.qoder.sections.parameters')}</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['model_parameters', 'temperature']} label={t('cliConfig.qoder.fields.temperature')}>
                                <InputNumber step={0.1} min={0} max={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['model_parameters', 'max_tokens']} label={t('cliConfig.qoder.fields.maxOutputTokens')}>
                                <InputNumber step={1024} min={1024} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['model_parameters', 'top_p']} label={t('cliConfig.qoder.fields.topP')}>
                                <InputNumber step={0.05} min={0} max={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['model_parameters', 'context_window']} label={t('cliConfig.fields.maxContextTokens')}>
                                <Select options={[
                                    { label: t('common.auto'), value: 'auto' },
                                    { label: t('cliConfig.qoder.fields.small'), value: 'small' },
                                    { label: t('cliConfig.qoder.fields.large'), value: 'large' },
                                ]} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['model_parameters', 'frequency_penalty']} label={t('cliConfig.qoder.fields.frequencyPenalty')}>
                                <InputNumber step={0.1} min={-2} max={2} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['model_parameters', 'presence_penalty']} label={t('cliConfig.qoder.fields.presencePenalty')}>
                                <InputNumber step={0.1} min={-2} max={2} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name={['model_parameters', 'stop_sequences']} label={t('cliConfig.qoder.fields.stopSequences')}>
                        <Select mode="tags" placeholder={t('cliConfig.qoder.fields.stopSequencesPlaceholder')} />
                    </Form.Item>
                </div>
            )
        },
        {
            key: 'usage',
            label: (<span><SafetyOutlined />{t('cliConfig.qoder.sections.usage')}</span>),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['usage_limits', 'daily_requests']} label={t('cliConfig.qoder.fields.dailyRequests')}>
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['usage_limits', 'hourly_requests']} label={t('cliConfig.qoder.fields.hourlyRequests')}>
                                <InputNumber min={1} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['usage_limits', 'cost_limit_daily']} label={t('cliConfig.qoder.fields.dailyCost')}>
                                <InputNumber prefix="$" min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['usage_limits', 'cost_limit_monthly']} label={t('cliConfig.qoder.fields.monthlyCost')}>
                                <InputNumber prefix="$" min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Space size="large">
                        <Form.Item name={['usage_limits', 'alert_threshold']} label={t('cliConfig.qoder.fields.alertThreshold')}>
                            <InputNumber step={0.1} min={0.1} max={1} />
                        </Form.Item>
                        <Form.Item name={['usage_limits', 'auto_throttle']} label={t('cliConfig.qoder.fields.autoThrottle')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>

                    <Divider plain>{t('cliConfig.qoder.sections.analysis')}</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['analysis', 'depth']} label={t('cliConfig.qoder.fields.analysisDepth')}>
                                <Select options={[
                                    { label: t('cliConfig.qoder.fields.basic'), value: 'basic' },
                                    { label: t('cliConfig.qoder.fields.standard'), value: 'standard' },
                                    { label: t('cliConfig.qoder.fields.comprehensive'), value: 'comprehensive' },
                                ]} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['analysis', 'max_file_size']} label={t('cliConfig.qoder.fields.maxFileSize')}>
                                <Input placeholder="5MB" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name={['analysis', 'max_files']} label={t('cliConfig.qoder.fields.maxFiles')}>
                        <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                    <Space wrap>
                        <Form.Item name={['analysis', 'include_dependencies']} label={t('cliConfig.qoder.fields.includeDeps')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['analysis', 'analyze_external_libs']} label={t('cliConfig.qoder.fields.analyzeExternal')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['analysis', 'semantic_analysis']} label={t('cliConfig.qoder.fields.semanticAnalysis')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                        <Form.Item name={['analysis', 'cross_reference']} label={t('cliConfig.qoder.fields.crossRef')} valuePropName="checked">
                            <Switch />
                        </Form.Item>
                    </Space>
                </div>
            )
        },
        {
            key: 'network',
            label: (<span><GlobalOutlined />{t('cliConfig.qoder.sections.network')}</span>),
            children: (
                <div style={{ padding: '16px 0' }}>
                    <Form.Item name={['network', 'proxy', 'enabled']} label={t('common.enabled')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={18}>
                            <Form.Item name={['network', 'proxy', 'host']} label={t('cliConfig.qoder.fields.host')}>
                                <Input placeholder="127.0.0.1" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name={['network', 'proxy', 'port']} label={t('cliConfig.qoder.fields.port')}>
                                <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Divider plain>Proxy Auth</Divider>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name={['network', 'proxy', 'auth', 'username']} label={t('cliConfig.qoder.fields.username')}>
                                <Input />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name={['network', 'proxy', 'auth', 'password']} label={t('cliConfig.qoder.fields.password')}>
                                <Input.Password />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>
            )
        }
    ];

    return (
        <Card
            title={
                <Space>
                    <SettingOutlined />
                    <span>Qoder {t('common.settings', 'Settings')}</span>
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
                <Tabs defaultActiveKey="api_keys" items={items} />
                <Form.Item style={{ marginTop: 24 }}>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                        {t('aiSettings.mcpConfig.save', 'Save Configuration')}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default QoderAuthEditor;
