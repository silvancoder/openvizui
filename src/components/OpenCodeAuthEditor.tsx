
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, AutoComplete, message, Space, Alert } from 'antd';
import { SaveOutlined, KeyOutlined, EyeInvisibleOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

const AUTH_CONFIG_PATH = '~/.local/share/opencode/auth.json';

interface AuthEntry {
    type: 'api';
    key: string;
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

const OpenCodeAuthEditor: React.FC = () => {
    const { t } = useTranslation();
    const [config, setConfig] = useState<AuthConfig>({});
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const loadConfig = async () => {
        setLoading(true);
        try {
            const content = await invoke<string>('get_config_file', { path: AUTH_CONFIG_PATH });
            if (content) {
                const parsed = JSON.parse(content);
                setConfig(parsed);
                // If there's only one provider, auto-fill it? Or just leave empty. 
                // Let's not auto-fill to avoid confusion if multiple exist.
                // But we could auto-fill if the user selects a provider.
            } else {
                setConfig({});
            }
        } catch (error) {
            console.error('Failed to load auth config:', error);
            setConfig({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleProviderChange = (provider: string) => {
        if (config[provider]) {
            form.setFieldsValue({ key: config[provider].key });
        } else {
            form.setFieldsValue({ key: '' });
        }
    };

    const handleSave = async (values: any) => {
        const newConfig = { ...config };

        // Remove entry if key is empty? No, maybe they want to unset it.
        // But typically we save what's there.
        if (!values.key) {
            delete newConfig[values.provider];
        } else {
            newConfig[values.provider] = {
                type: 'api',
                key: values.key,
            };
        }

        try {
            await invoke('save_config_file', { path: AUTH_CONFIG_PATH, content: JSON.stringify(newConfig, null, 2) });
            message.success(t('aiSettings.mcpConfig.saved', 'Saved config for') + ' ' + values.provider);
            setConfig(newConfig);
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Failed to save config:') + ' ' + error);
        }
    };

    return (
        <Card
            title={
                <Space>
                    <KeyOutlined />
                    <span>{t('aiSettings.cliConfig.fields.providerName', 'Provider')} & {t('aiSettings.cliConfig.fields.apiKey', 'API Key')}</span>
                </Space>
            }
            extra={<Button icon={<ReloadOutlined />} onClick={loadConfig} loading={loading} type="text" />}
            style={{ marginTop: 24, marginBottom: 24 }}
        >
            <Alert
                message={t('aiSettings.mcpConfig.savePathTip', { path: AUTH_CONFIG_PATH })}
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Form.Item
                    name="provider"
                    label={t('aiSettings.cliConfig.fields.providerName', 'Provider')}
                    rules={[{ required: true }]}
                >
                    <AutoComplete
                        options={PROVIDERS.map(p => ({ value: p }))}
                        placeholder={t('aiSettings.mcpConfig.selectProvider', 'Select or type provider name')}
                        filterOption={(inputValue, option) =>
                            (option?.value?.toString().toUpperCase().indexOf(inputValue.toUpperCase()) ?? -1) !== -1
                        }
                        onChange={handleProviderChange}
                        onSelect={handleProviderChange}
                    />
                </Form.Item>
                <Form.Item
                    name="key"
                    label={t('aiSettings.cliConfig.fields.apiKey', 'API Key')}
                    rules={[{ required: true }]}
                >
                    <Input.Password
                        placeholder="sk-..."
                        iconRender={visible => (visible ? <EyeOutlined /> : <EyeInvisibleOutlined />)}
                    />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                        {t('aiSettings.mcpConfig.save', 'Save Auth Config')}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default OpenCodeAuthEditor;
