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
            marginBottom: 16,
            gap: 12,
            alignItems: 'flex-start',
            padding: '0 16px'
        }}>
            <Avatar 
                icon={isUser ? <UserOutlined /> : <RobotOutlined />} 
                style={{ 
                    backgroundColor: isUser ? token.colorPrimary : token.colorSuccess,
                    flexShrink: 0 
                }} 
            />
            <div style={{
                maxWidth: '85%',
                padding: '8px 16px',
                borderRadius: 12,
                backgroundColor: isUser ? token.colorPrimaryBg : token.colorBgContainer,
                border: `1px solid ${isUser ? token.colorPrimaryBorder : token.colorBorder}`,
                boxShadow: token.boxShadowTertiary,
                overflowX: 'auto'
            }}>
                <div style={{ 
                    whiteSpace: 'pre-wrap', 
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: 13,
                    lineHeight: 1.5
                }}>
                   {content ? <Ansi>{content}</Ansi> : null} 
                </div>
            </div>
        </div>
    );
};

export default ChatBubble;
