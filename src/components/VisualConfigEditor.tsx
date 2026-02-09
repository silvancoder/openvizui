
import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, Select, Switch, InputNumber, Alert, AutoComplete, Row, Col, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { PROVIDERS } from './OpenCodeAuthEditor';
import * as toml from 'smol-toml';

interface SchemaField {
    type: 'string' | 'boolean' | 'number' | 'array' | 'object';
    label: string;
    description?: string;
    default?: any;
    options?: string[]; // For select modules
    itemType?: 'string' | 'object'; // For arrays
    placeholder?: string;
}

interface ToolTemplate {
    format: 'json' | 'toml';
    description: string; // This can also be a key
    schema: Record<string, SchemaField>;
}

export const TOOL_TEMPLATES: Record<string, ToolTemplate> = {
    Claude: {
        format: 'json',
        description: 'tools.claude', // We can fallback to name or specific desc key
        schema: {
            verbose: { type: 'boolean', label: 'aiSettings.cliConfig.fields.verbose', default: false, description: 'aiSettings.cliConfig.descriptions.verbose' },
            theme: { type: 'string', label: 'aiSettings.cliConfig.fields.theme', options: ['dark', 'light', 'system'], default: 'system' },
            preferredModel: { type: 'string', label: 'aiSettings.cliConfig.fields.preferredModel', default: 'claude-3-opus-20240229' },
            editor: { type: 'string', label: 'aiSettings.cliConfig.fields.editor', description: 'aiSettings.cliConfig.descriptions.editor', default: 'code' },
            autoUpdater: { type: 'boolean', label: 'aiSettings.cliConfig.fields.autoUpdate', default: true },
            maxContextTokens: { type: 'number', label: 'aiSettings.cliConfig.fields.maxContextTokens', default: 200000, description: 'aiSettings.cliConfig.descriptions.limitContext' }
        }
    },
    Gemini: {
        format: 'json',
        description: 'tools.google',
        schema: {
            model: { type: 'string', label: 'aiSettings.cliConfig.fields.model', default: 'gemini-1.5-pro', options: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-1.0-pro'] },
            temperature: { type: 'number', label: 'aiSettings.cliConfig.fields.temperature', default: 0.9, description: 'aiSettings.cliConfig.descriptions.randomness' },
            maxOutputTokens: { type: 'number', label: 'aiSettings.cliConfig.fields.maxOutputTokens', default: 8192 },
            topP: { type: 'number', label: 'aiSettings.cliConfig.fields.topP', default: 0.95 },
            topK: { type: 'number', label: 'aiSettings.cliConfig.fields.topK', default: 40 },
            safetySettings: { type: 'string', label: 'aiSettings.cliConfig.fields.safetySettings', description: 'aiSettings.cliConfig.descriptions.safety', default: '{}' }
        }
    },
    OpenCode: {
        format: 'json',
        description: 'tools.opencode',
        schema: {
            // General
            model: { type: 'string', label: 'aiSettings.cliConfig.fields.model', default: 'gpt-4o' },
            theme: { type: 'string', label: 'aiSettings.cliConfig.fields.theme', default: 'opencode', options: ['opencode', 'dark', 'light', 'dracula', 'monokai'] },
            autoupdate: { type: 'boolean', label: 'aiSettings.cliConfig.fields.autoUpdate', default: true },
            default_agent: { type: 'string', label: 'aiSettings.cliConfig.fields.defaultAgent', default: 'plan', options: ['plan', 'code', 'chat'] },
            instructions: { type: 'array', label: 'aiSettings.cliConfig.fields.instructions', default: [], itemType: 'string' },
            disabled_providers: { type: 'array', label: 'aiSettings.cliConfig.fields.disabledProviders', default: [], itemType: 'string' },

            // Server
            "server.port": { type: 'number', label: 'aiSettings.cliConfig.fields.server.port', default: 4096 },
            "server.hostname": { type: 'string', label: 'aiSettings.cliConfig.fields.server.hostname', default: '0.0.0.0' },
            "server.mdns": { type: 'boolean', label: 'aiSettings.cliConfig.fields.server.mdns', default: true },
            "server.cors": { type: 'array', label: 'aiSettings.cliConfig.fields.server.cors', default: [], itemType: 'string' },

            // TUI
            "tui.scroll_speed": { type: 'number', label: 'aiSettings.cliConfig.fields.tui.scrollSpeed', default: 3 },
            "tui.diff_style": { type: 'string', label: 'aiSettings.cliConfig.fields.tui.diffStyle', default: 'auto', options: ['auto', 'side-by-side', 'inline'] },

            // Tools
            "tools.write": { type: 'boolean', label: 'aiSettings.cliConfig.fields.tools.write', default: true },
            "tools.bash": { type: 'boolean', label: 'aiSettings.cliConfig.fields.tools.bash', default: true },

            // Permissions
            "permission.edit": { type: 'string', label: 'aiSettings.cliConfig.fields.permission.edit', default: 'ask', options: ['ask', 'allow', 'deny'] },
            "permission.bash": { type: 'string', label: 'aiSettings.cliConfig.fields.permission.bash', default: 'ask', options: ['ask', 'allow', 'deny'] },

            // Compaction
            "compaction.auto": { type: 'boolean', label: 'aiSettings.cliConfig.fields.compaction.auto', default: true },
            "compaction.prune": { type: 'boolean', label: 'aiSettings.cliConfig.fields.compaction.prune', default: true },

            // Provider Options (Example: Anthropic)
            "provider.anthropic.options.timeout": { type: 'number', label: 'aiSettings.cliConfig.fields.provider.timeout', default: 600000 },
        }
    },
    Qoder: {
        format: 'json',
        description: 'tools.qoder',
        schema: {
            autoUpdate: { type: 'boolean', label: 'aiSettings.cliConfig.fields.autoUpdate', default: true },
            language: { type: 'string', label: 'aiSettings.cliConfig.fields.language', options: ['en', 'zh'], default: 'en' },
            "privacy.telemetry": { type: 'boolean', label: 'aiSettings.cliConfig.fields.telemetry', default: true },
            "permissions.default": { type: 'string', label: 'aiSettings.cliConfig.fields.defaultPermission', options: ['ask', 'allow', 'deny'], default: 'ask' }
        }
    },
    CodeBuddy: {
        format: 'json',
        description: 'tools.codebuddy',
        schema: {
            language: { type: 'string', label: 'aiSettings.cliConfig.fields.language', options: ['zh-CN', 'en-US'], default: 'zh-CN' },
            api_key: { type: 'string', label: 'aiSettings.cliConfig.fields.apiKey', description: 'aiSettings.cliConfig.descriptions.tencentKey' },
            model: { type: 'string', label: 'aiSettings.cliConfig.fields.model', default: 'hunyuan-pro' },
            "editor.integration": { type: 'boolean', label: 'aiSettings.cliConfig.fields.editorIntegration', default: true }
        }
    },
    Copilot: {
        format: 'json',
        description: 'tools.copilot',
        schema: {
            editor: { type: 'string', label: 'aiSettings.cliConfig.fields.editor', default: 'code' },
            debug: { type: 'boolean', label: 'aiSettings.cliConfig.fields.debugMode', default: false },
            confirm_execute: { type: 'boolean', label: 'aiSettings.cliConfig.fields.confirmExecute', default: true, description: 'aiSettings.cliConfig.descriptions.confirmExecute' },
            "github.token": { type: 'string', label: 'aiSettings.cliConfig.fields.githubToken', description: 'aiSettings.cliConfig.descriptions.githubToken' }
        }
    },
    Codex: {
        format: 'toml',
        description: 'tools.codex',
        schema: {
            model_provider: { type: 'string', label: 'aiSettings.cliConfig.fields.modelProvider', default: 'openai', options: ['openai', 'anthropic'], description: 'aiSettings.cliConfig.descriptions.modelProvider' },
            "_v_provider.base_url": { type: 'string', label: 'aiSettings.cliConfig.fields.provider.baseUrl', default: 'https://api.url/v1' },
            "_v_provider.name": { type: 'string', label: 'aiSettings.cliConfig.fields.provider.name', default: '' },
            model: { type: 'string', label: 'aiSettings.cliConfig.fields.model', default: '' },
            model_reasoning_effort: { type: 'string', label: 'aiSettings.cliConfig.fields.reasoningEffort', default: 'high', options: ['high', 'medium', 'low'] },
            disable_response_storage: { type: 'boolean', label: 'aiSettings.cliConfig.fields.disableResponseStorage', default: true },
            preferred_auth_method: { type: 'string', label: 'aiSettings.cliConfig.fields.preferredAuthMethod', default: 'apikey', options: ['apikey', 'oauth'] },
        }
    }
};

interface VisualConfigEditorProps {
    toolName: string;
    configContent: string;
    onChange: (newContent: string) => void;
    activeProvider?: string;
}


const mergeDeep = (target: any, source: any) => {
    const output = { ...target };
    if (source && typeof source === 'object') {
        Object.keys(source).forEach((key) => {
            if (source[key] === undefined) return;
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                if (!(key in target)) {
                    output[key] = source[key];
                } else {
                    output[key] = mergeDeep(target[key], source[key]);
                }
            } else {
                output[key] = source[key];
            }
        });
    }
    return output;
};

