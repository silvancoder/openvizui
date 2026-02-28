/*
 * @Author: OpenVizUI Contributors
 * @FilePath: \src\components\settings\McpConfigTab.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { Card, List, Button, Input, Tag, Empty, Space, Row, Col, Select, Typography, Modal } from 'antd';
import { SettingOutlined, ReloadOutlined, CodeOutlined, EditOutlined, DeleteOutlined, GithubOutlined, GlobalOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface McpConfigTabProps {
    t: any;
    installedMcpList: any[];
    activeTool: string;
    setActiveTool: (tool: string) => void;
    tools: any[];
    loadConfig: () => void;
    quickAdds: Record<string, any>;
    isInstalled: (key: string) => boolean;
    handleQuickAdd: (key: string) => void;
    handleMcpUninstall: (key: string) => void;
    handleMcpEdit: (key: string) => void;
    editModalVisible: boolean;
    setEditModalVisible: (visible: boolean) => void;
    editingMcp: { key: string, content: string } | null;
    modalConfigContent: string;
    setModalConfigContent: (content: string) => void;
    handleMcpSaveFromModal: () => void;
}

const McpConfigTab = ({
    t, installedMcpList, activeTool, setActiveTool, tools, loadConfig,
    quickAdds, isInstalled, handleQuickAdd, handleMcpUninstall, handleMcpEdit,
    editModalVisible, setEditModalVisible, editingMcp, modalConfigContent,
    setModalConfigContent, handleMcpSaveFromModal
}: McpConfigTabProps) => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Row gutter={[24, 24]} style={{ flex: 1, minHeight: 0 }}>
            <Col xs={24} md={12} style={{ height: '100%' }}>
                <Card
                    title={
                        <Space>
                            <SettingOutlined />
                            <span>{t('aiSettings.mcpConfig.configured', 'Configured MCPs')}</span>
                            <Tag color="cyan">{installedMcpList.length}</Tag>
                        </Space>
                    }
                    extra={
                        <Space>
                            <span>{t('aiSettings.mcpConfig.tool', 'CLI Tool')}:</span>
                            <Select
                                value={activeTool}
                                onChange={(val: string) => setActiveTool(val)}
                                options={tools.map(tool => ({ label: tool.displayName, value: tool.displayName }))}
                                style={{ width: 120 }}
                                variant="filled"
                            />
                            <Button icon={<ReloadOutlined />} onClick={loadConfig} size="small" />
                        </Space>
                    }
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                    styles={{ body: { flex: 1, overflow: 'auto' } }}
                >
                    <List
                        dataSource={installedMcpList}
                        pagination={{ pageSize: 10, size: 'small' }}
                        locale={{ emptyText: <Empty description="No MCPs found in Configuration" /> }}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<CodeOutlined style={{ fontSize: 24, color: '#13c2c2' }} />}
                                    title={<Text strong>{item.key}</Text>}
                                    description={
                                        <div>
                                            {item.desc !== 'Custom Configuration' && <Tag color="green" style={{ marginBottom: 4 }}>Template</Tag>}
                                            <div style={{ fontSize: 12, color: '#888' }}>
                                                {item.desc}
                                            </div>
                                        </div>
                                    }
                                />
                                <Space>
                                    <Button
                                        size="small"
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => handleMcpEdit(item.key)}
                                    />
                                    <Button
                                        size="small"
                                        danger
                                        type="text"
                                        icon={<DeleteOutlined />}
                                        onClick={() => handleMcpUninstall(item.key)}
                                    />
                                </Space>
                            </List.Item>
                        )}
                    />
                </Card>
            </Col>
            <Col xs={24} md={12} style={{ height: '100%' }}>
                <Card title={t('aiSettings.mcpConfig.quickAdd', 'Quick Add MCP')} style={{ height: '100%', display: 'flex', flexDirection: 'column' }} styles={{ body: { flex: 1, overflow: 'auto' } }}>
                    <List
                        dataSource={Object.keys(quickAdds)}
                        pagination={{ pageSize: 10, size: 'small' }}
                        renderItem={key => {
                            const installed = isInstalled(key);
                            return (
                                <List.Item>
                                    <List.Item.Meta
                                        title={
                                            <Space>
                                                {key}
                                                {installed && <Tag color="green">{t('app.installed', 'Installed')}</Tag>}
                                            </Space>
                                        }
                                        description={t(quickAdds[key].desc)}
                                    />
                                    <Button
                                        size="small"
                                        type={installed ? 'default' : 'primary'}
                                        ghost={!installed}
                                        disabled={installed}
                                        onClick={() => handleQuickAdd(key)}
                                    >
                                        {installed ? t('app.installed', 'Installed') : t('common.add', 'Add')}
                                    </Button>
                                </List.Item>
                            );
                        }}
                    />
                </Card>
            </Col>
        </Row>
        <div style={{ marginTop: 16 }}>
            <Space wrap>
                <Button href="https://github.com/punkpeye/awesome-mcp-servers" target="_blank" icon={<GithubOutlined />}>{t('aiSettings.mcpConfig.links.awesome', 'Awesome MCP')}</Button>
                <Button href="https://github.com/modelcontextprotocol/" target="_blank" icon={<GithubOutlined />}>{t('aiSettings.mcpConfig.links.official', 'Official MCP')}</Button>
                <Button href="https://cursor.directory/" target="_blank" icon={<GlobalOutlined />}>{t('aiSettings.mcpConfig.links.cursor', 'Cursor Directory')}</Button>
                <Button href="https://mcp.so/zh" target="_blank" icon={<GlobalOutlined />}>{t('aiSettings.mcpConfig.links.chinese', 'MCP Chinese')}</Button>
            </Space>
        </div>

        <Modal
            title={(editingMcp ? `${t('aiSettings.mcpConfig.editTitle', 'Edit MCP Server')}: ${editingMcp.key}` : t('aiSettings.mcpConfig.editTitle', 'Edit MCP Server'))}
            open={editModalVisible}
            onOk={handleMcpSaveFromModal}
            onCancel={() => setEditModalVisible(false)}
            width={700}
            destroyOnClose
            okText={t('common.save', 'Save')}
            cancelText={t('common.cancel', 'Cancel')}
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary">{t('aiSettings.mcpConfig.editDesc', 'Update the configuration for this MCP server below.')}</Text>
            </div>
            <Input.TextArea
                value={modalConfigContent}
                onChange={(e) => setModalConfigContent(e.target.value)}
                autoSize={{ minRows: 10, maxRows: 20 }}
                style={{ fontFamily: 'monospace', fontSize: '13px' }}
                spellCheck={false}
            />
        </Modal>
    </div>
);

export default McpConfigTab;
