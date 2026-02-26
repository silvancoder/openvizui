/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\SkillMonitor.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tooltip, Modal, Empty, Tabs, message } from 'antd';
import {
    BookOutlined,
    ReloadOutlined,
    FolderOpenOutlined,
    ReadOutlined,
    SafetyOutlined,
    DeleteOutlined
} from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import { readTextFile } from '@tauri-apps/plugin-fs';

const { Text } = Typography;

interface SkillInfo {
    path: string;
    name: string;
    description?: string;
    version?: string;
    author?: string;
}

const SkillMonitor: React.FC = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('agents');
    const [skills, setSkills] = useState<SkillInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [viewContent, setViewContent] = useState<{ name: string; content: string } | null>(null);

    const CLI_TOOLS = [
        { name: '.agents (Default)', key: 'agents' },
        { name: 'Claude', key: 'claude' },
        { name: 'Gemini', key: 'gemini' },
        { name: 'OpenCode', key: 'opencode' },
        { name: 'Qoder', key: 'qoder' },
        { name: 'CodeBuddy', key: 'codebuddy' },
        { name: 'Copilot', key: 'copilot' },
        { name: 'Codex', key: 'codex' }
    ];

    const loadSkills = async (target: string) => {
        setLoading(true);
        try {
            const list = await invoke<{ path: string; name: string }[]>('list_installed_skills', { target });
            const skillsWithMeta: SkillInfo[] = [];

            for (const item of list) {
                let description = '';
                let metaFound = false;
                const metaFiles = ['SKILL.md', 'AGENTS.md', 'README.md'];

                for (const fileName of metaFiles) {
                    try {
                        const filePath = `${item.path}/${fileName}`;
                        const content = await readTextFile(filePath);
                        const lines = content.split('\n');
                        const descLine = lines.find(l => l.trim() && !l.startsWith('#'));
                        description = descLine ? descLine.trim() : 'No summary found';
                        metaFound = true;
                        break;
                    } catch (e) {
                        // Continue to next file
                    }
                }

                if (!metaFound) {
                    try {
                        const packageJsonPath = `${item.path}/package.json`;
                        const pkgContent = await readTextFile(packageJsonPath);
                        const pkg = JSON.parse(pkgContent);
                        description = pkg.description || 'No description in package.json';
                    } catch (e) {
                        description = 'No metadata file found (SKILL.md, AGENTS.md, README.md)';
                    }
                }

                skillsWithMeta.push({
                    ...item,
                    description
                });
            }
            setSkills(skillsWithMeta);
        } catch (error) {
            console.error('Failed to load skills:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSkills(activeTab);
    }, [activeTab]);

    const handleViewSkill = async (skill: SkillInfo) => {
        const metaFiles = ['SKILL.md', 'AGENTS.md', 'README.md', 'package.json'];
        let content = '';
        let fileName = '';

        for (const f of metaFiles) {
            try {
                const filePath = `${skill.path}/${f}`;
                content = await readTextFile(filePath);
                fileName = f;
                break;
            } catch (e) {
                // Continue
            }
        }

        if (content) {
            setViewContent({ name: `${skill.name} (${fileName})`, content });
        } else {
            Modal.error({
                title: t('common.error', 'Error'),
                content: t('aiSettings.skillMonitor.errors.noMetadata', 'No metadata file found to display')
            });
        }
    };

    const handleDeleteSkill = (skill: SkillInfo) => {
        Modal.confirm({
            title: t('aiSettings.skillMonitor.actions.confirmDelete', 'Delete Skill?'),
            content: `${t('aiSettings.skillMonitor.actions.deleteDesc', 'Are you sure you want to remove')} ${skill.name}?`,
            onOk: async () => {
                try {
                    await invoke('uninstall_skills', { path: skill.path });
                    message.success(t('aiSettings.skillMonitor.status.deleted', 'Skill successfully deleted'));
                    loadSkills(activeTab);
                } catch (error) {
                    message.error(`${t('aiSettings.skillMonitor.status.deleteFailed', 'Failed to delete skill')}: ${error}`);
                }
            }
        });
    };

    const columns = [
        {
            title: t('aiSettings.skillMonitor.table.name', 'Skill Name'),
            key: 'name',
            dataIndex: 'name',
            render: (name: string) => (
                <Space>
                    <BookOutlined style={{ color: '#fa8c16' }} />
                    <Text strong>{name}</Text>
                </Space>
            )
        },
        {
            title: t('aiSettings.skillMonitor.table.description', 'Description'),
            key: 'description',
            dataIndex: 'description',
            ellipsis: true,
            render: (desc: string) => <Text type="secondary" style={{ fontSize: 12 }}>{desc}</Text>
        },
        {
            title: t('aiSettings.skillMonitor.table.actions', 'Actions'),
            key: 'actions',
            render: (_: any, record: SkillInfo) => (
                <Space>
                    <Button
                        size="small"
                        icon={<ReadOutlined />}
                        onClick={() => handleViewSkill(record)}
                    >
                        {t('aiSettings.skillMonitor.actions.view', 'View')}
                    </Button>
                    <Tooltip title={record.path}>
                        <Button
                            size="small"
                            icon={<FolderOpenOutlined />}
                            onClick={() => invoke('open_folder', { path: record.path })}
                        >
                            {t('aiSettings.skillMonitor.actions.folder', 'Folder')}
                        </Button>
                    </Tooltip>
                    <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteSkill(record)}
                    />
                </Space>
            )
        }
    ];

    return (
        <Card
            title={
                <Space>
                    <SafetyOutlined />
                    <span>{t('aiSettings.skillMonitor.title', 'Skill Monitor')}</span>
                </Space>
            }
            extra={
                <Button icon={<ReloadOutlined />} onClick={() => loadSkills(activeTab)} loading={loading} />
            }
        >
            <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={CLI_TOOLS.map(tool => ({
                    key: tool.key,
                    label: tool.name,
                    children: (
                        <Table
                            loading={loading}
                            dataSource={skills}
                            columns={columns}
                            rowKey="path"
                            pagination={false}
                            locale={{ emptyText: <Empty description={t('aiSettings.skillMonitor.noSkills', 'No skills found in this directory')} /> }}
                        />
                    )
                }))}
            />

            <Modal
                title={`Skill Details: ${viewContent?.name}`}
                open={!!viewContent}
                onCancel={() => setViewContent(null)}
                width={800}
                footer={[<Button key="close" onClick={() => setViewContent(null)}>Close</Button>]}
            >
                <div style={{ maxHeight: 600, overflowY: 'auto', background: '#f9f9f9', padding: 16, borderRadius: 8 }}>
                    <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13 }}>{viewContent?.content}</pre>
                </div>
            </Modal>
        </Card>
    );
};

export default SkillMonitor;
