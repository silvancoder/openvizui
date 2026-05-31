/*
 * @Author: OpenVizUI Contributors
 * @FilePath: \src\components\settings\SkillsTab.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { Card, List, Button, Input, Popconfirm, Tag, Empty, Space, Row, Col, Select, Typography } from 'antd';
import {
    AppstoreAddOutlined,
    DeleteOutlined,
    ReloadOutlined,
    CloudDownloadOutlined,
    FolderOpenOutlined,
    GithubOutlined
} from '@ant-design/icons';
import type { McpInfo } from '../../lib/tauri';

const { Text, Paragraph } = Typography;
const { Search } = Input;

interface SkillsTabProps {
    t: any;
    installedMcps: McpInfo[];
    activeDir: string;
    setActiveDir: (dir: string) => void;
    loadSkills: () => void;
    loading: boolean;
    installUrl: string;
    setInstallUrl: (url: string) => void;
    handleInstall: (input: string) => void;
    handleUninstall: (path: string) => void;
    popularSkills: any[];
    tools: any[];
}

const SkillsTab = ({
    t, installedMcps, activeDir, setActiveDir, loadSkills, loading,
    installUrl, setInstallUrl, handleInstall, handleUninstall, popularSkills, tools
}: SkillsTabProps) => (
    <div style={{ padding: '0 24px' }}>
        <Row gutter={[24, 24]}>
            <Col xs={24} lg={14}>
                <Card
                    title={
                        <Space>
                            <AppstoreAddOutlined />
                            <span>{t('aiSettings.installedTitle', 'Installed MCPs')}</span>
                            <Tag color="blue">{installedMcps.length}</Tag>
                        </Space>
                    }
                    extra={
                        <Space>
                            <Select
                                value={activeDir}
                                onChange={(val) => setActiveDir(val)}
                                options={[
                                    { label: '.agents (Default)', value: 'agents' },
                                    ...tools.map(tool => ({ 
                                        label: `.${tool.displayName.toLowerCase()}`, 
                                        value: tool.displayName.toLowerCase() 
                                    }))
                                ]}
                                style={{ width: 160 }}
                            />
                            <Button icon={<ReloadOutlined />} onClick={loadSkills}>{t('aiSettings.refresh', 'Refresh')}</Button>
                        </Space>
                    }
                >
                    <List
                        loading={loading}
                        dataSource={installedMcps}
                        pagination={{ position: 'bottom', align: 'center', pageSize: 10 }}
                        locale={{ emptyText: <Empty description={t('aiSettings.noMcps', 'No MCPs installed yet')} /> }}
                        renderItem={item => (
                            <List.Item
                                actions={[
                                    <Popconfirm
                                        title={t('aiSettings.uninstallConfirmTitle', 'Confirm Uninstall')}
                                        description={t('aiSettings.uninstallConfirmDesc', 'Are you sure you want to remove this Skills?')}
                                        onConfirm={() => handleUninstall(item.path)}
                                        okText={t('common.confirm', 'Yes')}
                                        cancelText={t('common.cancel', 'No')}
                                    >
                                        <Button danger size="small" icon={<DeleteOutlined />}>{t('aiSettings.uninstall', 'Uninstall')}</Button>
                                    </Popconfirm>
                                ]}
                            >
                                <List.Item.Meta
                                    avatar={<FolderOpenOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                    title={<Text strong>{item.name}</Text>}
                                    description={<Text type="secondary" style={{ fontSize: 12 }}>{item.path}</Text>}
                                />
                            </List.Item>
                        )}
                    />
                </Card>
                <Card title={t('aiSettings.quickInstallTitle', 'Quick Install')} style={{ marginTop: 24 }}>
                    <div style={{ marginBottom: 16 }}>
                        <Text strong>{t('aiSettings.installViaUrl', 'Install via Command or URL')}</Text>
                        <Paragraph type="secondary" style={{ fontSize: 12 }}>
                            {t('aiSettings.installHint', 'Enter "npx skills add <url> --skill <name>" or just a GitHub URL.')}
                        </Paragraph>
                        <Search
                            placeholder="npx skills add https://github.com/owner/repo --skill name"
                            enterButton={t('aiSettings.install', 'Install')}
                            value={installUrl}
                            onChange={e => setInstallUrl(e.target.value)}
                            onSearch={handleInstall}
                            loading={loading}
                        />
                    </div>
                </Card>
            </Col>
            <Col xs={24} lg={10}>
                <Card title={<span><CloudDownloadOutlined /> {t('aiSettings.popularTitle', 'Popular MCPs')}</span>}>
                    <List
                        dataSource={popularSkills}
                        renderItem={item => (
                            <List.Item actions={[<Button type="link" icon={<CloudDownloadOutlined />} onClick={() => handleInstall(item.command)} disabled={loading}>{t('aiSettings.install', 'Install')}</Button>]}>
                                <List.Item.Meta
                                    avatar={<GithubOutlined style={{ fontSize: 20 }} />}
                                    title={<a href={item.command.split(' ')[3]?.replace('.git', '') || '#'} target="_blank" rel="noopener noreferrer">{item.name}</a>}
                                    description={item.desc}
                                />
                            </List.Item>
                        )}
                    />
                </Card>
            </Col>
        </Row>
    </div>
);

export default SkillsTab;
