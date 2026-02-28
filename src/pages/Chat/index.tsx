import React, { useEffect, useRef, useState } from 'react';
import { Layout, theme, Typography, Button, List, Space, Avatar, Popconfirm, Select, Switch, Divider } from 'antd';

import ChatBubble from '../../components/chat/ChatBubble';
import ChatInput from '../../components/chat/ChatInput';
import ChatHelpModal from '../../components/chat/ChatHelpModal';
import ChatSettingsModal from '../../components/chat/ChatSettingsModal';
import { MessageOutlined, PlusOutlined, RobotOutlined, QuestionCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';
import { useChatStore } from '../../store/chatStore';
import WorkspaceSider from '../../components/WorkspaceSider';
import { useTranslation } from 'react-i18next';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

const getDisplayTitle = (title: string | undefined, t: any) => {
    if (!title || title === 'New Chat' || title === '新对话') {
        return t('chat.newChatTitle', 'New Chat');
    }
    return title;
};

const ChatPage: React.FC = () => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [isStreaming, setIsStreaming] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [attachedFiles, setAttachedFiles] = useState<string[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const {
        activeChatToolId,
        toolConfigs,
        setToolConfig,
        addChatProvider,
        setActiveChatToolId,
        chatSidebarWidth,
        setChatSidebarWidth
    } = useAppStore();

    const [isResizing, setIsResizing] = useState(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            // Limit width between 200px and 600px
            const newWidth = Math.max(200, Math.min(600, e.clientX));
            setChatSidebarWidth(newWidth);
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
    }, [isResizing, setChatSidebarWidth]);

    const {
        sessions,
        messages,
        activeSessionId,
        createSession,
        setActiveSession,
        deleteSession,
        addMessage
    } = useChatStore();

    const activeSession = sessions.find(s => s.id === activeSessionId);
    const currentMessages = activeSessionId ? (messages[activeSessionId] || []) : [];

    const { updateSessionConfig } = useChatStore();
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [currentMessages.length, currentMessages[currentMessages.length - 1]?.content.length]);

    const { loadSessions, isLoaded: sessionsLoaded } = useChatStore();

    useEffect(() => {
        if (!sessionsLoaded) {
            loadSessions();
        }
    }, [sessionsLoaded, loadSessions]);

    useEffect(() => {
        if (!sessionsLoaded) return;
        if (!activeSessionId && activeChatToolId) {
            // Automatically start a new chat if there are no sessions
            const newId = createSession(activeChatToolId, t('chat.newChatTitle', 'New Chat'));
            setActiveSession(newId);
        } else if (activeSessionId && activeChatToolId) {
            const session = sessions.find(s => s.id === activeSessionId);
            if (!session) {
                const newId = createSession(activeChatToolId, t('chat.newChatTitle', 'New Chat'));
                setActiveSession(newId);
            }
        }
    }, [activeChatToolId, activeSessionId, sessions.length, sessionsLoaded]);

    const handleSend = async (text: string) => {
        if (!activeSessionId || isStreaming) return;

        let combinedText = text;
        if (attachedFiles.length > 0) {
            combinedText = `${attachedFiles.map(f => `[Attached File Context: ${f}]`).join('\n')}\n${text}`.trim();
        }

        addMessage(activeSessionId, { type: 'user', content: combinedText, id: Date.now().toString() });
        setAttachedFiles([]); // Clear after sending

        const activeToolConfig = activeChatToolId ? toolConfigs[activeChatToolId] : undefined;
        const llmApiKey = activeToolConfig?.llmApiKey || '';
        const llmModel = activeToolConfig?.llmModel || 'gpt-4o-mini';
        const localAiBaseUrl = activeToolConfig?.llmBaseUrl || '';

        if (!llmApiKey && !localAiBaseUrl) {
            useChatStore.getState().updateLastMessage(activeSessionId, t('chat.noApiKeyWarning', '⚠️ Please set your LLM API Key and Base URL by clicking the Settings icon in the top right.'));
            return;
        }

        setIsStreaming(true);
        // Force the assistant message box to appear
        const sessionMessages = useChatStore.getState().messages[activeSessionId] || [];

        try {
            const apiBaseUrl = localAiBaseUrl || "https://api.openai.com/v1";

            // Build messages array
            const openAiMessages = [...sessionMessages, { type: 'user', content: combinedText }].map(msg => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.content
            }));

            const response = await fetch(`${apiBaseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${llmApiKey}`
                },
                body: JSON.stringify({
                    model: llmModel || 'gpt-4o-mini',
                    messages: openAiMessages,
                    stream: true
                })
            });

            if (!response.ok) {
                const err = await response.text();
                useChatStore.getState().updateLastMessage(activeSessionId, t('chat.apiError', '\n\n**Error:** API request failed. \n\n```json\n{{error}}\n```', { error: err }));
                setIsStreaming(false);
                return;
            }

            const reader = response.body?.getReader();
            const decoder = new TextDecoder("utf-8");

            if (reader) {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split('\n');
                    for (const line of lines) {
                        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
                            try {
                                const parsed = JSON.parse(line.slice(6));
                                const delta = parsed.choices?.[0]?.delta?.content || "";
                                useChatStore.getState().updateLastMessage(activeSessionId, delta);
                            } catch (e) {
                                // ignore parse errors on fragmented stream
                            }
                        }
                    }
                }
            }
        } catch (error: any) {
            console.error("LLM Stream Error", error);
            useChatStore.getState().updateLastMessage(activeSessionId, t('chat.networkError', '\n\n**Network Error:** {{error}}', { error: error?.message || String(error) }));
        } finally {
            setIsStreaming(false);
        }
    };

    const handleNewChat = () => {
        if (activeChatToolId) {
            const newId = createSession(activeChatToolId, t('chat.newChatTitle', 'New Chat'));
            setActiveSession(newId);
        }
    };

    return (
        <Layout style={{ height: '100%', background: 'transparent' }} hasSider>
            <Sider
                width={chatSidebarWidth}
                theme="light"
                style={{
                    background: token.colorBgContainer,
                    borderRight: `1px solid ${token.colorBorderSecondary}`,
                    position: 'relative'
                }}
            >
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    {/* Resize Handle */}
                    <div
                        style={{
                            position: 'absolute',
                            right: -5,
                            top: 0,
                            bottom: 0,
                            width: 10,
                            cursor: 'col-resize',
                            zIndex: 100,
                        }}
                        onMouseDown={(e) => {
                            e.preventDefault();
                            setIsResizing(true);
                        }}
                    />
                    <div style={{ padding: '16px 16px 8px 16px' }}>
                        <Button type="dashed" block icon={<PlusOutlined />} onClick={handleNewChat}>
                            {t('chat.newChat', 'New Chat')}
                        </Button>
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px' }}>
                        <List
                            dataSource={sessions}
                            renderItem={item => {
                                const isActive = item.id === activeSessionId;
                                return (
                                    <List.Item
                                        style={{
                                            padding: '12px 16px',
                                            borderBottom: 'none',
                                            cursor: 'pointer',
                                            background: isActive ? token.controlItemBgActive : 'transparent',
                                            borderRadius: 8,
                                            marginTop: 8
                                        }}
                                        onClick={() => setActiveSession(item.id)}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                                            <Space style={{ flex: 1, overflow: 'hidden' }}>
                                                <MessageOutlined style={{ color: isActive ? token.colorPrimary : token.colorTextSecondary }} />
                                                <Text ellipsis style={{ width: 140, fontWeight: isActive ? 600 : 400 }}>
                                                    {getDisplayTitle(item.title, t)}
                                                </Text>
                                            </Space>

                                            <Popconfirm
                                                title={t('chat.deleteConfirm', 'Are you sure you want to delete this session?')}
                                                onConfirm={(e) => {
                                                    e?.stopPropagation();
                                                    deleteSession(item.id);
                                                }}
                                                onCancel={(e) => e?.stopPropagation()}
                                                okText={t('common.yes', 'Yes')}
                                                cancelText={t('common.no', 'No')}
                                            >
                                                <Button
                                                    type="text"
                                                    size="small"
                                                    icon={<DeleteOutlined />}
                                                    onClick={(e) => e.stopPropagation()}
                                                    style={{ color: token.colorError, opacity: isActive ? 1 : 0.4 }}
                                                />
                                            </Popconfirm>
                                        </div>
                                    </List.Item>
                                );
                            }}
                        />
                    </div>

                    {/* Session Configuration Area (Bottom of Sider) */}
                    {(activeSession || activeChatToolId) && (
                        <div style={{
                            padding: '16px',
                            borderTop: `1px solid ${token.colorBorderSecondary}`,
                            background: token.colorBgContainer,
                            marginTop: 'auto'
                        }}>
                            <div style={{ marginBottom: 12 }}>
                                <Text strong style={{ fontSize: 13, color: token.colorTextSecondary, display: 'block', marginBottom: 8 }}>
                                    {t('chat.configTitle', 'Session Configuration')}
                                </Text>
                                <Space direction="vertical" style={{ width: '100%' }} size={12}>
                                    <div>
                                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginBottom: 4 }}>{t('chat.chatType', 'Chat Type')}</Text>
                                        <Select
                                            size="small"
                                            style={{ width: '100%' }}
                                            value={activeSession?.config?.chatType || 'normal'}
                                            onChange={(val) => activeSession && updateSessionConfig(activeSession.id, { chatType: val })}
                                            options={[
                                                { value: 'normal', label: t('chat.typeNormal', 'Normal') },
                                                { value: 'code', label: t('chat.typeCode', 'Code') },
                                                { value: 'deep', label: t('chat.typeDeep', 'Deep Thinking') },
                                            ]}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{t('chat.mcp', 'MCP')}</Text>
                                        <Switch
                                            size="small"
                                            checked={activeSession?.config?.mcpEnabled ?? true}
                                            onChange={(val) => activeSession && updateSessionConfig(activeSession.id, { mcpEnabled: val })}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text type="secondary" style={{ fontSize: 11 }}>{t('chat.skills', 'Skills')}</Text>
                                        <Switch
                                            size="small"
                                            checked={activeSession?.config?.skillsEnabled ?? true}
                                            onChange={(val) => activeSession && updateSessionConfig(activeSession.id, { skillsEnabled: val })}
                                        />
                                    </div>
                                </Space>
                            </div>
                        </div>
                    )}
                </div>
            </Sider>
            <Layout style={{ background: 'transparent' }}>
                <Header style={{
                    background: token.colorBgContainer,
                    padding: '0 24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: `1px solid ${token.colorBorderSecondary}`,
                    height: 60,
                    lineHeight: '60px'
                }}>
                    <Space>
                        <Avatar icon={<RobotOutlined />} style={{ backgroundColor: token.colorPrimary, color: '#fff' }} />
                        <Title level={5} style={{ margin: 0, fontWeight: 600 }}>
                            {getDisplayTitle(sessions.find(s => s.id === activeSessionId)?.title, t) || t('chat.title', 'Terminal Chat')}
                        </Title>
                    </Space>
                    <Space>
                        <Button
                            type="text"
                            size="small"
                            icon={<QuestionCircleOutlined />}
                            onClick={() => setIsHelpModalOpen(true)}
                            style={{ color: token.colorTextSecondary, fontSize: 12 }}
                        >
                            {t('terminal.aiGenerated', 'Content generated by AI')}
                        </Button>
                    </Space>
                </Header>
                <Content style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: token.colorBgLayout,
                    position: 'relative'
                }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px' }}>
                        {currentMessages.length === 0 && (
                            <div style={{ textAlign: 'center', color: token.colorTextSecondary, marginTop: 100 }}>
                                <RobotOutlined style={{ fontSize: 48, color: token.colorBorder, marginBottom: 16 }} />
                                <div>{activeChatToolId === undefined ? t('chat.startTypingEmpty', 'Start typing to interact with the shell...') : t('chat.startTypingTool', { tool: activeChatToolId, defaultValue: 'Start interacting with {{tool}}...' })}</div>
                            </div>
                        )}
                        {currentMessages.map((msg) => (
                            <ChatBubble key={msg.id} content={msg.content} type={msg.type} />
                        ))}
                        <div ref={messagesEndRef} style={{ height: 1 }} />
                    </div>
                    <div style={{ padding: '0 24px 12px' }}>
                        <ChatInput
                            onSend={handleSend}
                            disabled={isStreaming}
                            value={inputValue}
                            onChange={setInputValue}
                            attachedFiles={attachedFiles}
                            onRemoveFile={(idx: number) => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                        />
                        <div style={{ textAlign: 'center', marginTop: 8 }}>
                            <Space split={(activeSession || activeChatToolId) ? <Divider type="vertical" /> : null} style={{ fontSize: 12 }}>
                                {(activeSession || activeChatToolId) && (
                                    <Space size={16}>
                                        <Text type="secondary">
                                            {t('chat.chatType', 'Chat Type')}: <span style={{ color: token.colorPrimary }}>{t(`chat.type${(activeSession?.config?.chatType || 'normal') === 'deep' ? 'Deep' : ((activeSession?.config?.chatType || 'normal') === 'code' ? 'Code' : 'Normal')}`)}</span>
                                        </Text>
                                        <Text type="secondary">
                                            {t('chat.mcp', 'MCP')}: <span style={{ color: (activeSession?.config?.mcpEnabled ?? true) !== false ? token.colorSuccess : token.colorTextQuaternary }}>{(activeSession?.config?.mcpEnabled ?? true) !== false ? t('common.on', 'ON') : t('common.off', 'OFF')}</span>
                                        </Text>
                                        <Text type="secondary">
                                            {t('chat.skills', 'Skills')}: <span style={{ color: (activeSession?.config?.skillsEnabled ?? true) !== false ? token.colorSuccess : token.colorTextQuaternary }}>{(activeSession?.config?.skillsEnabled ?? true) !== false ? t('common.on', 'ON') : t('common.off', 'OFF')}</span>
                                        </Text>
                                    </Space>
                                )}
                            </Space>
                        </div>
                    </div>
                </Content>
            </Layout>
            <WorkspaceSider
                sessionId={activeSessionId || 'default'}
                placement="right"
                onInsertPath={(path) => {
                    if (!attachedFiles.includes(path)) {
                        setAttachedFiles(prev => [...prev, path]);
                    }
                }}
                onOpenSettings={() => setIsSettingsModalOpen(true)}
            />

            <ChatHelpModal
                open={isHelpModalOpen}
                onCancel={() => setIsHelpModalOpen(false)}
            />

            <ChatSettingsModal
                open={isSettingsModalOpen}
                onCancel={() => setIsSettingsModalOpen(false)}
                activeChatToolId={activeChatToolId || undefined}
                toolConfigs={toolConfigs}
                addChatProvider={addChatProvider}
                setToolConfig={setToolConfig}
                setActiveChatToolId={setActiveChatToolId}
            />

            {/* Resize Overlay */}
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
        </Layout>
    );
};

export default ChatPage;
