import { useState, useEffect } from 'react';
import Terminal from '../components/Terminal';
import { Layout, Select, Space, Button, Tree, Typography, theme, message, Dropdown, Modal, Input } from 'antd';
import { 
  FolderOutlined, 
  CodeOutlined, 
  SendOutlined,
  MoreOutlined
} from '@ant-design/icons';
import { useAppStore } from '../store/appStore';
import { useTranslation } from 'react-i18next';
import { readDir, remove, readTextFile, writeTextFile } from '@tauri-apps/plugin-fs';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import type { DataNode } from 'antd/es/tree';
import { fetchRemoteModels } from '../lib/tauri';

const { Sider } = Layout;
const { Text } = Typography;

const TOOL_COMMANDS: Record<string, string> = {
  iflow: 'iflow',
  google: 'gemini',
  claude: 'claude',
  openclaw: 'openclaw',
  opencode: 'opencode',
  codebuddy: 'codebuddy',
  copilot: 'copilot',
  codex: 'codex',
  kilocode: 'kilocode',
  grok: 'grok',
};

const TerminalPage = () => {
  const { token } = theme.useToken();
  useTranslation();
  const { 
    activeToolId, 
    setActiveToolId,
    activeTools,
    activeApiId,
    setActiveApiId, 
    apiConfigs,
    updateApiConfig,
    currentDirectory,
    setCurrentDirectory,
    setPendingCommand 
  } = useAppStore();

  const [treeData, setTreeData] = useState<DataNode[]>([]);
  const [, setLoadingTree] = useState(false);
  const [isFetchingModels, setIsFetchingModels] = useState(false);

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

  const handleNodeSelect = (selectedKeys: React.Key[], info: any) => {
      if (selectedKeys.length > 0) {
          const path = selectedKeys[0] as string;
          if (!info.node.isLeaf) {
              // It's a directory, cd into it
              setPendingCommand(`cd "${path}"`);
          } else {
              // It's a file, maybe open/cat it? Or just insert path? 
              // For now, let's insert path into terminal
               setPendingCommand(path);
          }
      }
  };


  // --- Model / API Logic ---
  const handleFetchModels = async () => {
       const config = apiConfigs.find(c => c.id === activeApiId);
       if (!config) {
           message.error("Please select a configuration first");
           return;
       }
       setIsFetchingModels(true);
       try {
           const models = await fetchRemoteModels(config.base_url!, config.api_key!);
           updateApiConfig({ ...config, models });
           message.success(`Found ${models.length} models`);
       } catch (e) {
           console.error(e);
           message.error("Failed to fetch models");
       } finally {
           setIsFetchingModels(false);
       }
  };

  const handleToolChange = (val: string) => {
      setActiveToolId(val);
      const cmd = TOOL_COMMANDS[val] || val;
      // Execute tool command in terminal
      setPendingCommand(cmd);
  };

  /* File Operation Handlers */
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState('');
  const { chatInput, setChatInput } = useAppStore();
  
  const handleAddChat = (path: string) => {
      // Normalize path separators to backslashes for Windows consistency
      // Ideally we check OS, but we can infer or simpler: just fix mixed Use regex to replace forward slashes with backslashes
      const normalizedPath = path.replace(/\//g, '\\');
      
      const pathToInsert = normalizedPath.includes(' ') ? `"${normalizedPath}"` : normalizedPath;
      const newValue = chatInput ? `${chatInput} ${pathToInsert}` : pathToInsert;
      setChatInput(newValue);
      message.success("Added to chat");
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

  const handleModelSelect = (val: string) => {
    const config = apiConfigs.find(c => c.id === activeApiId);
    if (config) updateApiConfig({ ...config, model: val });
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Layout style={{ height: '100%', background: 'transparent' }}>
        <Sider 
            width={280} 
            style={{ 
                background: token.colorBgContainer, 
                borderRadius: '8px', 
                border: `1px solid ${token.colorBorderSecondary}`,
                marginRight: 16,
                padding: 12,
                display: 'flex',
                flexDirection: 'column'
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: 16 }}>
                {/* CLI Tool Selection */}
                <div>
                     <Text type="secondary" style={{ fontSize: 12 }}>CLI Tool</Text>
                     <Space.Compact style={{ width: '100%' }}>
                        <Select
                            placeholder="Select Tool"
                            style={{ width: '100%' }}
                            options={activeTools.map(t => ({ value: t, label: t }))}
                            value={activeToolId}
                            onChange={handleToolChange}
                        />
                        <Button icon={<SendOutlined />} onClick={() => handleToolChange(activeToolId!)} disabled={!activeToolId} />
                     </Space.Compact>
                </div>

                {/* API / Model Selection */}
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>API Provider</Text>
                    </div>
                    <Select
                        style={{ width: '100%', marginBottom: 8 }}
                        options={apiConfigs.map(c => ({ value: c.id, label: c.name }))}
                        value={activeApiId}
                        onChange={setActiveApiId}
                        placeholder="Select Provider"
                    />
                    
                    {activeApiId && (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Model</Text>
                                <Button 
                                    type="text" 
                                    size="small" 
                                    icon={<MoreOutlined />} 
                                    loading={isFetchingModels}
                                    onClick={handleFetchModels}
                                    title="Fetch Models"
                                />
                            </div>
                            <Select
                                style={{ width: '100%' }}
                                showSearch
                                options={apiConfigs.find(c => c.id === activeApiId)?.models?.map(m => ({ value: m, label: m })) || []}
                                value={apiConfigs.find(c => c.id === activeApiId)?.model}
                                onChange={handleModelSelect}
                                placeholder="Select Model"
                            />
                        </>
                    )}
                </div>

                {/* File Tree */}
                <div style={{ flex: 1, overflow: 'auto', borderTop: `1px solid ${token.colorBorderSecondary}`, paddingTop: 12, minHeight: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                         <Text strong><FolderOutlined /> Project Files</Text>
                         <Button size="small" type="text" onClick={handleSelectDirectory}>Change</Button>
                    </div>
                    <Tree
                        showIcon
                        loadData={onLoadData}
                        treeData={treeData}
                        onSelect={handleNodeSelect}
                        titleRender={(node: any) => (
                            <Dropdown 
                                menu={{ 
                                    items: [
                                        {
                                            key: 'chat',
                                            label: 'Add to Chat',
                                            onClick: (e) => {
                                                e.domEvent.stopPropagation();
                                                handleAddChat(node.key as string);
                                            }
                                        },
                                        {
                                            key: 'open',
                                            label: 'Open',
                                            disabled: !node.isLeaf,
                                            onClick: (e) => {
                                                e.domEvent.stopPropagation();
                                                handleOpenEditor(node.key as string);
                                            }
                                        },
                                        { type: 'divider' },
                                        // {
                                        //     key: 'rename',
                                        //     label: 'Rename',
                                        //     onClick: (e) => {
                                        //          e.domEvent.stopPropagation();
                                        //          setRenamingNode({ key: node.key as string, name: node.title as string });
                                        //     }
                                        // },
                                        {
                                            key: 'delete',
                                            label: 'Delete',
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
                                <span style={{ userSelect: 'none' }}>{node.title}</span>
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
        title={`Editing: ${editingFile?.split('/').pop()}`}
        open={!!editingFile}
        onCancel={() => setEditingFile(null)}
        width={800}
        onOk={handleSaveFile}
        maskClosable={false}
      >
          <Input.TextArea 
             value={fileContent} 
             onChange={e => setFileContent(e.target.value)} 
             autoSize={{ minRows: 15, maxRows: 25 }}
             style={{ fontFamily: 'monospace' }}
          />
      </Modal>
    </div>
  );
};

export default TerminalPage;
