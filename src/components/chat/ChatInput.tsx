import React, { useState } from 'react';
import { Input, Button, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { SendOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSend, disabled }) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
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
            position: 'relative',
            background: token.colorBgContainer,
            borderRadius: 16,
            border: `1px solid ${token.colorBorder}`,
            boxShadow: token.boxShadowTertiary,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 12
        }}>
            <TextArea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.placeholder', 'Type a message or a command for the terminal...')}
                autoSize={{ minRows: 1, maxRows: 6 }}
                disabled={disabled}
                variant="borderless"
                style={{ 
                    flex: 1, 
                    resize: 'none', 
                    padding: '8px 0',
                    boxShadow: 'none'
                }}
            />
            <Button 
                type="primary" 
                shape="circle"
                icon={<SendOutlined />} 
                onClick={handleSend} 
                disabled={disabled || !value.trim()}
                style={{ marginBottom: 4 }}
            />
        </div>
    );
};

export default ChatInput;
