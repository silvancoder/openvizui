import React, { useState } from 'react';
import { Modal, Form, Input, Button, Row, Col, Select, message } from 'antd';
import { useTranslation } from 'react-i18next';
import { fetchRemoteModels } from '../../lib/tauri';

interface ChatSettingsModalProps {
    open: boolean;
    onCancel: () => void;
    activeChatToolId: string | undefined;
    toolConfigs: Record<string, any>;
    addChatProvider: (provider: string) => void;
    setToolConfig: (provider: string, config: any) => void;
    setActiveChatToolId: (provider: string) => void;
}

const ChatSettingsModal: React.FC<ChatSettingsModalProps> = ({
    open,
    onCancel,
    activeChatToolId,
    toolConfigs,
    addChatProvider,
    setToolConfig,
    setActiveChatToolId
}) => {
    const { t } = useTranslation();
    const [form] = Form.useForm();
    const [modelSelectOpen, setModelSelectOpen] = useState(false);
    const [fetchedModels, setFetchedModels] = useState<string[]>([]);
    const [fetchingModels, setFetchingModels] = useState(false);

    const onFinish = (values: any) => {
        const newProvider = values.provider.trim();
        if (newProvider) {
            addChatProvider(newProvider);
            const modelValue = Array.isArray(values.model) ? values.model[0] : values.model;
            setToolConfig(newProvider, {
                llmApiKey: values.apiKey,
                llmModel: modelValue,
                llmBaseUrl: values.baseUrl
            });
            setActiveChatToolId(newProvider);
            message.success(t('chat.saved', 'Settings saved!'));
            onCancel();
        }
    };

    return (
        <Modal
            title={t('chat.settingsModalTitle', 'LLM Configuration')}
            open={open}
            onCancel={onCancel}
            footer={null}
            destroyOnClose
            width={500}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    provider: activeChatToolId || '',
                    apiKey: activeChatToolId ? toolConfigs[activeChatToolId]?.llmApiKey || '' : '',
                    model: activeChatToolId && toolConfigs[activeChatToolId]?.llmModel ? [toolConfigs[activeChatToolId]?.llmModel] : [],
                    baseUrl: activeChatToolId ? toolConfigs[activeChatToolId]?.llmBaseUrl || '' : ''
                }}
                onFinish={onFinish}
            >
                <Form.Item
                    label={t('chat.serviceProvider', 'Service Provider')}
                    name="provider"
                    rules={[{ required: true, message: t('chat.enterProviderName', 'Please input a provider name') }]}
                >
                    <Input placeholder="e.g. google, openai, deepseek..." />
                </Form.Item>
                <Form.Item
                    label={t('chat.apiKey', 'API Key')}
                    name="apiKey"
                    rules={[{ required: true, message: t('chat.enterApiKey', 'Please input an API Key') }]}
                >
                    <Input.Password placeholder="sk-..." />
                </Form.Item>
                <Form.Item
                    label={t('chat.baseUrl', 'Base URL')}
                    name="baseUrl"
                    rules={[{ required: true, message: t('chat.enterBaseUrl', 'Please input the Base URL') }]}
                >
                    <Input placeholder="https://api.openai.com/v1" />
                </Form.Item>
                <Form.Item
                    label={t('chat.model', 'Model Name')}
                    tooltip={t('chat.modelTooltip', 'Select or type a model ID')}
                >
                    <Row gutter={8}>
                        <Col flex="auto">
                            <Form.Item
                                name="model"
                                noStyle
                                rules={[{ required: true, message: t('chat.enterModelId', 'Please input the Model ID') }]}
                                getValueFromEvent={(val) => Array.isArray(val) ? val : [val]}
                            >
                                <Select
                                    mode="tags"
                                    maxCount={1}
                                    open={modelSelectOpen}
                                    onOpenChange={setModelSelectOpen}
                                    onSelect={() => setModelSelectOpen(false)}
                                    onChange={(val) => {
                                        const newVal = Array.isArray(val) ? val.slice(-1) : [val];
                                        form.setFieldValue('model', newVal);
                                    }}
                                    options={fetchedModels.map((m: string) => ({ value: m, label: m }))}
                                    placeholder={t('chat.modelPlaceholder', 'gpt-4o-mini, deepseek-chat...')}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                        </Col>
                        <Col>
                            <Button
                                loading={fetchingModels}
                                onClick={async () => {
                                    const values = form.getFieldsValue();
                                    if (!values.baseUrl || !values.apiKey) {
                                        message.warning(t('chat.fetchErrorNoConfig', 'Please fill in Base URL and API Key first'));
                                        return;
                                    }
                                    setFetchingModels(true);
                                    try {
                                        const models = await fetchRemoteModels(values.baseUrl, values.apiKey);
                                        setFetchedModels(models);
                                        setModelSelectOpen(true);
                                        message.success(t('chat.fetchSuccess', 'Fetched {{count}} models', { count: models.length }));
                                    } catch (e) {
                                        message.error(t('chat.fetchError', 'Failed to fetch models'));
                                    } finally {
                                        setFetchingModels(false);
                                    }
                                }}
                            >
                                {t('chat.fetchModels', 'Fetch')}
                            </Button>
                        </Col>
                    </Row>
                </Form.Item>
                <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                    <Button onClick={onCancel} style={{ marginRight: 8 }}>
                        {t('common.cancel', 'Cancel')}
                    </Button>
                    <Button type="primary" htmlType="submit">
                        {t('common.save', 'Save')}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default ChatSettingsModal;
