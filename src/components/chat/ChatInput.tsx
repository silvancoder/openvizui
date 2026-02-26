import React, { useState } from 'react';
import { Input, Button, theme } from 'antd';
import { useTranslation } from 'react-i18next';
import { SendOutlined, FileOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
    value?: string;
    onChange?: (val: string) => void;
    attachedFiles?: string[];
    onRemoveFile?: (index: number) => void;
}

const ChatInput: React.FC<ChatInputProps> = ({ 
    onSend, 
    disabled, 
    value: propValue, 
    onChange,
    attachedFiles = [],
    onRemoveFile
}) => {
    const { token } = theme.useToken();
    const { t } = useTranslation();
    const [localValue, setLocalValue] = useState('');
    
    const value = propValue !== undefined ? propValue : localValue;
    const setValue = onChange || setLocalValue;

    const handleSend = () => {
        // Allow sending if there's text OR if there are attached files
        if (value.trim() || attachedFiles.length > 0) {
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
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8
        }}>
            {attachedFiles.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '4px 0' }}>
                    {attachedFiles.map((file, index) => {
                        const fileName = file.replace(/\\/g, '/').split('/').pop() || file;
                        return (
                            <div
                                key={`${file}-${index}`}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    background: token.colorFillAlter,
                                    border: `1px solid ${token.colorBorder}`,
                                    borderRadius: 6,
                                    padding: '2px 8px',
                                    fontSize: 12,
                                }}
                            >
                                <FileOutlined style={{ color: token.colorPrimary }} />
                                <span style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {fileName}
                                </span>
                                {onRemoveFile && (
                                    <span 
                                        style={{ cursor: 'pointer', color: token.colorTextDescription, marginLeft: 4 }}
                                        onClick={() => onRemoveFile(index)}
                                    >
                                        ✕
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
            
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, width: '100%' }}>
                <TextArea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t('chat.placeholder', 'Type a message or a command for the terminal...')}
                autoSize={{ minRows: 2, maxRows: 6 }}
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
                disabled={disabled || (!value.trim() && attachedFiles.length === 0)}
                style={{ marginBottom: 4 }}
            />
            </div>
        </div>
    );
};

export default ChatInput;
