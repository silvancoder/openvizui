import React from 'react';
import { Avatar, theme } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
// @ts-ignore
import Ansi from 'ansi-to-react';
import ReactMarkdown from 'react-markdown';
import stripAnsi from 'strip-ansi';

interface ChatBubbleProps {
    content: string;
    type: 'user' | 'assistant';
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ content, type }) => {
    const { token } = theme.useToken();
    const isUser = type === 'user';

    // For assistant messages, we strip ANSI terminal formatting
    // so we can render actual markdown
    const renderMarkdown = () => {
        try {
            const cleanText = stripAnsi(content);
            return (
                <div className="markdown-body" style={{ color: 'inherit', background: 'transparent' }}>
                    <ReactMarkdown>{cleanText}</ReactMarkdown>
                </div>
            );
        } catch (e) {
            // fallback
            return <Ansi>{content}</Ansi>;
        }
    };

    return (
        <div style={{
            display: 'flex',
            flexDirection: isUser ? 'row-reverse' : 'row',
            marginBottom: 24,
            gap: 16,
            alignItems: 'flex-start',
        }}>
            <Avatar
                size={36}
                icon={isUser ? <UserOutlined /> : <RobotOutlined />}
                style={{
                    backgroundColor: isUser ? token.colorPrimary : token.colorSuccess,
                    flexShrink: 0
                }}
            />
            <div style={{
                maxWidth: '80%',
                padding: '12px 16px',
                borderRadius: isUser ? '16px 4px 16px 16px' : '4px 16px 16px 16px',
                backgroundColor: isUser ? token.colorPrimary : token.colorBgContainer,
                color: isUser ? '#fff' : token.colorText,
                border: isUser ? 'none' : `1px solid ${token.colorBorderSecondary}`,
                boxShadow: token.boxShadowTertiary,
                overflowX: 'auto'
            }}>
                <div style={{
                    whiteSpace: 'pre-wrap',
                    fontFamily: isUser ? 'inherit' : 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: 14,
                    lineHeight: 1.6
                }}>
                    {content ? (
                        isUser ? <Ansi>{content}</Ansi> : renderMarkdown()
                    ) : null}
                </div>
            </div>
            {/* Global style for markdown inside bubbles */}
            {!isUser && (
                <style>{`
                    .markdown-body {
                        font-family: inherit;
                        line-height: 1.6;
                        color: ${token.colorText};
                    }
                    .markdown-body pre {
                        background-color: ${token.colorFillTertiary};
                        border: 1px solid ${token.colorBorderSecondary};
                        border-radius: 6px;
                        padding: 16px;
                        overflow: auto;
                        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
                    }
                    .markdown-body code {
                        background-color: ${token.colorFillTertiary};
                        color: ${token.colorWarningText};
                        border-radius: 6px;
                        padding: 0.2em 0.4em;
                        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
                    }
                    .markdown-body pre code {
                        background-color: transparent;
                        color: inherit;
                        padding: 0;
                    }
                    .markdown-body p {
                        margin-bottom: 16px;
                    }
                    .markdown-body p:last-child {
                        margin-bottom: 0;
                    }
                `}</style>
            )}
        </div>
    );
};

export default ChatBubble;
