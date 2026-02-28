/*
 * @Author: OpenVizUI Contributors
 * @FilePath: \src\components\settings\CliConfigTab.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { Card, Button, Input, Select, Segmented, Typography, Space } from 'antd';
import { ReloadOutlined, SaveOutlined } from '@ant-design/icons';
import VisualConfigEditor from '../VisualConfigEditor';
import OpenCodeAuthEditor from '../OpenCodeAuthEditor';
import CodexAuthEditor from '../CodexAuthEditor';
import ClaudeCodeAuthEditor from '../ClaudeCodeAuthEditor';
import GeminiAuthEditor from '../GeminiAuthEditor';
import CopilotAuthEditor from '../CopilotAuthEditor';
import QoderAuthEditor from '../QoderAuthEditor';
import CodebuddyAuthEditor from '../CodebuddyAuthEditor';

const { Text } = Typography;

interface CliConfigTabProps {
    t: any;
    activeTool: string;
    setActiveTool: (tool: string) => void;
    tools: any[];
    viewMode: 'visual' | 'code';
    setViewMode: (mode: 'visual' | 'code') => void;
    configContent: string;
    setConfigContent: (content: string) => void;
    configLoading: boolean;
    loadConfig: () => void;
    saveConfig: () => void;
    specialTools: string[];
}

const CliConfigTab = ({
    t, activeTool, setActiveTool, tools, viewMode, setViewMode,
    configContent, setConfigContent, configLoading, loadConfig, saveConfig,
    specialTools
}: CliConfigTabProps) => (
    <Card
        title={
            <Space>
                <span>{t('aiSettings.mcpConfig.tool', 'CLI Tool')}:</span>
                <Select
                    value={activeTool}
                    onChange={(val: string) => setActiveTool(val)}
                    options={tools.map(tool => ({ label: tool.displayName, value: tool.displayName }))}
                    style={{ width: 120 }}
                    variant="filled"
                />
                <Segmented
                    options={[
                        { label: t('aiSettings.mcpConfig.view.visual', 'Visual'), value: 'visual' },
                        { label: t('aiSettings.mcpConfig.view.code', 'Code'), value: 'code' }
                    ]}
                    value={viewMode}
                    onChange={(val) => setViewMode(val as 'visual' | 'code')}
                />
            </Space>
        }
        extra={null}
        style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column' } }}
    >
        {activeTool === 'OpenCode' && <OpenCodeAuthEditor />}
        {activeTool === 'Codex' && <CodexAuthEditor />}
        {activeTool === 'Claude' && <ClaudeCodeAuthEditor />}
        {activeTool === 'Gemini' && <GeminiAuthEditor />}
        {activeTool === 'Copilot' && <CopilotAuthEditor />}
        {activeTool === 'Qoder' && <QoderAuthEditor />}
        {activeTool === 'CodeBuddy' && <CodebuddyAuthEditor />}

        {(!specialTools.includes(activeTool) || viewMode === 'code') && (
            <>
                <div style={{ marginBottom: 8, marginTop: specialTools.includes(activeTool) ? 16 : 0 }}>
                    <Text type="secondary">{t('aiSettings.mcpConfig.configPath', 'Config Path')}: {tools.find(tool => tool.displayName === activeTool)?.configPath}</Text>
                </div>
                {viewMode === 'code' ? (
                    <Input.TextArea
                        value={configContent}
                        onChange={e => setConfigContent(e.target.value)}
                        style={{ flex: 1, fontFamily: 'monospace', minHeight: 400, resize: 'none' }}
                        spellCheck={false}
                        disabled={configLoading}
                    />
                ) : (
                    <VisualConfigEditor
                        toolName={activeTool}
                        configContent={configContent}
                        onChange={setConfigContent}
                    />
                )}
            </>
        )}

        {(!specialTools.includes(activeTool) || viewMode === 'code') && (
            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <Button icon={<ReloadOutlined />} onClick={loadConfig}>{t('aiSettings.mcpConfig.reload', 'Reload')}</Button>
                <Button type="primary" onClick={saveConfig} icon={<SaveOutlined />} loading={configLoading}>{t('aiSettings.mcpConfig.save', 'Save Config')}</Button>
            </div>
        )}
    </Card>
);

export default CliConfigTab;
