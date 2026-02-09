
import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, message, Space, Alert } from 'antd';
import { SaveOutlined, KeyOutlined, EyeInvisibleOutlined, EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';

const AUTH_CONFIG_PATH = '~/.codex/auth.json';

const CodexAuthEditor: React.FC = () => {
    const { t } = useTranslation();
    const [config, setConfig] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const loadConfig = async () => {
        setLoading(true);
        try {
            const content = await invoke<string>('get_config_file', { path: AUTH_CONFIG_PATH });
            if (content) {
                const parsed = JSON.parse(content);
                setConfig(parsed);
                form.setFieldsValue({ key: parsed.OPENAI_API_KEY || '' });
            } else {
                setConfig({});
                form.setFieldsValue({ key: '' });
            }
        } catch (error) {
            console.error('Failed to load Codex auth config:', error);
            setConfig({});
            form.setFieldsValue({ key: '' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadConfig();
    }, []);

    const handleSave = async (values: any) => {
        const newConfig = { ...config, OPENAI_API_KEY: values.key };

        try {
            await invoke('save_config_file', { path: AUTH_CONFIG_PATH, content: JSON.stringify(newConfig, null, 2) });
            message.success(t('aiSettings.mcpConfig.saved', 'Saved config'));
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
                    <span>Codex & {t('aiSettings.cliConfig.fields.apiKey', 'API Key')}</span>
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

export default CodexAuthEditor;
