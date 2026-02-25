/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\pages\Dashboard.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { Card, Button, Row, Col, Tag, Typography, message, Modal, Select, Space, Tooltip, theme, Skeleton, Empty } from 'antd';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ReloadOutlined, PlusOutlined, CodeOutlined } from '@ant-design/icons';
import { installTool, uninstallTool, checkToolStatus, updateTool, openUrl } from '../lib/tauri';
import { useEffect, useState } from 'react';

import { useAppStore } from '../store/appStore';

const { Title } = Typography;

interface ToolItem {
    id: string;
    name: string;
    icon: React.ReactNode;
}

const Dashboard = () => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toolStatuses, activeTools, refreshTools, addActiveTool, removeActiveTool, setToolStatus, isLoaded } = useAppStore();
    const [refreshing, setRefreshing] = useState(false);
    const [updating, setUpdating] = useState<Record<string, boolean>>({});
    const [uninstalling, setUninstalling] = useState<Record<string, boolean>>({});
    const [processing, setProcessing] = useState<Record<string, boolean>>({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedToolToAdd, setSelectedToolToAdd] = useState<string | null>(null);
    const [addingTool, setAddingTool] = useState(false);

    const ToolIcon = ({ name, color }: { id: string, name: string, color: string }) => {
        return (
            <div style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: `linear-gradient(135deg, ${color}20, ${color}08)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: `1.5px solid ${color}40`,
                color: color,
                fontSize: '20px',
                fontWeight: '700',
                flexShrink: 0,
                boxShadow: `0 2px 8px ${color}15`,
                textShadow: `0 0 10px ${color}30`
            }}>
                {name.charAt(0).toUpperCase()}
            </div>
        );
    };

    const toolDefs: ToolItem[] = [
        {
            id: 'claude',
            name: t('tools.claude'),
            icon: <ToolIcon id="claude" name="Claude" color="#D97757" />
        },
        {
            id: 'google',
            name: t('tools.google'),
            icon: <ToolIcon id="google" name="Google" color="#4285F4" />
        },
        {
            id: 'opencode',
            name: t('tools.opencode'),
            icon: <ToolIcon id="opencode" name="OpenCode" color="#0EA5E9" />
        },
        {
            id: 'qoder',
            name: t('tools.qoder'),
            icon: <ToolIcon id="qoder" name="Qoder" color="#8B5CF6" />
        },
        {
            id: 'codebuddy',
            name: t('tools.codebuddy'),
            icon: <ToolIcon id="codebuddy" name="CodeBuddy" color="#F59E0B" />
        },
        {
            id: 'copilot',
            name: t('tools.copilot'),
            icon: <ToolIcon id="copilot" name="Copilot" color="#6366F1" />
        },
        {
            id: 'codex',
            name: t('tools.codex'),
            icon: <ToolIcon id="codex" name="Codex" color="#14B8A6" />
        },

    ];

    const docLinks: Record<string, string> = {
        'copilot': 'https://docs.github.com/en/copilot/how-tos/copilot-cli',
        'claude': 'https://code.claude.com/docs',
        'google': 'https://geminicli.com/docs',
        'opencode': 'https://opencode.ai/docs',
        'qoder': 'https://docs.qoder.com/cli/using-cli',
        'codebuddy': 'https://www.codebuddy.ai/docs/cli/overview',
        'codex': 'https://developers.openai.com/codex/cli'
    };

    // When activeTools changes, refresh their status
    // Only auto-refresh if we don't have statuses for them yet (e.g. initial load)
    useEffect(() => {
        const checkMissing = () => {
            if (activeTools.length > 0) {
                const missingStatuses = activeTools.some(id => !toolStatuses[id]);
                if (missingStatuses) {
                    handleRefresh();
                }
            }
        };
        checkMissing();
    }, [activeTools]); // Removed toolStatuses from deps to prevent infinite loops if status changes

    const handleRefresh = async () => {
        if (activeTools.length === 0) return;
        setRefreshing(true);
        await refreshTools(activeTools);
        setRefreshing(false);
    };

    const handleAddTool = async () => {
        if (!selectedToolToAdd) return;
        setAddingTool(true);
        const toolId = selectedToolToAdd;

        try {
            message.loading({ content: t('app.messages.checking', { name: toolId }), key: 'add_tool', duration: 0 });
            // 1. Check if already installed
            const status = await checkToolStatus(toolId);

            if (status.installed) {
                message.success({ content: t('app.messages.alreadyInstalled', { name: toolId }), key: 'add_tool' });
                setToolStatus(status);
                await addActiveTool(toolId);
            } else {
                // 2. Not installed, try to install
                message.loading({ content: t('app.messages.installing', { name: toolId }), key: 'add_tool', duration: 0 });
                await installTool(toolId);
                // 3. Verify and Add
                const newStatus = await checkToolStatus(toolId);
                if (newStatus.installed) {
                    setToolStatus(newStatus);
                    await addActiveTool(toolId);
                    message.success({ content: t('app.messages.installed', { name: toolId }), key: 'add_tool' });
                } else {
                    throw new Error("Installation verified failed");
                }
            }
            setIsModalOpen(false);
            setSelectedToolToAdd(null);
        } catch (e) {
            message.error({ content: t('app.messages.installFailed', { name: toolId, error: e }), key: 'add_tool' });
        } finally {
            setAddingTool(false);
        }
    };

    const handleUninstall = async (toolId: string) => {
        setUninstalling(prev => ({ ...prev, [toolId]: true }));
        setProcessing(prev => ({ ...prev, [toolId]: true }));
        try {
            message.loading({ content: t('app.messages.uninstalling', { name: toolId }), key: 'uninstall', duration: 0 });
            await uninstallTool(toolId);
            await removeActiveTool(toolId); // Remove from workbench
            message.success({ content: t('app.messages.uninstalled'), key: 'uninstall' });
        } catch (e) {
            message.error({ content: t('app.messages.uninstallFailed', { name: toolId }), key: 'uninstall' });
        } finally {
            setUninstalling(prev => ({ ...prev, [toolId]: false }));
            setProcessing(prev => ({ ...prev, [toolId]: false }));
        }
    }




    const handleUpdate = async (toolId: string) => {
        setUpdating(prev => ({ ...prev, [toolId]: true }));
        setProcessing(prev => ({ ...prev, [toolId]: true }));
        try {
            message.loading({ content: t('app.messages.updating', { name: toolId }), key: 'update', duration: 0 });
            await updateTool(toolId);
            await refreshTools([toolId]);
            message.success({ content: t('app.messages.updated', { name: toolId }), key: 'update' });
        } catch (e) {
            message.error({ content: t('app.messages.updateFailed', { name: toolId, error: e }), key: 'update' });
        } finally {
            setUpdating(prev => ({ ...prev, [toolId]: false }));
            setProcessing(prev => ({ ...prev, [toolId]: false }));
        }
    }

    const handleRunInChat = (toolId: string) => {
        // Navigate to terminal and launch the tool
        const commands: Record<string, string> = {
            'google': 'gemini',
            'claude': 'claude',
            'opencode': 'opencode',
            'qoder': 'qodercli',
            'codebuddy': 'codebuddy',
            'copilot': 'copilot',
            'codex': 'codex'
        };
        const cmd = commands[toolId] || toolId;

        useAppStore.getState().setPendingCommand(cmd);
        useAppStore.getState().setActiveToolId(toolId);
        navigate('/terminal');
    };

    // Filter tools to display
    const toolsToDisplay = toolDefs
        .filter(def => activeTools.includes(def.id))
        .map(def => {
            const status = toolStatuses[def.id];
            return {
                ...def,
                status: status?.installed ? 'installed' : 'not_installed', // Should mostly be installed
                version: status?.version || '-'
            };
        });

    const availableToolsToAdd = toolDefs.filter(t => !activeTools.includes(t.id));

    const DashboardSkeleton = () => (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Skeleton.Button active size="large" style={{ width: 200 }} />
                <Space>
                    <Skeleton.Button active size="default" style={{ width: 100 }} />
                    <Skeleton.Button active size="default" style={{ width: 120 }} />
                </Space>
            </div>
            <Row gutter={[24, 24]}>
                {[1, 2, 3, 4].map((i) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={i}>
                        <Card>
                            <Skeleton active avatar paragraph={{ rows: 3 }} />
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );

    if (!isLoaded) {
        return <DashboardSkeleton />;
    }

    return (
        <div style={{ padding: '24px', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <Title level={2} style={{ margin: 0 }}>{t('app.dashboard')}</Title>
                <Space>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={handleRefresh}
                        loading={refreshing}
                    >
                        {t('app.refresh')}
                    </Button>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setIsModalOpen(true)}
                        style={{ borderRadius: '8px', fontWeight: 500 }}
                    >
                        {t('app.addTool')}
                    </Button>
                </Space>
            </div>

            <Row gutter={[24, 24]} style={{ margin: 0 }}>
                {toolsToDisplay.map((tool) => (
                    <Col xs={24} sm={12} md={8} lg={6} key={tool.id}>
                        <Card
                            title={tool.name}
                            extra={tool.icon}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span>Status:</span>
                                <Tag color={tool.status === 'installed' ? 'success' : 'red'}>
                                    {tool.status === 'installed' ? 'Installed' : 'Error'}
                                </Tag>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <span>Version:</span>
                                <span>{tool.id === 'copilot' ? 'Special' : tool.version}</span>
                            </div>

                            {/* Custom Action Footer */}
                            <div style={{ borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 12, margin: '0 -24px -24px -24px', padding: '12px 24px 24px 24px', background: token.colorFillAlter }}>
                                {/* Row 1: Execute | Guide */}
                                <Row gutter={8} style={{ marginBottom: 8 }}>
                                    <Col span={16}>
                                        <Tooltip title={t('app.runInTerminal', { defaultValue: 'Run in Terminal' })}>
                                            <Button
                                                type="primary"
                                                ghost
                                                block
                                                icon={<CodeOutlined />}
                                                disabled={processing[tool.id] || tool.status !== 'installed'}
                                                onClick={() => handleRunInChat(tool.id)}
                                            >
                                                {t('app.runInTerminal', { defaultValue: 'Run' })}
                                            </Button>
                                        </Tooltip>
                                    </Col>
                                    <Col span={8}>
                                        <Button
                                            block
                                            style={{ padding: '4px 0' }}
                                            onClick={() => docLinks[tool.id] && openUrl(docLinks[tool.id])}
                                            disabled={!docLinks[tool.id]}
                                        >
                                            {t('app.docs', 'Docs')}
                                        </Button>
                                    </Col>
                                </Row>

                                {/* Row 2: Update | Uninstall */}
                                <Row gutter={8}>
                                    <Col span={12}>
                                        <Button
                                            block
                                            onClick={() => handleUpdate(tool.id)}
                                            loading={updating[tool.id]}
                                            disabled={processing[tool.id] || tool.status !== 'installed'}
                                        >
                                            {t('app.update')}
                                        </Button>
                                    </Col>
                                    <Col span={12}>
                                        <Button
                                            block
                                            danger
                                            loading={uninstalling[tool.id]}
                                            onClick={() => handleUninstall(tool.id)}
                                            disabled={processing[tool.id]}
                                        >
                                            {t('app.uninstall')}
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                        </Card>
                    </Col>
                ))}
                {toolsToDisplay.length === 0 && (
                    <Col span={24}>
                        <div style={{ padding: '60px 0' }}>
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description={
                                    <span style={{ color: token.colorTextSecondary }}>
                                        {t('app.noActiveTools', 'No active tools. Click "Add Tool" to get started.')}
                                    </span>
                                }
                            >
                                <Button
                                    type="primary"
                                    icon={<PlusOutlined />}
                                    onClick={() => setIsModalOpen(true)}
                                >
                                    {t('app.addTool')}
                                </Button>
                            </Empty>
                        </div>
                    </Col>
                )}
            </Row>

            <Modal
                title={t('app.addToolModal.title', 'Add CLI Tool')}
                open={isModalOpen}
                onCancel={() => !addingTool && setIsModalOpen(false)}
                footer={[
                    <Button key="cancel" disabled={addingTool} onClick={() => setIsModalOpen(false)}>{t('app.addToolModal.cancel', 'Cancel')}</Button>,
                    <Button key="add" type="primary" loading={addingTool} disabled={!selectedToolToAdd} onClick={handleAddTool}>
                        {t('app.addToolModal.confirm', 'Add & Install')}
                    </Button>
                ]}
            >
                <p>{t('app.addToolModal.desc', 'Select a tool to add to your workbench. If it\'s not installed, we will check and install it for you.')}</p>
                <Select
                    style={{ width: '100%' }}
                    placeholder={t('app.addToolModal.placeholder', 'Select a tool')}
                    onChange={setSelectedToolToAdd}
                    value={selectedToolToAdd}
                    options={availableToolsToAdd.map(t => ({ value: t.id, label: t.name }))}
                />
            </Modal>
        </div>
    );
};

export default Dashboard;