const VisualConfigEditor: React.FC<VisualConfigEditorProps> = ({ toolName, configContent, onChange }) => {
    const { t } = useTranslation();
    const template = TOOL_TEMPLATES[toolName];
    const isInternalChange = useRef(false);
    const [form] = Form.useForm();
    const [parseError, setParseError] = useState<string | null>(null);
    const [fetchedModels, setFetchedModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string | undefined>(undefined);
    const [configuredProviders, setConfiguredProviders] = useState<string[]>([]);
    const [codexModels, setCodexModels] = useState<string[]>([]);

    useEffect(() => {
        if (toolName === 'OpenCode') {
            import('@tauri-apps/api/core').then(({ invoke }) => {
                invoke<string>('get_config_file', { path: '~/.local/share/opencode/auth.json' })
                    .then(content => {
                        try {
                            const config = JSON.parse(content);
                            setConfiguredProviders(Object.keys(config));
                        } catch (e) {
                            console.error("Failed to parse auth.json", e);
                        }
                    })
                    .catch(e => {
                        console.warn("Failed to load auth.json", e);
                    });
            });
        }
    }, [toolName]);

    // Watch for provider changes in form
    const currentFormProvider = Form.useWatch('provider', form);

    useEffect(() => {
        if (toolName === 'OpenCode') {
            const providerToFetch = selectedProvider || currentFormProvider || "";
            if (!providerToFetch) {
                setFetchedModels([]);
                return;
            }

            setLoadingModels(true);
            import('@tauri-apps/api/core').then(({ invoke }) => {
                invoke<string[]>('get_models', { provider: providerToFetch })
                    .then(models => {
                        setFetchedModels(models);
                        setLoadingModels(false);
                    })
                    .catch(err => {
                        console.error("Failed to fetch models", err);
                        setLoadingModels(false);
                        setFetchedModels([]);
                    });
            });
        } else {
            setFetchedModels([]);
        }
    }, [toolName, selectedProvider, currentFormProvider]);

    const fetchCodexModels = async () => {
        const baseUrl = form.getFieldValue(['_v_provider', 'base_url']);
        if (!baseUrl) {
            import('antd').then(({ message }) => message.warning(t('aiSettings.warnings.noBaseUrl', 'Please enter a Base URL first')));
            return;
        }

        setLoadingModels(true);
        try {
            const { invoke } = await import('@tauri-apps/api/core');
            const authContent = await invoke<string>('get_config_file', { path: '~/.codex/auth.json' });
            let apiKey = '';
            if (authContent) {
                const auth = JSON.parse(authContent);
                apiKey = auth.OPENAI_API_KEY || '';
            }

            if (!apiKey) {
                import('antd').then(({ message }) => message.warning(t('aiSettings.warnings.noApiKey', 'Please configure Codex API Key first')));
                setLoadingModels(false);
                return;
            }

            const models = await invoke<string[]>('fetch_remote_models', { baseUrl: baseUrl, apiKey: apiKey });
            setCodexModels(models);
            import('antd').then(({ message }) => message.success(t('aiSettings.status.modelsFetched', 'Fetched {{count}} models', { count: models.length })));
        } catch (err) {
            console.error("Failed to fetch Codex models", err);
            import('antd').then(({ message }) => message.error(t('aiSettings.errors.fetchFailed', 'Failed to fetch models: ') + err));
        } finally {
            setLoadingModels(false);
        }
    };

    useEffect(() => {
        let parsed: any = {};
        try {
            if (template.format === 'json') {
                parsed = configContent.trim() ? JSON.parse(configContent) : {};
            } else if (template.format === 'toml') {
                parsed = configContent.trim() ? toml.parse(configContent) : {};
            }

            // Special mapping for Codex: load data from active provider section into virtual fields
            if (toolName === 'Codex') {
                const provider = parsed.model_provider || 'openai';
                const providerData = parsed.model_providers?.[provider] || {};
                parsed._v_provider = {
                    base_url: providerData.base_url || '',
                    name: providerData.name || ''
                };
            }

            if (isInternalChange.current) {
                isInternalChange.current = false;
                return;
            }

            // Optimization: Only update form if values have actually changed
            const currentValues = form.getFieldsValue(true);
            if (JSON.stringify(parsed) !== JSON.stringify(currentValues)) {
                form.setFieldsValue(parsed);
            }
            setParseError(null);
        } catch (e) {
            setParseError(`Failed to parse ${template.format.toUpperCase()}: ${e}`);
        }
    }, [configContent, toolName, form, template]);

    const handleValuesChange = (_changedValues: any, allValues: any) => {
        isInternalChange.current = true;

        let current: any = {};
        try {
            const trimmed = configContent.trim();
            if (template.format === 'json') {
                current = trimmed ? JSON.parse(trimmed) : {};
            } else {
                current = trimmed ? toml.parse(trimmed) : {};
            }
        } catch (e) {
            // Silently handle parse error, will overwrite on next valid save
        }

        // Prepare updates
        const finalValues = { ...allValues };

        // Handle Codex mapping explicitly
        if (toolName === 'Codex') {
            const provider = allValues.model_provider || 'openai';
            const vData = allValues._v_provider || {};

            if (!current.model_providers) current.model_providers = {};

            // Cleanup current to only have active provider section
            Object.keys(current.model_providers).forEach(k => {
                if (k !== provider) delete current.model_providers[k];
            });

            // Set current provider data
            current.model_providers[provider] = {
                ...(current.model_providers[provider] || {}),
                base_url: vData.base_url || '',
                name: vData.name || ''
            };

            // Remove internal/remapped fields from merge queue
            delete finalValues._v_provider;
            delete finalValues.model_providers;
        }

        // Sync schema fields (top level ones like 'model', 'model_provider')
        Object.keys(template.schema).forEach(key => {
            if (!key.startsWith('_v_') && finalValues[key] !== undefined) {
                current[key] = finalValues[key];
            }
        });

        // 4. Merge remaining fields
        const updated = mergeDeep(current, finalValues);

        // Deep cleanup of virtual fields to ensure zero leakage
        const deepCleanup = (obj: any) => {
            if (!obj || typeof obj !== 'object') return;
            Object.keys(obj).forEach(key => {
                if (key.startsWith('_v_')) {
                    delete obj[key];
                } else {
                    deepCleanup(obj[key]);
                }
            });
        };
        deepCleanup(updated);

        try {
            const output = template.format === 'json'
                ? JSON.stringify(updated, null, 2)
                : toml.stringify(updated);
            onChange(output);
            setParseError(null);
        } catch (e: any) {
            setParseError(`${template.format.toUpperCase()} Save Error: ${e.message}`);
        }
    };

    if (!template) {
        return <Alert message={t('aiSettings.errors.noTemplate', 'No visual template available for this tool.')} type="info" />;
    }

    if (parseError) {
        return (
            <Alert
                message={t('aiSettings.mcpConfig.parseError', 'Error Parsing Config')}
                description={`${parseError}. ${t('aiSettings.warnings.fixInCode', 'Switch to Code view to fix syntax errors.')}`}
                type="error"
                showIcon
            />
        );
    }

    return (
        <div style={{ padding: 16, maxWidth: 800 }}>
            <Alert message={t(template.description)} type="info" showIcon style={{ marginBottom: 24 }} />

            <Form
                form={form}
                layout="vertical"
                onValuesChange={handleValuesChange}
            >
                {toolName === 'OpenCode' && (
                    <Alert
                        message={t('aiSettings.mcpConfig.pluginsHint', 'Plugins directory: ~/.config/opencode/plugins')}
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                )}
                {Object.entries(template.schema).map(([key, field]) => {
                    const label = t(field.label);
                    const description = field.description ? t(field.description) : undefined;
                    const namePath = key.includes('.') ? key.split('.') : key;

                    if (field.type === 'boolean') {
                        return (
                            <Form.Item key={key} name={namePath} label={label} valuePropName="checked" tooltip={description}>
                                <Switch />
                            </Form.Item>
                        );
                    } else if (field.type === 'array' && field.itemType === 'string') {
                        return (
                            <Form.Item key={key} name={namePath} label={label} tooltip={description}>
                                <Select mode="tags" tokenSeparators={[',']} placeholder={t('common.placeholder', 'Type and press enter')} />
                            </Form.Item>
                        );
                    } else if (key === 'model' && toolName === 'OpenCode') {
                        return (
                            <Form.Item key={key} label={label} tooltip={description}>
                                <Row gutter={8}>
                                    <Col span={8}>
                                        <Select
                                            placeholder={t('aiSettings.cliConfig.fields.providerName', 'Provider')}
                                            options={[
                                                {
                                                    label: t('aiSettings.mcpConfig.configuredProviders', 'Configured Providers'),
                                                    options: configuredProviders.map(p => ({ label: p, value: p }))
                                                },
                                                {
                                                    label: t('aiSettings.mcpConfig.allProviders', 'All Providers'),
                                                    options: PROVIDERS.filter(p => !configuredProviders.includes(p)).map(p => ({ label: p, value: p }))
                                                }
                                            ]}
                                            value={selectedProvider || currentFormProvider}
                                            onChange={setSelectedProvider}
                                            allowClear
                                            showSearch
                                            style={{ width: '100%' }}
                                        />
                                    </Col>
                                    <Col span={16}>
                                        <Form.Item name={namePath} noStyle>
                                            <AutoComplete
                                                options={fetchedModels.map(m => ({ value: m }))}
                                                placeholder="Select or type model"
                                                disabled={loadingModels}
                                                filterOption={(inputValue, option) =>
                                                    (option?.value?.toString().toUpperCase().indexOf(inputValue.toUpperCase()) ?? -1) !== -1
                                                }
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </Form.Item>
                        );
                    } else if (key === 'model' && toolName === 'Codex') {
                        return (
                            <Form.Item key={key} label={label} tooltip={description}>
                                <Row gutter={8}>
                                    <Col flex="auto">
                                        <Form.Item name={namePath} noStyle>
                                            <AutoComplete
                                                options={codexModels.map(m => ({ value: m }))}
                                                placeholder="Select or type model"
                                                disabled={loadingModels}
                                                filterOption={(inputValue, option) =>
                                                    (option?.value?.toString().toUpperCase().indexOf(inputValue.toUpperCase()) ?? -1) !== -1
                                                }
                                                style={{ width: '100%' }}
                                            />
                                        </Form.Item>
                                    </Col>
                                    <Col>
                                        <Button
                                            loading={loadingModels}
                                            onClick={fetchCodexModels}
                                        >
                                            {t('aiSettings.mcpConfig.fetchModels', 'Fetch Models')}
                                        </Button>
                                    </Col>
                                </Row>
                            </Form.Item>
                        );
                    }

                    let inputNode;
                    if (field.type === 'string') {
                        if (field.options) {
                            inputNode = <Select options={field.options.map(o => ({ label: o, value: o }))} />;
                        } else {
                            inputNode = <Input placeholder={String(field.default || '')} />;
                        }
                    } else if (field.type === 'number') {
                        inputNode = <InputNumber style={{ width: '100%' }} placeholder={String(field.default || '')} />;
                    }

                    return (
                        <Form.Item key={key} name={namePath} label={label} tooltip={description}>
                            {inputNode}
                        </Form.Item>
                    );
                })}
            </Form>
        </div>
    );
};

export default VisualConfigEditor;
