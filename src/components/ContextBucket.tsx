/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\ContextBucket.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState } from 'react';
import { Typography, Button, Space, List, Tooltip, message, theme } from 'antd';
import { 
    DeleteOutlined, 
    FileTextOutlined, 
    ClearOutlined,
    ContainerOutlined,
    FileMarkdownOutlined,
    FileZipOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { useTranslation } from 'react-i18next';
import { readTextFile } from '@tauri-apps/plugin-fs';

const { Text } = Typography;

const ContextBucket: React.FC = () => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const { contextFiles, removeContextFile, clearContextFiles } = useAppStore();
    const [generating, setGenerating] = useState(false);

    if (contextFiles.length === 0) {
        return (
            <div style={{ marginTop: 12, padding: '12px', border: `1px dashed ${token.colorBorder}`, borderRadius: 8, textAlign: 'center' }}>
                <Text type="secondary" style={{ fontSize: 12 }}>{t('terminal.contextBuilder.empty')}</Text>
            </div>
        );
    }

    const formatContext = async (format: 'xml' | 'markdown') => {
        setGenerating(true);
        try {
            let result = '';
            if (format === 'xml') result += '<context>\n';
            
            for (const path of contextFiles) {
                const fileName = path.split(/[/\\]/).pop();
                try {
                    const content = await readTextFile(path);
                    if (format === 'xml') {
                        result += `  <file path="${path}">\n${content}\n  </file>\n`;
                    } else {
                        result += `### File: ${fileName}\nPath: \`${path}\` \n\n\`\`\`\n${content}\n\`\`\`\n\n`;
                    }
                } catch (e) {
                    message.error(`Failed to read ${fileName}`);
                }
            }
            
            if (format === 'xml') result += '</context>';
            
            await navigator.clipboard.writeText(result);
            message.success(t('terminal.contextBuilder.copied'));
        } catch (error) {
            console.error('Context generation failed:', error);
            message.error('Generation failed');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div style={{ 
            marginTop: 12, 
            display: 'flex', 
            flexDirection: 'column', 
            gap: 8,
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            paddingTop: 12
        }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text strong><ContainerOutlined /> {t('terminal.contextBuilder.title')} ({contextFiles.length})</Text>
                <Tooltip title={t('terminal.contextBuilder.clear')}>
                    <Button 
                        size="small" 
                        type="text" 
                        danger 
                        icon={<ClearOutlined />} 
                        onClick={clearContextFiles} 
                    />
                </Tooltip>
            </div>

            <div style={{ maxHeight: 150, overflowY: 'auto' }}>
                <List
                    size="small"
                    dataSource={contextFiles}
                    renderItem={(path) => (
                        <List.Item 
                            style={{ padding: '4px 0' }}
                            actions={[
                                <Button 
                                    size="small" 
                                    type="text" 
                                    icon={<DeleteOutlined />} 
                                    onClick={() => removeContextFile(path)} 
                                />
                            ]}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden' }}>
                                <FileTextOutlined style={{ color: token.colorPrimary }} />
                                <Text style={{ fontSize: 12 }} ellipsis title={path}>
                                    {path.split(/[/\\]/).pop()}
                                </Text>
                            </div>
                        </List.Item>
                    )}
                />
            </div>

            <Space direction="vertical" style={{ width: '100%' }}>
                <Button 
                    block 
                    size="small" 
                    icon={<FileZipOutlined />} 
                    onClick={() => formatContext('xml')}
                    loading={generating}
                >
                    {t('terminal.contextBuilder.copyXml')}
                </Button>
                <Button 
                    block 
                    size="small" 
                    icon={<FileMarkdownOutlined />} 
                    onClick={() => formatContext('markdown')}
                    loading={generating}
                >
                    {t('terminal.contextBuilder.copyMd')}
                </Button>
            </Space>
        </div>
    );
};

export default ContextBucket;
