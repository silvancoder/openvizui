import React from 'react';
import { Modal, Button, theme } from 'antd';
import { useTranslation } from 'react-i18next';

interface ChatHelpModalProps {
    open: boolean;
    onCancel: () => void;
}

const ChatHelpModal: React.FC<ChatHelpModalProps> = ({ open, onCancel }) => {
    const { t } = useTranslation();
    const { token } = theme.useToken();

    return (
        <Modal
            title={t('terminal.helpModalTitle', 'CLI Tools Quick Guide')}
            open={open}
            onCancel={onCancel}
            footer={[
                <Button key="close" type="primary" onClick={onCancel}>
                    {t('common.close', 'Close')}
                </Button>
            ]}
        >
            <div style={{ padding: '8px 0', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <div dangerouslySetInnerHTML={{
                        __html: t('terminal.copilotHelp', '<b>GitHub Copilot</b>: Use <code>copilot [command]</code> or <code>?? [question]</code> to ask anything.')
                            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                            .replace(/`([^`]+)`/g, '<code style="background-color:rgba(0,0,0,0.06);padding:2px 4px;border-radius:4px;">$1</code>')
                    }} />
                </div>
                <div>
                    <div dangerouslySetInnerHTML={{
                        __html: t('terminal.geminiHelp', '<b>Google Gemini</b>: Use <code>gemini [prompt]</code> to chat with Gemini. Use <code>gemini models</code> to list models.')
                            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                            .replace(/`([^`]+)`/g, '<code style="background-color:rgba(0,0,0,0.06);padding:2px 4px;border-radius:4px;">$1</code>')
                    }} />
                </div>
                <div>
                    <div dangerouslySetInnerHTML={{
                        __html: t('terminal.claudeHelp', '<b>Anthropic Claude</b>: Use <code>claude [prompt]</code> to chat.')
                            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
                            .replace(/`([^`]+)`/g, '<code style="background-color:rgba(0,0,0,0.06);padding:2px 4px;border-radius:4px;">$1</code>')
                    }} />
                </div>
                <div style={{ marginTop: '8px', paddingTop: '16px', borderTop: '1px solid #f0f0f0', color: token.colorTextSecondary, fontSize: '13px' }}>
                    <div dangerouslySetInnerHTML={{
                        __html: t('terminal.generalHelp', 'Press <kbd>Shift + Tab</kbd> to switch focus between the input area and the chat history. Press <kbd>Ctrl + S</kbd> to save.')
                            .replace(/`([^`]+)`/g, '<kbd style="background-color:#fafafa;border:1px solid #d9d9d9;border-radius:3px;box-shadow:0 1px 0 rgba(0,0,0,0.2);color:#262626;display:inline-block;font-size:11px;line-height:1.4;margin:0 2px;padding:1px 5px;">$1</kbd>')
                    }} />
                </div>
            </div>
        </Modal>
    );
};

export default ChatHelpModal;
