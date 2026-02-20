import React, { useEffect, useRef, useState } from 'react';
import { Layout, theme, Typography, Select } from 'antd';
import { listen } from '@tauri-apps/api/event';
import { ptyOpen, ptyWrite, ptyClose } from '../../lib/tauri';
import ChatBubble from '../../components/chat/ChatBubble';
import ChatInput from '../../components/chat/ChatInput';

const { Content } = Layout;
const { Title } = Typography;

interface Message {
    id: string;
    type: 'user' | 'assistant';
    content: string;
}

const ChatPage: React.FC = () => {
    const { token } = theme.useToken();
    const [messages, setMessages] = useState<Message[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const sessionId = useRef(`chat-${Date.now()}`).current;

    const [selectedTool, setSelectedTool] = useState('default');
    
    const tools = [
        { value: 'default', label: 'Default Shell' },
        { value: 'claude', label: 'Claude CLI' },
        { value: 'opencode', label: 'OpenCode CLI' },
        { value: 'qoder', label: 'Qoder CLI' },
        { value: 'codebuddy', label: 'CodeBuddy CLI' },
        { value: 'gemini', label: 'Gemini CLI' },
        { value: 'codex', label: 'Codex CLI' },
        { value: 'gh', label: 'GitHub CLI' },
    ];

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
            // Close existing session if any (clean up handled by unmount usually, but good for switching)
            // Actually, we should probably close before opening a new one if switching tools
            await ptyClose(sessionId);

            // Initialize PTY
            await ptyOpen(sessionId, 80, 24);

            if (isCancelled) return;

             // If a specific tool is selected, run it
            if (selectedTool !== 'default') {
                setTimeout(async () => {
                    await ptyWrite(sessionId, `${selectedTool}\r`);
                }, 500); // Small delay to ensure PTY is ready
            }

            // Listen for data
            const unlistenFn = await listen<{ id: string, data: number[] }>('pty-data', (event) => {
                if (event.payload.id === sessionId) {
                    let text = new TextDecoder().decode(new Uint8Array(event.payload.data));
                    
                    // Filter out OSC 0 (Window Title) sequences: \x1b]0;...\x07
                    text = text.replace(/\x1b\]0;.*?(?:\x07|\x1b\\)/g, '');
                    
                    setMessages(prev => {
                        const lastMsg = prev[prev.length - 1];
                        if (lastMsg && lastMsg.type === 'assistant') {
                            // Append to last assistant message
                            return [
                                ...prev.slice(0, -1),
                                { ...lastMsg, content: lastMsg.content + text }
                            ];
                        } else {
                            // Create new assistant message
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

        if (selectedTool) {
             setMessages([]); // Clear messages on tool switch
             initPty();
        }

        return () => {
            isCancelled = true;
            if (unlisten) unlisten();
            ptyClose(sessionId);
        };
    }, [selectedTool, sessionId]);

    const handleSend = async (text: string) => {
        // 1. Add User Message
        const userMsg: Message = { id: Date.now().toString(), type: 'user', content: text };
        
        // 2. Add Empty Assistant Message (placeholder for response)
        const assistantMsg: Message = { id: (Date.now() + 1).toString(), type: 'assistant', content: '' };
        
        setMessages(prev => [...prev, userMsg, assistantMsg]);
        
        // 3. Send to PTY
        await ptyWrite(sessionId, `${text}\r`);
    };

    return (
        <Layout style={{ height: '100%', background: 'transparent' }}>
             <div style={{ padding: '16px 24px', borderBottom: `1px solid ${token.colorBorderSecondary}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Title level={4} style={{ margin: 0 }}>Terminal Chat (PoC)</Title>
                <div style={{ width: 200 }}>
                    <Select
                        options={tools}
                        value={selectedTool}
                        onChange={setSelectedTool}
                        style={{ width: '100%' }}
                    />
                </div>
            </div>
            <Content style={{ overflowY: 'auto', padding: '24px 0' }}>
                {messages.length === 0 && (
                     <div style={{ textAlign: 'center', color: token.colorTextSecondary, marginTop: 40 }}>
                        {selectedTool === 'default' ? 'Start typing to interact with the shell...' : `Start interact with ${tools.find(t => t.value === selectedTool)?.label}...`}
                    </div>
                )}
                {messages.map((msg) => (
                    <ChatBubble key={msg.id} content={msg.content} type={msg.type} />
                ))}
                <div ref={messagesEndRef} />
            </Content>
            <ChatInput onSend={handleSend} />
        </Layout>
    );
};

export default ChatPage;
