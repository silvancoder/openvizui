import React, { useState } from 'react';
import { Input, Button, theme } from 'antd';
import { SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
    const { token } = theme.useToken();
    const [value, setValue] = useState('');

    const handleSend = () => {
        if (value.trim()) {
            onSend(value);
            setValue('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div style={{ 
            display: 'flex', 
            gap: 12, 
            padding: '16px 24px', 
            borderTop: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer 
        }}>
            <TextArea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a command to execute in the terminal..."
                autoSize={{ minRows: 1, maxRows: 6 }}
                disabled={disabled}
                style={{ flex: 1, resize: 'none' }}
            />
            <Button 
                type="primary" 
                icon={<SendOutlined />} 
                onClick={handleSend} 
                disabled={disabled || !value.trim()}
                style={{ height: 'auto' }}
            />
        </div>
    );
};

export default ChatInput;
