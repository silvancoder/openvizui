import React from 'react';
import { Avatar, theme } from 'antd';
import { UserOutlined, RobotOutlined } from '@ant-design/icons';
// @ts-ignore
import Ansi from 'ansi-to-react';

interface ChatBubbleProps {
    content: string;
    type: 'user' | 'assistant';
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ content, type }) => {
    const { token } = theme.useToken();
    const isUser = type === 'user';
    
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
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: 14,
                    lineHeight: 1.6
                }}>
                   {content ? <Ansi>{content}</Ansi> : null} 
                </div>
            </div>
        </div>
    );
};

export default ChatBubble;
