/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\ModelSwitcher.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Select, Button, message, Tooltip, Space } from 'antd';
import { CloudDownloadOutlined } from '@ant-design/icons';
import { invoke } from '@tauri-apps/api/core';
import { useTranslation } from 'react-i18next';
import * as TOML from 'smol-toml';

interface ToolInfo {
    configPath: string;
    configType: 'json' | 'toml';
    modelPath: string; // dot notation path in the config object
    apiKeyPath?: string;
    endpointPath?: string;
    apiType?: 'openai' | 'anthropic' | 'google';
    defaultEndpoint?: string;
}

const TOOLS_METADATA: Record<string, ToolInfo> = {
    google: {
        configPath: '~/.gemini/settings.json',
        configType: 'json',
        modelPath: 'model',
        apiKeyPath: 'apiKey',
        apiType: 'google',
        defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta'
    },
    claude: {
        configPath: '~/.claude.json',
        configType: 'json',
        modelPath: 'model',
        apiKeyPath: 'env.ANTHROPIC_AUTH_TOKEN',
        endpointPath: 'env.ANTHROPIC_BASE_URL',
        apiType: 'anthropic',
        defaultEndpoint: 'https://api.anthropic.com'
    },
    qoder: {
        configPath: '~/.qoder/settings.json',
        configType: 'json',
        modelPath: 'ai_models.primary_model',
        // Qoder is complex, it has multiple providers. 
        // For simplicity, we'll try to get the first provider's key/endpoint if needed,
        // or just assume the user has configured it.
    },
    opencode: {
        configPath: '~/.config/opencode/opencode.json',
        configType: 'json',
        modelPath: 'model',
        // Auth is in a separate file, making this harder. 
        // We'll skip remote fetch for now or implement special logic.
    },
    codex: {
        configPath: '~/.codex/config.toml',
        configType: 'toml',
        modelPath: 'model',
        // Auth is in ~/.codex/auth.json
    },
    codebuddy: {
        configPath: '~/.codebuddy/settings.json',
        configType: 'json',
        modelPath: 'model',
        apiKeyPath: 'env.CODEBUDDY_API_KEY',
        endpointPath: 'env.CODEBUDDY_BASE_URL',
        apiType: 'openai'
    }
};

// Helper to get nested value from object using dot notation
const getNestedValue = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

// Helper to set nested value in object using dot notation
const setNestedValue = (obj: any, path: string, value: any) => {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!current[parts[i]]) current[parts[i]] = {};
        current = current[parts[i]];
    }
    current[parts[parts.length - 1]] = value;
};

interface ModelSwitcherProps {
    toolId: string;
}

