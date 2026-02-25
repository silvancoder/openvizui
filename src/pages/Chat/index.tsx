import React, { useEffect, useRef, useState } from 'react';
import { Layout, theme, Typography, Button, List, Space, Avatar, Modal } from 'antd';
import { listen } from '@tauri-apps/api/event';
import { ptyOpen, ptyWrite, ptyClose } from '../../lib/tauri';
import ChatBubble from '../../components/chat/ChatBubble';
import ChatInput from '../../components/chat/ChatInput';
import { MessageOutlined, PlusOutlined, RobotOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { useAppStore } from '../../store/appStore';
import WorkspaceSider, { TOOL_COMMANDS } from '../../components/WorkspaceSider';
import { useTranslation } from 'react-i18next';

const { Sider, Content, Header } = Layout;
const { Title, Text } = Typography;

interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
}

const ChatPage: React.FC = () => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionId = useRef(`chat-${Date.now()}`).current;
    
    const { activeToolId } = useAppStore();

    // Auto-scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        let unlisten: () => void;
        let isCancelled = false;

        const initPty = async () => {
            await ptyClose(sessionId);
            await ptyOpen(sessionId, 80, 24);

            if (isCancelled) return;

            if (activeToolId) {
                const cmd = TOOL_COMMANDS[activeToolId] || activeToolId;
                setTimeout(async () => {
                    await ptyWrite(sessionId, '\x03'); // Cancel any running process
                    setTimeout(async () => {
                        await ptyWrite(sessionId, `${cmd}\r`);
                    }, 100);
                }, 500); 
            }

            const unlistenFn = await listen<{ id: string, data: number[] }>('pty-data', (event) => {
                if (event.payload.id === sessionId) {
                    let text = new TextDecoder().decode(new Uint8Array(event.payload.data));
                    text = text.replace(/\x1b\]0;.*?(?:\x07|\x1b\\)/g, '');
                    
                    setMessages(prev => {
                        const lastMsg = prev[prev.length - 1];
                        if (lastMsg && lastMsg.type === 'assistant') {
                            return [
                                ...prev.slice(0, -1),
                                { ...lastMsg, content: lastMsg.content + text }
                            ];
                        } else {
                            return [
                                ...prev,
                                { id: Date.now().toString(), type: 'assistant', content: text }
                            ];
                        }
                    });
                }
            });
            unlisten = unlistenFn;
        };

        if (activeToolId) {
             setMessages([]); 
             initPty();
        }

        return () => {
            isCancelled = true;
            if (unlisten) unlisten();
            ptyClose(sessionId);
        };
    }, [activeToolId, sessionId]);

    const handleSend = async (text: string) => {
        const userMsg: Message = { id: Date.now().toString(), type: 'user', content: text };
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), type: 'assistant', content: '' };
        
        setMessages(prev => [...prev, userMsg, assistantMsg]);
        await ptyWrite(sessionId, `${text}\r`);
    };

    return (
        <Layout style={{ height: '100%', background: 'transparent' }} hasSider>
            <Sider 
                width={260} 
                theme="light" 
                style={{ 
                    background: token.colorBgContainer, 
                    borderRight: `1px solid ${token.colorBorderSecondary}`,
                    display: 'flex',
                    flexDirection: 'column'
                }}
            >
                <div style={{ padding: '16px 16px 8px 16px' }}>
                    <Button type="dashed" block icon={<PlusOutlined />} onClick={() => setMessages([])}>
                        {t('chat.newChat', 'New Chat')}
                    </Button>
                </div>
                <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px' }}>
                    <List
                        dataSource={[{ id: '1', title: t('chat.currentSession', 'Current Session') }]}
                        renderItem={item => (
                            <List.Item 
                                style={{ 
                                    padding: '12px 16px', 
                                    borderBottom: 'none', 
                                    cursor: 'pointer', 
                                    background: token.controlItemBgActive,
                                    borderRadius: 8,
                                    marginTop: 8
                                }}
                            >
                                <Space>
                                    <MessageOutlined style={{ color: token.colorPrimary }} />
                                    <Text ellipsis style={{ width: 180, fontWeight: 500 }}>{item.title}</Text>
                                </Space>
                            </List.Item>
                        )}
                    />
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
                        <Title level={5} style={{ margin: 0, fontWeight: 600 }}>{t('chat.title', 'Terminal Chat')}</Title>
                    </Space>
                    <Button
                        type="text"
                        size="small"
                        icon={<QuestionCircleOutlined />}
                        onClick={() => setIsHelpModalOpen(true)}
                        style={{ color: token.colorTextSecondary, fontSize: 12 }}
                    >
                        {t('terminal.aiGenerated', '内容由AI语言模型生成')}
                    </Button>
                </Header>
                <Content style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    background: token.colorBgLayout,
                    position: 'relative'
                }}>
                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 4%' }}>
                        {messages.length === 0 && (
                            <div style={{ textAlign: 'center', color: token.colorTextSecondary, marginTop: 100 }}>
                                <RobotOutlined style={{ fontSize: 48, color: token.colorBorder, marginBottom: 16 }} />
                                <div>{activeToolId === undefined ? t('chat.startTypingEmpty', 'Start typing to interact with the shell...') : t('chat.startTypingTool', { tool: activeToolId, defaultValue: 'Start interacting with {{tool}}...' })}</div>
                            </div>
                        )}
                        {messages.map((msg) => (
                            <ChatBubble key={msg.id} content={msg.content} type={msg.type} />
                        ))}
                        <div ref={messagesEndRef} style={{ height: 1 }} />
                        <div ref={messagesEndRef} style={{ height: 1 }} />
                    </div>
                    <div style={{ padding: '0 4% 24px' }}>
                        <ChatInput onSend={handleSend} disabled={false} />
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                            <Text type="secondary" style={{ fontSize: 12 }}>
                                {t('chat.devNotice', 'Note: This chat feature is currently under development and may not be fully stable.')}
                            </Text>
                        </div>
                    </div>
                </Content>
            </Layout>
            <WorkspaceSider sessionId={sessionId} placement="right" />

            {/* Help Modal */}
            <Modal
                title={t('terminal.helpModalTitle', 'CLI Tools Quick Guide')}
                open={isHelpModalOpen}
                onCancel={() => setIsHelpModalOpen(false)}
                footer={[
                    <Button key="close" type="primary" onClick={() => setIsHelpModalOpen(false)}>
                        {t('common.close', 'Close')}
                    </Button>
                ]}
            >
                <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <div dangerouslySetInnerHTML={{ __html: t('terminal.copilotHelp', '<b>GitHub Copilot</b>: Use <code>copilot [command]</code> or <code>?? [question]</code> to ask anything.').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code style="background-color:rgba(0,0,0,0.06);padding:2px 4px;border-radius:4px;">$1</code>') }} />
                    </div>
                    <div>
                        <div dangerouslySetInnerHTML={{ __html: t('terminal.geminiHelp', '<b>Google Gemini</b>: Use <code>gemini [prompt]</code> to chat with Gemini. Use <code>gemini models</code> to list models.').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code style="background-color:rgba(0,0,0,0.06);padding:2px 4px;border-radius:4px;">$1</code>') }} />
                    </div>
                    <div>
                        <div dangerouslySetInnerHTML={{ __html: t('terminal.claudeHelp', '<b>Anthropic Claude</b>: Use <code>claude [prompt]</code> to chat.').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/`([^`]+)`/g, '<code style="background-color:rgba(0,0,0,0.06);padding:2px 4px;border-radius:4px;">$1</code>') }} />
                    </div>
                    <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #f0f0f0', color: token.colorTextSecondary, fontSize: '13px' }}>
                        <div dangerouslySetInnerHTML={{ __html: t('terminal.generalHelp', 'Press <kbd>Shift + Tab</kbd> to switch focus between the input area and the chat history. Press <kbd>Ctrl + S</kbd> to save.').replace(/`([^`]+)`/g, '<kbd style="background-color:#fafafa;border:1px solid #d9d9d9;border-radius:3px;box-shadow:0 1px 0 rgba(0,0,0,0.2);color:#262626;display:inline-block;font-size:11px;line-height:1.4;margin:0 2px;padding:1px 5px;">$1</kbd>') }} />
                    </div>
                </div>
            </Modal>
        </Layout>
    );
};


export default ChatPage;
