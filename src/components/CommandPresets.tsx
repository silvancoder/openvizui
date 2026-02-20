/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\CommandPresets.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState } from 'react';
import { Button, List, Input, Modal, Form, Typography, Tooltip } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, PlayCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { ptyWrite } from '../lib/tauri';
import { useTranslation } from 'react-i18next';

const { Text } = Typography;

interface CommandPreset {
    id: string;
    name: string;
    command: string;
}

interface CommandPresetsProps {
    sessionId?: string;
}

const CommandPresets: React.FC<CommandPresetsProps> = ({ sessionId }) => {
    const { t } = useTranslation();
    const { commandPresets, addCommandPreset, removeCommandPreset, updateCommandPreset } = useAppStore();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form] = Form.useForm();

    const handleRun = (command: string) => {
        if (sessionId) {
            ptyWrite(sessionId, command + '\r');
        } else {
            console.warn("No active session to run command");
        }
    };

    const handleAdd = () => {
        setEditingId(null);
        form.resetFields();
        setIsModalOpen(true);
    };

    const handleEdit = (preset: CommandPreset) => {
        setEditingId(preset.id);
        form.setFieldsValue(preset);
        setIsModalOpen(true);
    };

    const handleDelete = (id: string) => {
        Modal.confirm({
            title: t('common.confirmDelete', 'Confirm Delete'),
            content: t('aiSettings.skillMonitor.actions.deleteDesc', 'Are you sure you want to remove this preset?'),
            onOk: () => removeCommandPreset(id)
        });
    };

    const handleOk = () => {
        form.validateFields().then(values => {
            if (editingId) {
                updateCommandPreset(editingId, values);
            } else {
                addCommandPreset({ id: crypto.randomUUID(), ...values });
            }
            setIsModalOpen(false);
            form.resetFields();
        });
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', borderTop: '1px solid #303030', paddingTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text strong><ThunderboltOutlined /> {t('commandPresets.title', 'Shortcuts')}</Text>
                <Button size="small" type="text" icon={<PlusOutlined />} onClick={handleAdd} />
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
                <List
                    size="small"
                    dataSource={commandPresets}
                    locale={{ emptyText: <Text type="secondary" style={{ fontSize: 12 }}>{t('commandPresets.empty', 'No presets')}</Text> }}
                    renderItem={item => (
                        <List.Item
                            actions={[
                                <Tooltip title={t('commandPresets.run', 'Run')}>
                                    <Button type="text" size="small" icon={<PlayCircleOutlined />} onClick={() => handleRun(item.command)} />
                                </Tooltip>,
                                <Button type="text" size="small" icon={<EditOutlined />} onClick={() => handleEdit(item)} />,
                                <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(item.id)} />
                            ]}
                            style={{ padding: '4px 0' }}
                        >
                            <List.Item.Meta
                                title={
                                    <Tooltip title={item.command}>
                                        <Text style={{ cursor: 'pointer', fontSize: 13 }} onClick={() => handleRun(item.command)}>{item.name}</Text>
                                    </Tooltip>
                                }
                            />
                        </List.Item>
                    )}
                />
            </div>

            <Modal
                title={editingId ? t('commandPresets.edit', 'Edit Preset') : t('commandPresets.add', 'Add Preset')}
                open={isModalOpen}
                onOk={handleOk}
                onCancel={() => setIsModalOpen(false)}
                destroyOnClose
                okText={t('common.save', 'Save')}
                cancelText={t('common.cancel', 'Cancel')}
            >
                <Form form={form} layout="vertical">
                    <Form.Item name="name" label={t('commandPresets.name', 'Name')} rules={[{ required: true, message: 'Please input name' }]}>
                        <Input placeholder={t('commandPresets.placeholderName', 'e.g., Explain Code')} />
                    </Form.Item>
                    <Form.Item name="command" label={t('commandPresets.command', 'Command')} rules={[{ required: true, message: 'Please input command' }]}>
                        <Input.TextArea placeholder={t('commandPresets.placeholderCommand', 'e.g., /explain')} rows={3} />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default CommandPresets;