const ModelSwitcher: React.FC<ModelSwitcherProps> = ({ toolId }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [models, setModels] = useState<string[]>([]);
    const [currentModel, setCurrentModel] = useState<string | null>(null);
    const [config, setConfig] = useState<any>(null);

    const metadata = TOOLS_METADATA[toolId];

    const loadConfig = useCallback(async () => {
        if (!metadata) return;
        setLoading(true);
        try {
            const content = await invoke<string>('get_config_file', { path: metadata.configPath });
            if (content) {
                const parsed = metadata.configType === 'toml' ? TOML.parse(content) : JSON.parse(content);
                setConfig(parsed);
                const model = getNestedValue(parsed, metadata.modelPath);
                setCurrentModel(model || null);
                
                // For Claude, handle synced model field
                if (toolId === 'claude' && parsed.env?.ANTHROPIC_MODEL) {
                    setCurrentModel(parsed.env.ANTHROPIC_MODEL);
                }
            }
        } catch (error) {
            console.error(`Failed to load config for ${toolId}:`, error);
        } finally {
            setLoading(false);
        }
    }, [metadata, toolId]);

    useEffect(() => {
        loadConfig();
    }, [loadConfig]);

    const fetchModels = async () => {
        if (!metadata || !config) return;
        
        let apiKey = metadata.apiKeyPath ? getNestedValue(config, metadata.apiKeyPath) : null;
        let endpoint = metadata.endpointPath ? getNestedValue(config, metadata.endpointPath) : metadata.defaultEndpoint;

        // Special handling for legacy tools or multi-file configs
        if (toolId === 'qoder') {
            // Try to find any provider with a key
            const providers = config.api_keys || {};
            const firstProvider = Object.values(providers)[0] as any;
            if (firstProvider) {
                apiKey = firstProvider.key;
                endpoint = firstProvider.endpoint;
            }
        } else if (toolId === 'opencode') {
            try {
                const authContent = await invoke<string>('get_config_file', { path: '~/.local/share/opencode/auth.json' });
                if (authContent) {
                    const auth = JSON.parse(authContent);
                    const firstProvider = Object.values(auth)[0] as any;
                    if (firstProvider) {
                        apiKey = firstProvider.key;
                        endpoint = firstProvider.address;
                    }
                }
            } catch (e) { console.error('Failed to load OpenCode auth', e); }
        } else if (toolId === 'codex') {
            try {
                const authContent = await invoke<string>('get_config_file', { path: '~/.codex/auth.json' });
                if (authContent) {
                    const auth = JSON.parse(authContent);
                    const firstProvider = Object.values(auth)[0] as any;
                    if (firstProvider) {
                        apiKey = firstProvider.key;
                    }
                    endpoint = config.model_providers?.[config.model_provider]?.base_url;
                }
            } catch (e) { console.error('Failed to load Codex auth', e); }
        }

        if (!apiKey) {
            message.warning(t('aiSettings.cliConfig.fields.apiKeyRequired', 'Please configure API Key in Settings first'));
            return;
        }

        setFetching(true);
        try {
            const fetchedList = await invoke<string[]>('fetch_remote_models', {
                baseUrl: endpoint || 'https://api.openai.com/v1',
                apiKey,
                apiType: metadata.apiType || 'openai'
            });
            setModels(fetchedList);
            message.success(t('aiSettings.cliConfig.modelsFetched', { count: fetchedList.length }));
        } catch (error) {
            console.error('Failed to fetch models:', error);
            message.error(`${t('aiSettings.cliConfig.fetchModelsFailed')}: ${error}`);
        } finally {
            setFetching(false);
        }
    };

    const handleModelChange = async (value: string) => {
        if (!metadata || !config) return;

        try {
            const updatedConfig = { ...config };
            setNestedValue(updatedConfig, metadata.modelPath, value);
            
            // Special sync for Claude
            if (toolId === 'claude') {
                if (!updatedConfig.env) updatedConfig.env = {};
                updatedConfig.env.ANTHROPIC_MODEL = value;
            }

            const content = metadata.configType === 'toml' ? TOML.stringify(updatedConfig) : JSON.stringify(updatedConfig, null, 2);
            await invoke('save_config_file', { path: metadata.configPath, content });
            
            setCurrentModel(value);
            setConfig(updatedConfig);
            message.success(t('aiSettings.mcpConfig.saved', 'Model updated and saved'));
        } catch (error) {
            console.error('Failed to save model change:', error);
            message.error(t('aiSettings.mcpConfig.saveFailed', 'Failed to save configuration'));
        }
    };

    if (!metadata) return null;

    return (
        <div>
            <div style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>Model</span>
            </div>
            <Space.Compact style={{ width: '100%' }}>
                <Select
                    size="middle"
                    style={{ width: '100%' }}
                    placeholder="Select Model"
                    loading={loading}
                    value={currentModel}
                    onChange={handleModelChange}
                    showSearch
                    options={models.length > 0 ? models.map(m => ({ label: m, value: m })) : (currentModel ? [{ label: currentModel, value: currentModel }] : [])}
                />
                <Tooltip title={t('aiSettings.moreConfigs.localAI.fetchModels')}>
                    <Button 
                        icon={<CloudDownloadOutlined />} 
                        onClick={fetchModels} 
                        loading={fetching}
                    />
                </Tooltip>
            </Space.Compact>
        </div>
    );
};

export default ModelSwitcher;
