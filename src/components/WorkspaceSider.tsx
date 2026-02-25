import React, { useState, useEffect } from 'react';
import { Layout, Select, Space, Button, Tree, Typography, theme, message, Dropdown, Modal, Tabs } from 'antd';
import {
    FolderOutlined,
    CodeOutlined,
    SendOutlined,
    SearchOutlined
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import { useAppStore } from '../store/appStore';
import { useTranslation } from 'react-i18next';
import { readDir, remove, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import type { DataNode } from 'antd/es/tree';
import { ptyWrite } from '../lib/tauri';
import { invoke } from '@tauri-apps/api/core';
import ModelSwitcher from './ModelSwitcher';
import ContextBucket from './ContextBucket';
import CommandPresets from './CommandPresets';
import GlobalSearch from './GlobalSearch';
import DiffViewer from './DiffViewer';

const { Sider } = Layout;
const { Text } = Typography;

export const TOOL_COMMANDS: Record<string, string> = {
    qoder: 'qodercli',
    google: 'gemini',
    claude: 'claude',
    opencode: 'opencode',
    codebuddy: 'codebuddy',
    copilot: 'copilot',
    codex: 'codex',
};

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

interface WorkspaceSiderProps {
    sessionId: string;
    placement?: 'left' | 'right';
}

const WorkspaceSider: React.FC<WorkspaceSiderProps> = ({ sessionId, placement = 'left' }) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const {
        activeToolId,
        setActiveToolId,
        activeTools,
        currentDirectory,
        setCurrentDirectory,
        contextFiles,
        toggleContextFile,
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
        if (sessionId) {
            // Send Ctrl+C to terminate any running process first
            ptyWrite(sessionId, '\x03');
            setTimeout(() => {
                ptyWrite(sessionId, `${cmd}\r`);
            }, 100);
        }
    };

    /* File Operation Handlers */
    const [editingFile, setEditingFile] = useState<string | null>(null);
    const [diffFile, setDiffFile] = useState<string | null>(null);
    const [fileContent, setFileContent] = useState('');
    const handleAddChat = (path: string) => {
        // Normalize path separators to backslashes for Windows consistency
        const normalizedPath = path.replace(/\//g, '\\');

        const pathToInsert = normalizedPath.includes(' ') ? `"${normalizedPath}"` : normalizedPath;
        // Write directly to PTY instead of state
        if (sessionId) {
             ptyWrite(sessionId, pathToInsert);
        }
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
            const content = await readTextFile(path);
            setFileContent(content);
            setEditingFile(path);
        } catch (e) {
            message.error("Failed to read file (maybe binary?)");
        }
    };

    const handleOpenInIde = async (path: string) => {
        const { idePath } = useAppStore.getState();
        if (!idePath) {
            message.warning(t('settings.idePathDesc'));
            return;
        }

        const normalizedPath = path.replace(/\//g, '\\');

        try {
            await invoke('launch_tool_with_args', {
                toolId: 'open_in_ide',
                args: [idePath, normalizedPath]
            });
            message.success(t('terminal.fileTree.context.openInIde'));
        } catch (e) {
            message.error(`Failed to launch IDE: ${e}`);
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
            if (placement === 'left') {
                const newWidth = Math.max(200, Math.min(600, e.clientX));
                setSidebarWidth(newWidth);
            } else {
                const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX));
                setSidebarWidth(newWidth);
            }
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
    }, [isResizing, placement]);

    return (
        <>
            <Sider
                width={sidebarWidth}
                style={{
                    background: token.colorBgContainer,
                    borderRadius: '8px',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    [placement === 'left' ? 'marginRight' : 'marginLeft']: 16,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative', // For absolute positioning of handle
                    height: '100%'
                }}
            >
                {/* Resize Handle */}
                <div
                    style={{
                        position: 'absolute',
                        [placement === 'left' ? 'right' : 'left']: -8,
                        top: 0,
                        bottom: 0,
                        width: 10,
                        cursor: 'col-resize',
                        zIndex: 20,
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                    }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
                    {/* CLI Tool Selection */}
                    <div>
                        <Text type="secondary" style={{ fontSize: 12 }}>{t('terminal.cliTool')}</Text>
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

                    {/* Model Switcher */}
                    {activeToolId && (
                        <div>
                            <ModelSwitcher toolId={activeToolId} />
                        </div>
                    )}

                    <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <Tabs
                            defaultActiveKey="files"
                            size="small"
                            tabBarStyle={{ marginBottom: 4 }}
                            items={[
                                {
                                    key: 'files',
                                    label: <Space><FolderOutlined />{t('terminal.tabs.files', 'Files')}</Space>,
                                    children: (
                                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                            <div style={{ flex: 1, overflow: 'auto', borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 12, minHeight: 0 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, padding: '0 4px' }}>
                                                    <Text strong>{t('terminal.fileTree.title')}</Text>
                                                    <Button size="small" type="text" onClick={handleSelectDirectory}>{t('terminal.fileTree.change')}</Button>
                                                </div>
                                                <Tree
                                                    checkable
                                                    checkStrictly
                                                    onCheck={(_checked: any, info: any) => {
                                                        if (info.node.isLeaf) {
                                                            toggleContextFile(info.node.key as string);
                                                        }
                                                    }}
                                                    checkedKeys={contextFiles}
                                                    onSelect={(_keys, info) => {
                                                        if (info.node.isLeaf) {
                                                            toggleContextFile(info.node.key as string);
                                                        }
                                                    }}
                                                    showIcon
                                                    loadData={onLoadData}
                                                    treeData={treeData}
                                                    blockNode
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
                                                                        key: 'diff',
                                                                        label: t('terminal.fileTree.context.diff', 'Diff'),
                                                                        disabled: !node.isLeaf,
                                                                        onClick: (e) => {
                                                                            e.domEvent.stopPropagation();
                                                                            setDiffFile(node.key as string);
                                                                        }
                                                                    },
                                                                    {
                                                                        key: 'openInIde',
                                                                        label: t('terminal.fileTree.context.openInIde'),
                                                                        disabled: !node.isLeaf,
                                                                        onClick: (e) => {
                                                                            e.domEvent.stopPropagation();
                                                                            handleOpenInIde(node.key as string);
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
                                                            <span onDoubleClick={(e) => handleNodeDoubleClick(e, node)} style={{
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
                                            <ContextBucket />
                                        </div>
                                    )
                                },
                                {
                                    key: 'search',
                                    label: <Space><div style={{ transform: 'rotate(90deg)' }}><SearchOutlined /></div>{t('terminal.tabs.search', 'Search')}</Space>,
                                    children: (
                                        <GlobalSearch onOpenFile={handleOpenEditor} />
                                    )
                                },
                                {
                                    key: 'shortcuts',
                                    label: <Space><CodeOutlined />{t('terminal.tabs.shortcuts', 'Shortcuts')}</Space>,
                                    children: (
                                        <div style={{ height: '100%', overflow: 'hidden' }}>
                                            <CommandPresets sessionId={sessionId} />
                                        </div>
                                    )
                                }
                            ]}
                            style={{ flex: 1, overflow: 'hidden', height: '100%' }}
                        />
                    </div>
                </div>
            </Sider>

            <DiffViewer
                open={!!diffFile}
                onClose={() => setDiffFile(null)}
                filePath={diffFile || undefined}
            />

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
        </>
    );
};

export default WorkspaceSider;
