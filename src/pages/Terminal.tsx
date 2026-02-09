/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\pages\Terminal.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { useState, useEffect } from 'react';
import Terminal from '../components/Terminal';
import { Layout, Select, Space, Button, Tree, Typography, theme, message, Dropdown, Modal } from 'antd';
import {
    FolderOutlined,
    CodeOutlined,
    SendOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { useTranslation } from 'react-i18next';
import { readDir, remove, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import type { DataNode } from 'antd/es/tree';
import { ptyWrite } from '../lib/tauri';

const { Sider } = Layout;
const { Text } = Typography;

import Editor from '@monaco-editor/react';

const TOOL_COMMANDS: Record<string, string> = {
    qoder: 'qodercli',
    google: 'gemini',
    claude: 'claude',
    opencode: 'opencode',
    codebuddy: 'codebuddy',
    copilot: 'copilot',
    codex: 'codex',
};

// Helper to determine language for Monaco Editor
const getLanguageFromFilename = (filename: string) => {
    if (!filename) return 'plaintext';
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
        case 'js': return 'javascript';
        case 'jsx': return 'javascript';
        case 'ts': return 'typescript';
        case 'tsx': return 'typescript';
        case 'json': return 'json';
        case 'html': return 'html';
        case 'css': return 'css';
        case 'rs': return 'rust';
        case 'py': return 'python';
        case 'md': return 'markdown';
        case 'yml':
        case 'yaml': return 'yaml';
        case 'xml': return 'xml';
        case 'sql': return 'sql';
        case 'sh': return 'shell';
        case 'gitignore': return 'shell';
        case 'env': return 'shell';
        default: return 'plaintext';
    }
};

const TerminalPage = () => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const {
        activeToolId,
        setActiveToolId,
        activeTools,
        currentDirectory,
        setCurrentDirectory,
        setPendingCommand
    } = useAppStore();

    const [treeData, setTreeData] = useState<DataNode[]>([]);
    const [, setLoadingTree] = useState(false);


    // --- File Tree Logic ---
    const updateTreeData = (list: DataNode[], key: React.Key, children: DataNode[]): DataNode[] =>
        list.map((node) => {
            if (node.key === key) {
                return { ...node, children };
            }
            if (node.children) {
                return { ...node, children: updateTreeData(node.children, key, children) };
            }
            return node;
        });

    const loadTree = async (dir: string): Promise<DataNode[]> => {
        try {
            const entries = await readDir(dir);
            return entries
                .sort((a, b) => {
                    if (a.isDirectory && !b.isDirectory) return -1;
                    if (!a.isDirectory && b.isDirectory) return 1;
                    return a.name.localeCompare(b.name);
                })
                .map((entry) => ({
                    title: entry.name,
                    key: `${dir}/${entry.name}`,
                    isLeaf: !entry.isDirectory,
                    icon: entry.isDirectory ? <FolderOutlined /> : <CodeOutlined />,
                }));
        } catch (e) {
            console.error("Failed to read directory", e);
            return [];
        }
    };

    useEffect(() => {
        if (currentDirectory) {
            setLoadingTree(true);
            loadTree(currentDirectory).then(data => {
                setTreeData(data);
                setLoadingTree(false);
            });
        }
    }, [currentDirectory]);

    const onLoadData = ({ key, children }: any) =>
        new Promise<void>(async (resolve) => {
            if (children) {
                resolve();
                return;
            }
            const newNodes = await loadTree(key as string);
            setTreeData((origin) => updateTreeData(origin, key, newNodes));
            resolve();
        });

    const handleSelectDirectory = async () => {
        try {
            const selected = await openDialog({
                directory: true,
                multiple: false,
            });
            if (selected && typeof selected === 'string') setCurrentDirectory(selected);
        } catch (e) {
            console.error(e);
        }
    };

    const handleNodeSelect = (_selectedKeys: React.Key[], _info: any) => {
        // Just select, do not insert into terminal
        // if (selectedKeys.length > 0) { ... }
    };

    const handleNodeDoubleClick = (_e: any, node: any) => {
        if (node.isLeaf) {
            handleOpenEditor(node.key as string);
        }
    };


    // --- Model / API Logic ---


    const handleToolChange = (val: string) => {
        setActiveToolId(val);
        const cmd = TOOL_COMMANDS[val] || val;
        // Execute tool command in terminal
        setPendingCommand(cmd);
    };

    /* File Operation Handlers */
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState('');
    const handleAddChat = (path: string) => {
        // Normalize path separators to backslashes for Windows consistency
        const normalizedPath = path.replace(/\//g, '\\');

        const pathToInsert = normalizedPath.includes(' ') ? `"${normalizedPath}"` : normalizedPath;
        // Write directly to PTY instead of state
        ptyWrite(pathToInsert);
        message.success("Inserted path to terminal");
    };

    const handleDeleteFile = (path: string) => {
        Modal.confirm({
            title: 'Delete File',
            content: `Are you sure you want to delete ${path.split('/').pop()}?`,
            onOk: async () => {
                try {
                    await remove(path, { recursive: true });
                    message.success("Deleted");
                    // Refresh tree? Ideally finding parent and refreshing. 
                    // For MVP, if we are in current dir, reload. Or trigger reload of parent.
                    // Since we don't have parent tracking easily, we might just reload root or specific dir.
                    // Just reloading root for simplicity or currentDirectory.
                    if (currentDirectory) loadTree(currentDirectory).then(setTreeData);
                } catch (e) {
                    console.error(e);
                    message.error(`Failed to delete: ${e}`);
                }
            }
        });
    };

    const handleOpenEditor = async (path: string) => {
        try {
            // Check file size?
            const content = await readTextFile(path);
            setFileContent(content);
            setEditingFile(path);
        } catch (e) {
            message.error("Failed to read file (maybe binary?)");
        }
    };

    const handleSaveFile = async () => {
        if (!editingFile) return;
        try {
            await writeTextFile(editingFile, fileContent);
            message.success("Saved");
            setEditingFile(null);
        } catch (e) {
            message.error(`Failed to save: ${e}`);
        }
    };



    /* Resizable Sidebar Logic */
    const [sidebarWidth, setSidebarWidth] = useState(280);
    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            // Limit width between 200px and 600px
            const newWidth = Math.max(200, Math.min(600, e.clientX));
            setSidebarWidth(newWidth);
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing]);

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Layout style={{ height: '100%', background: 'transparent' }}>
                <Sider
                    width={sidebarWidth}
                    style={{
                        background: token.colorBgContainer,
                        borderRadius: '8px',
                        border: `1px solid ${token.colorBorderSecondary}`,
                        marginRight: 16,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative' // For absolute positioning of handle
                    }}
                >
                    {/* Resize Handle */}
                    <div
                        style={{
                            position: 'absolute',
                            right: -8, // Move logic outside (marginRight is 16, so -8 is in the gap)
                            top: 0,
                            bottom: 0,
                            width: 10,
                            cursor: 'col-resize',
                            zIndex: 20,
                            // Debug: background: 'red',
                        }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizing(true);
                        }}
                    />

                    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
                        {/* CLI Tool Selection */}
                        <div>
                            <Text type="secondary" style={{ fontSize: 12 }}>CLI Tool</Text>
                            <Space.Compact style={{ width: '100%' }}>
                                <Select
                                    placeholder={t('terminal.selectTool')}
                                    style={{ width: '100%' }}
                                    options={activeTools.map(t => ({ value: t, label: t }))}
                                    value={activeToolId}
                                    onChange={handleToolChange}
                                />
                                <Button icon={<SendOutlined />} onClick={() => handleToolChange(activeToolId!)} disabled={!activeToolId} />
                            </Space.Compact>
                        </div>



                        {/* File Tree */}
                        <div style={{ flex: 1, overflow: 'auto', borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 12, minHeight: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <Text strong><FolderOutlined /> {t('terminal.fileTree.title')}</Text>
                                <Button size="small" type="text" onClick={handleSelectDirectory}>{t('terminal.fileTree.change')}</Button>
                            </div>
                            <Tree
                                showIcon
                                loadData={onLoadData}
                                treeData={treeData}
                                blockNode
                                onSelect={handleNodeSelect}
                                onDoubleClick={handleNodeDoubleClick}
                                titleRender={(node: any) => (
                                    <Dropdown
                                        menu={{
                                            items: [
                                                {
                                                    key: 'chat',
                                                    label: t('terminal.fileTree.context.addToChat'),
                                                    onClick: (e) => {
                                                        e.domEvent.stopPropagation();
                                                        handleAddChat(node.key as string);
                                                    }
                                                },
                                                {
                                                    key: 'modify',
                                                    label: t('terminal.fileTree.context.modify'),
                                                    disabled: !node.isLeaf,
                                                    onClick: (e) => {
                                                        e.domEvent.stopPropagation();
                                                        handleOpenEditor(node.key as string);
                                                    }
                                                },
                                                {
                                                    key: 'delete',
                                                    label: t('terminal.fileTree.context.delete'),
                                                    danger: true,
                                                    onClick: (e) => {
                                                        e.domEvent.stopPropagation();
                                                        handleDeleteFile(node.key as string);
                                                    }
                                                }
                                            ]
                                        }}
                                        trigger={['contextMenu']}
                                    >
                                        <span style={{
                                            userSelect: 'none',
                                            whiteSpace: 'nowrap',
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: 'inline-block',
                                            maxWidth: '100%',
                                            verticalAlign: 'middle'
                                        }}>{node.title}</span>
                                    </Dropdown>
                                )}
                                style={{ background: 'transparent' }}
                            />
                        </div>
                    </div>
                </Sider>

                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Terminal />
                </div>
            </Layout>



            {/* File Editor Modal */}
            <Modal
                title={`${t('terminal.fileTree.modal.editing')}: ${editingFile?.split('/').pop()}`}
                open={!!editingFile}
                onCancel={() => setEditingFile(null)}
                width={1000}
                onOk={handleSaveFile}
                okText={t('terminal.fileTree.modal.save')}
                cancelText={t('common.cancel')}
                maskClosable={false}
                styles={{ body: { padding: 0 } }}
            >
                <div style={{ border: `1px solid ${token.colorBorderSecondary}`, borderRadius: 8, overflow: 'hidden' }}>
                    <Editor
                        height="60vh"
                        language={getLanguageFromFilename(editingFile || '')}
                        value={fileContent}
                        theme="vs-dark"
                        onChange={(value) => setFileContent(value || '')}
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                        }}
                    />
                </div>
            </Modal>
            {/* Resize Overlay - prevents terminal from swallowing events */}
            {isResizing && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        cursor: 'col-resize',
                        userSelect: 'none'
                    }}
                />
            )}
        </div>
    );
};

export default TerminalPage;
