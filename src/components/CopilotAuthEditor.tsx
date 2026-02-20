/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\CopilotAuthEditor.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Form, message, Space, Alert, Modal, Switch, Divider } from 'antd';
import { SaveOutlined, GithubOutlined, ReloadOutlined, SettingOutlined, BugOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { useNavigate } from 'react-router-dom';

const CONFIG_PATH = '~/.copilot/config.json';

const CopilotAuthEditor: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { setActiveToolId, setPendingCommand } = useAppStore();
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const loadConfig = async () => {
        setLoading(true);
        try {
            const content = await invoke<string>('get_config_file', { path: CONFIG_PATH });
            if (content) {
                const parsed = JSON.parse(content);
                form.setFieldsValue(parsed);
            } else {
                form.resetFields();
            }
        } catch (error) {
            console.error('Failed to load Copilot config:', error);
            // Don't show error if file just doesn't exist
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
            await invoke('save_config_file', { path: CONFIG_PATH, content: JSON.stringify(values, null, 2) });
            message.success(t('aiSettings.mcpConfig.saved', 'Saved Copilot settings'));
        } catch (error) {
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Failed to save config') + ': ' + error);
        }
    };

    const runGithubLogin = () => {
        Modal.info({
            title: t('cliConfig.copilotTitle', 'GitHub Copilot Authentication Steps'),
            content: (
                <div style={{ whiteSpace: 'pre-wrap' }}>
                    <p>{t('cliConfig.copilotPrompt')}</p>
                </div>
            ),
            onOk: () => {
                setActiveToolId('copilot');
                setPendingCommand('gh auth login');
                navigate('/terminal');
            },
            okText: t('common.goToTerminal', 'Go to Terminal'),
        });
    };

    return (
        <Card
            title={
                <Space>
                    <GithubOutlined />
                    <span>GitHub Copilot {t('common.settings', 'Settings')}</span>
                </Space>
            }
            extra={<Button icon={<ReloadOutlined />} onClick={loadConfig} loading={loading} type="text" />}
            style={{ marginTop: 24, marginBottom: 24 }}
        >
            <Alert
                message={t('aiSettings.mcpConfig.savePathTip', { path: CONFIG_PATH })}
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />

            <div style={{ marginBottom: 24, padding: '16px', background: '#f5f5f5', borderRadius: '8px' }}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{t('cliConfig.sections.auth', 'Authentication')}</span>
                            <p style={{ margin: '4px 0 0', color: 'rgba(0,0,0,0.45)' }}>
                                {t('cliConfig.descriptions.githubAuth', 'Use GitHub CLI to authenticate your account.')}
                            </p>
                        </div>
                        <Button type="primary" icon={<GithubOutlined />} onClick={runGithubLogin}>
                            {t('cliConfig.loginWithGithub', 'Login with GitHub')}
                        </Button>
                    </div>
                </Space>
            </div>

            <Form form={form} layout="vertical" onFinish={handleSave}>
                <Divider plain>
                    <Space><SettingOutlined />{t('cliConfig.sections.basic', 'Basic Settings')}</Space>
                </Divider>

                <Form.Item name="editor" label={t('cliConfig.fields.editor', 'Editor')} tooltip={t('cliConfig.descriptions.editor')}>
                    <Input placeholder="code" />
                </Form.Item>

                <Space size="large">
                    <Form.Item name="debug" label={t('cliConfig.fields.debugMode', 'Debug Mode')} valuePropName="checked">
                        <Switch />
                    </Form.Item>
                    <Form.Item 
                        name="confirm_execute" 
                        label={t('cliConfig.fields.confirmExecute', 'Confirm Before Execute')} 
                        valuePropName="checked"
                        tooltip={t('cliConfig.descriptions.confirmExecute')}
                    >
                        <Switch />
                    </Form.Item>
                </Space>

                <Divider plain>
                    <Space><BugOutlined />{t('cliConfig.sections.advanced', 'Advanced / Override')}</Space>
                </Divider>

                <Form.Item 
                    name={['github', 'token']} 
                    label={t('cliConfig.fields.githubToken', 'GitHub Token Override')} 
                    tooltip={t('cliConfig.descriptions.githubToken')}
                >
                    <Input.Password placeholder="ghp_..." />
                </Form.Item>

                <Form.Item style={{ marginTop: 24 }}>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                        {t('aiSettings.mcpConfig.save', 'Save Configuration')}
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default CopilotAuthEditor;
