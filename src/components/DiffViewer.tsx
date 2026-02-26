import React, { useState, useEffect } from 'react';
import { Modal, Typography, Space, Button, message } from 'antd';
import { Editor } from '@monaco-editor/react';
import { getGitDiff } from '../lib/tauri';
import { useAppStore } from '../store/appStore';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

interface DiffViewerProps {
    open: boolean;
    onClose: () => void;
    filePath?: string;
}

const DiffViewer: React.FC<DiffViewerProps> = ({ open, onClose, filePath }) => {
    const { t } = useTranslation();
    const { theme } = useAppStore();
    const [diffContent, setDiffContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && filePath) {
            loadDiff(filePath);
        } else {
            setDiffContent('');
        }
    }, [open, filePath]);

    const loadDiff = async (path: string) => {
        setLoading(true);
        try {
            const output = await getGitDiff(path);
            setDiffContent(output);
        } catch (err: any) {
            console.error(err);
            setDiffContent(t('diff.loadError', 'Failed to load diff'));
            message.error(t('diff.loadError', 'Failed to load diff'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <Space>
                    <Title level={5} style={{ margin: 0 }}>
                        {t('diff.title', 'File Diff')}
                    </Title>
                    <Text type="secondary">{filePath}</Text>
                </Space>
            }
            open={open}
            onCancel={onClose}
            width={1000}
            footer={[
                <Button key="close" onClick={onClose}>
                    {t('common.close', 'Close')}
                </Button>
            ]}
            centered
            styles={{
                body: { height: '70vh', padding: 0 }
            }}
        >
            <div style={{ height: '100%' }}>
                <Editor
                    height="100%"
                    language="diff"
                    value={loading ? 'Loading...' : diffContent}
                    theme={theme === 'dark' ? 'vs-dark' : 'light'}
                    options={{
                        readOnly: true,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 13
                    }}
                />
            </div>
        </Modal>
    );
};

export default DiffViewer;
