/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\pages\Settings.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { Typography, Form, Input, Select, Button, Slider, Row, Col, Card, ColorPicker, Tabs, message, Divider, Radio, InputNumber, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import { BgColorsOutlined, GlobalOutlined, PlusOutlined, DesktopOutlined, ThunderboltOutlined, SettingOutlined } from '@ant-design/icons';
import { open } from '@tauri-apps/plugin-dialog';
import { useAppStore } from '../store/appStore';
import { useState, useEffect } from 'react';
import { checkEnvironment, type EnvironmentStatus } from '../lib/tauri';
import { ReloadOutlined, CheckCircleOutlined, WarningOutlined, CodeOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;

const Settings = () => {
    const { t } = useTranslation();
    const { setTheme, setLanguage, primaryColor, opacity, setPrimaryColor, setOpacity, fontFamily, setFontFamily, textColor, setTextColor } = useAppStore();

    const fonts = [
        "Segoe UI",
        "Roboto",
        "Helvetica Neue",
        "Arial",
        "Consolas",
        "Cascadia Code",
        "Fira Code",
        "Microsoft YaHei"
    ];

    const presets = [
        { id: 'preset1', color: '#eb2f96', font: 'Segoe UI' },
        { id: 'preset2', color: '#1890ff', font: 'Roboto' },
        { id: 'preset3', color: '#52c41a', font: 'Segoe UI' },
        { id: 'preset4', color: '#722ed1', font: 'Segoe UI' },
        { id: 'preset5', color: '#faad14', font: 'Segoe UI' },
        { id: 'preset6', color: '#f5222d', font: 'Segoe UI' },
        { id: 'preset7', color: '#d4b106', font: 'Cascadia Code' },
        { id: 'preset8', color: '#595959', font: 'Fira Code' },
    ];

    const AppearanceSettings = () => (
        <Form layout="vertical">
            <Row gutter={24}>
                {/* Column 1: General */}
                <Col xs={24} md={8}>
                    <Form.Item label={t('settings.language')}>
                        <Select value={useAppStore.getState().language} onChange={setLanguage}>
                            <Option value="en">English</Option>
                            <Option value="zh">中文</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item label={t('settings.theme')}>
                        <Select value={useAppStore.getState().theme} onChange={setTheme}>
                            <Option value="light">Light</Option>
                            <Option value="dark">Dark</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item
                        label={t('settings.textColor')}
                        extra={t('settings.textColorDesc')}
                    >
                        <ColorPicker
                            showText
                            allowClear
                            value={textColor || ''}
                            onChangeComplete={(color) => setTextColor(color.toHexString())}
                            onClear={() => setTextColor('')}
                        />
                    </Form.Item>
                </Col>

                {/* Column 2: Visuals */}
                <Col xs={24} md={8}>
                    <Form.Item label={t('settings.systemFont')}>
                        <Select
                            value={fontFamily}
                            onChange={setFontFamily}
                            showSearch
                            dropdownRender={(menu) => {
                                const [customValue, setCustomValue] = useState('');
                                return (
                                    <>
                                        {menu}
                                        <Divider style={{ margin: '8px 0' }} />
                                        <div style={{ display: 'flex', gap: 8, padding: '0 8px 4px' }}>
                                            <Input
                                                size="small"
                                                placeholder={t('settings.customFontPlaceholder')}
                                                value={customValue}
                                                onChange={(e) => setCustomValue(e.target.value)}
                                                onKeyDown={(e) => e.stopPropagation()}
                                            />
                                            <Button
                                                type="text"
                                                size="small"
                                                icon={<PlusOutlined />}
                                                onClick={() => {
                                                    if (customValue) {
                                                        setFontFamily(customValue);
                                                        setCustomValue('');
                                                    }
                                                }}
                                            >
                                                {t('settings.addFont')}
                                            </Button>
                                        </div>
                                    </>
                                );
                            }}
                        >
                            {fonts.map(f => <Option key={f} value={f}>{f}</Option>)}
                            {!fonts.includes(fontFamily) && <Option value={fontFamily}>{fontFamily}</Option>}
                        </Select>
                    </Form.Item>
                    <Form.Item label={t('settings.primaryColor')}>
                        <ColorPicker
                            showText
                            value={primaryColor}
                            onChangeComplete={(color) => setPrimaryColor(color.toHexString())}
                        />
                    </Form.Item>
                    <Form.Item label={t('settings.windowOpacity')}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <Slider
                                style={{ flex: 1 }}
                                min={0.1}
                                max={1.0}
                                step={0.05}
                                value={opacity}
                                onChange={(val) => setOpacity(val)}
                            />
                            <Typography.Text style={{ width: 40 }}>{Math.round(opacity * 100)}%</Typography.Text>
                        </div>
                    </Form.Item>
                </Col>

                {/* Column 3: Presets */}
                <Col xs={24} md={8}>
                    <Typography.Text strong style={{ display: 'block', marginBottom: 12 }}>
                        {t('settings.appearancePresets')}
                    </Typography.Text>
                    <Row gutter={[8, 8]}>
                        {presets.map(p => (
                            <Col span={12} key={p.id}>
                                <Card
                                    size="small"
                                    hoverable
                                    styles={{ body: { padding: '8px' } }}
                                    style={{
                                        border: primaryColor === p.color ? `2px solid ${primaryColor}` : '1px solid #f0f0f0',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        setPrimaryColor(p.color);
                                        setFontFamily(p.font);
                                        message.success(`${t('settings.' + p.id)} ${t('settings.applyPreset')}`);
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                                        <div style={{ fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {t('settings.' + p.id)}
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </Col>
            </Row>
        </Form>
    );

    const TerminalSettings = () => {
        const { t } = useTranslation();
        const {
            terminalFontFamily,
            terminalFontSize,
            terminalBackground,
            terminalForeground,
            terminalCursorStyle,
            terminalShell,
            setTerminalSettings,
            primaryColor
        } = useAppStore();

        const terminalPresets = [
            { name: 'Default Dark', bg: '#1e1e1e', fg: '#d4d4d4' },
            { name: 'One Dark', bg: '#282c34', fg: '#abb2bf' },
            { name: 'Dracula', bg: '#282a36', fg: '#f8f8f2' },
            { name: 'Monokai', bg: '#272822', fg: '#f8f8f2' },
            { name: 'Nord', bg: '#2e3440', fg: '#d8dee9' },
            { name: 'Solarized Dark', bg: '#002b36', fg: '#839496' }
        ];

        const terminalFonts = ['Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Source Code Pro', 'Ubuntu Mono', 'monospace'];

        return (
            <Form layout="vertical">
                <Row gutter={24}>
                    <Col xs={24} md={8}>
                        <Card title={t('settings.terminalFont')} size="small" styles={{ body: { padding: 16 } }}>
                            <Form.Item label={t('settings.fontFamily')}>
                                <Select
                                    value={terminalFontFamily}
                                    onChange={(val) => setTerminalSettings({ terminalFontFamily: val })}
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <Divider style={{ margin: '4px 0' }} />
                                            <div style={{ display: 'flex', gap: 8, padding: '4px 8px' }}>
                                                <Input size="small" placeholder="Custom Font" onPressEnter={(e) => {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (val) setTerminalSettings({ terminalFontFamily: val });
                                                }} />
                                            </div>
                                        </>
                                    )}
                                >
                                    {terminalFonts.map(f => <Option key={f} value={f}>{f}</Option>)}
                                    {!terminalFonts.includes(terminalFontFamily) && <Option value={terminalFontFamily}>{terminalFontFamily}</Option>}
                                </Select>
                            </Form.Item>
                            <Form.Item label={t('settings.fontSize')}>
                                <InputNumber
                                    min={8} max={72}
                                    value={terminalFontSize}
                                    onChange={(val) => setTerminalSettings({ terminalFontSize: val || 14 })}
                                    style={{ width: '100%' }}
                                />
                            </Form.Item>
                            <Form.Item label={t('settings.cursorStyle')}>
                                <Radio.Group
                                    value={terminalCursorStyle}
                                    onChange={(e) => setTerminalSettings({ terminalCursorStyle: e.target.value })}
                                >
                                    <Radio.Button value="block">Block</Radio.Button>
                                    <Radio.Button value="underline">Underline</Radio.Button>
                                    <Radio.Button value="bar">Bar</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item label={t('settings.terminalShell')}>
                                <Select
                                    value={terminalShell}
                                    onChange={(val) => setTerminalSettings({ terminalShell: val })}
                                    dropdownRender={(menu) => (
                                        <>
                                            {menu}
                                            <Divider style={{ margin: '4px 0' }} />
                                            <div style={{ display: 'flex', gap: 8, padding: '4px 8px' }}>
                                                <Input size="small" placeholder="Custom Path (e.g. C:\Program Files\Git\bin\bash.exe)" onPressEnter={(e) => {
                                                    const val = (e.target as HTMLInputElement).value;
                                                    if (val) setTerminalSettings({ terminalShell: val });
                                                }} />
                                            </div>
                                        </>
                                    )}
                                >
                                    <Option value="bash.exe">Git Bash (Default)</Option>
                                    <Option value="wsl">WSL (Linux)</Option>
                                    {!['wsl', 'bash.exe'].includes(terminalShell) && (
                                        <Option value={terminalShell}>{terminalShell}</Option>
                                    )}
                                </Select>
                            </Form.Item>
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card title={t('settings.terminalColors')} size="small" styles={{ body: { padding: 16 } }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                <Form.Item label={t('settings.terminalBackground')} style={{ marginBottom: 0 }}>
                                    <ColorPicker
                                        value={terminalBackground}
                                        onChange={(color) => setTerminalSettings({ terminalBackground: color.toHexString() })}
                                        showText
                                    />
                                </Form.Item>
                                <Form.Item label={t('settings.terminalForeground')} style={{ marginBottom: 0 }}>
                                    <ColorPicker
                                        value={terminalForeground}
                                        onChange={(color) => setTerminalSettings({ terminalForeground: color.toHexString() })}
                                        showText
                                    />
                                </Form.Item>
                            </div>
                            <div style={{
                                marginTop: 16,
                                padding: 12,
                                background: terminalBackground,
                                color: terminalForeground,
                                borderRadius: 4,
                                fontFamily: terminalFontFamily,
                                fontSize: terminalFontSize,
                                border: '1px solid #444',
                                minHeight: 80
                            }}>
                                $ echo "Welcome to OpenVizUI!"<br />
                                $ preview rendering...<span style={{
                                    display: 'inline-block',
                                    width: 8,
                                    height: 16,
                                    background: terminalForeground,
                                    verticalAlign: 'middle',
                                    marginLeft: 4,
                                    animation: 'blink 1s step-end infinite'
                                }} />
                                <style>{`
                                @keyframes blink {
                                    0%, 100% { opacity: 1; }
                                    50% { opacity: 0; }
                                }
                            `}</style>
                            </div>
                        </Card>
                    </Col>

                    <Col xs={24} md={8}>
                        <Card title={t('settings.terminalPresets')} size="small" styles={{ body: { padding: 16 } }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                {terminalPresets.map(p => (
                                    <Card
                                        key={p.name}
                                        hoverable
                                        size="small"
                                        onClick={() => setTerminalSettings({
                                            terminalBackground: p.bg,
                                            terminalForeground: p.fg
                                        })}
                                        style={{
                                            padding: 0,
                                            overflow: 'hidden',
                                            border: terminalBackground === p.bg ? `2px solid ${primaryColor}` : '1px solid #f0f0f0'
                                        }}
                                        styles={{ body: { padding: 8 } }}
                                    >
                                        <div style={{ fontSize: 11, marginBottom: 4, fontWeight: 500 }}>{p.name}</div>
                                        <div style={{ height: 20, background: p.bg, border: '1px solid #444', borderRadius: 2, display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                                            <div style={{ width: 4, height: 4, borderRadius: '50%', background: p.fg }} />
                                            <div style={{ marginLeft: 4, width: 20, height: 2, background: p.fg, opacity: 0.5 }} />
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </Card>
                    </Col>
                </Row>
            </Form>
        );
    };

    const NetworkSettings = () => {
        const { proxyType, proxyAddress, setProxyType, setProxyAddress } = useAppStore();
        const { t } = useTranslation();
        const [testing, setTesting] = useState(false);

        const handleTestConnection = async () => {
            setTesting(true);
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                
                // Use a reliable URL to test connectivity
                await fetch('https://www.google.com/generate_204', { 
                    mode: 'no-cors',
                    signal: controller.signal 
                });
                clearTimeout(timeoutId);
                message.success(t('aiSettings.moreConfigs.localAI.checkBtn') + ': Success');
            } catch (e) {
                message.error(t('aiSettings.moreConfigs.localAI.checkBtn') + ': Failed (Timeout or Connection Error)');
            } finally {
                setTesting(false);
            }
        };

        return (
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <Card title={<span><GlobalOutlined /> {t('settings.proxySettings')}</span>} size="small">
                    <Form layout="vertical">
                        <Form.Item label={t('settings.proxyType')}>
                            <Select value={proxyType} onChange={setProxyType}>
                                <Option value="none">{t('settings.noProxy')}</Option>
                                <Option value="http">HTTP/HTTPS</Option>
                                <Option value="socks5">SOCKS5</Option>
                            </Select>
                        </Form.Item>

                        {proxyType !== 'none' && (
                            <Form.Item label={t('settings.proxyAddress')}>
                                <Input
                                    placeholder="127.0.0.1:7890"
                                    value={proxyAddress}
                                    onChange={(e) => setProxyAddress(e.target.value)}
                                    onBlur={() => message.success('Proxy address saved')}
                                />
                            </Form.Item>
                        )}
                        <Button
                            icon={<ThunderboltOutlined />}
                            onClick={handleTestConnection}
                            loading={testing}
                            style={{ marginTop: 8 }}
                        >
                            {t('aiSettings.moreConfigs.localAI.checkBtn')}
                        </Button>
                    </Form>
                    <div style={{ marginTop: 16 }}>
                        <Alert
                            type="warning"
                            showIcon
                            message={<span style={{ fontSize: 12 }}>{t('settings.proxyWarning')}</span>}
                        />
                    </div>
                </Card>
            </div>
        );
    };

    const IdeSettings = () => {
        const { idePath, setIdePath } = useAppStore();
        const { t } = useTranslation();

        const handleSelectIde = async () => {
            try {
                const selected = await open({
                    multiple: false,
                    directory: false,
                });
                if (selected) {
                    setIdePath(selected as string);
                }
            } catch (e) {
                console.error("Failed to open dialog", e);
            }
        };

        return (
            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <Card title={<span><SettingOutlined /> {t('app.system')}</span>} size="small">
                    <Form layout="vertical">
                        <Form.Item
                            label={t('settings.idePath')}
                            extra={t('settings.idePathDesc')}
                        >
                            <Input.Search
                                placeholder="C:\Users\...\Code.exe"
                                value={idePath || ''}
                                readOnly
                                enterButton={t('settings.selectIde')}
                                onSearch={handleSelectIde}
                            />
                        </Form.Item>
                    </Form>
                </Card>
            </div>
        );
    };

    const EnvironmentSettings = () => {
        const [status, setStatus] = useState<EnvironmentStatus | null>(null);
        const [loading, setLoading] = useState(false);

        const loadStatus = async () => {
            setLoading(true);
            try {
                const s = await checkEnvironment();
                setStatus(s);
            } finally {
                setLoading(false);
            }
        };

        useEffect(() => {
            loadStatus();
        }, []);

        const tools = [
            { key: 'node_version', label: 'Node.js', icon: <DesktopOutlined /> },
            { key: 'npm_version', label: 'NPM', icon: <DesktopOutlined /> },
            { key: 'git_version', label: 'Git', icon: <DesktopOutlined /> },
            { key: 'python_version', label: 'Python', icon: <DesktopOutlined /> },
            { key: 'go_version', label: 'Go', icon: <DesktopOutlined /> },
            { key: 'java_version', label: 'Java', icon: <DesktopOutlined /> },
            { key: 'gh_version', label: 'GitHub CLI', icon: <GlobalOutlined /> },
            { key: 'claude_version', label: 'Claude CLI', icon: <ThunderboltOutlined /> },
            { key: 'opencode_version', label: 'OpenCode CLI', icon: <CodeOutlined /> },
            { key: 'qoder_version', label: 'Qoder', icon: <CodeOutlined /> },
            { key: 'codebuddy_version', label: 'CodeBuddy', icon: <CodeOutlined /> },
        ];

        return (
            <div style={{ padding: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <Title level={4} style={{ margin: 0 }}>{t('settings.environmentCheck', 'Environment Check')}</Title>
                    <Button icon={<ReloadOutlined />} onClick={loadStatus} loading={loading}>
                        {t('settings.refresh', 'Refresh')}
                    </Button>
                </div>
                
                <Row gutter={[16, 16]}>
                    {tools.map(tool => {
                        const version = status ? (status as any)[tool.key] : null;
                        return (
                            <Col xs={24} sm={12} md={8} key={tool.key}>
                                <Card size="small" hoverable>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ fontSize: 24, color: version ? '#52c41a' : '#faad14' }}>
                                            {version ? <CheckCircleOutlined /> : <WarningOutlined />}
                                        </div>
                                        <div style={{ flex: 1, overflow: 'hidden' }}>
                                            <div style={{ fontWeight: 500 }}>{tool.label}</div>
                                            <div style={{ color: version ? 'rgba(0,0,0,0.45)' : '#faad14', fontSize: 12, display: 'flex', justifyContent: 'space-between' }}>
                                                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                                    {version || t('settings.notInstalled', 'Not Installed')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            </Col>
                        );
                    })}
                </Row>
                
                <Alert
                    message={t('settings.envNote', "Ensure these tools are in your system PATH to be detected.")}
                    type="info"
                    showIcon
                    style={{ marginTop: 24 }}
                />
            </div>
        );
    };

    return (
        <div style={{ margin: '0 auto', width: '100%' }}>
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
                <Title level={2}>{t('app.settings')}</Title>
            </div>

            <Tabs
                defaultActiveKey="appearance"
                centered={false}
                items={[
                    {
                        key: 'appearance',
                        label: <span style={{ padding: '0 24px' }}><BgColorsOutlined /> {t('settings.systemAppearance')}</span>,
                        children: (
                            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
                                <Card bordered={false}><AppearanceSettings /></Card>
                            </div>
                        )
                    },
                    {
                        key: 'system',
                        label: <span style={{ padding: '0 24px' }}><SettingOutlined /> {t('app.system')}</span>,
                        children: (
                            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px' }}>
                                <Card bordered={false}><IdeSettings /></Card>
                            </div>
                        )
                    },
                    {
                        key: 'network',
                        label: <span style={{ padding: '0 24px' }}><GlobalOutlined /> {t('settings.proxySettings')}</span>,
                        children: (
                            <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
                                <Card bordered={false}><NetworkSettings /></Card>
                            </div>
                        )
                    },
                    {
                        key: 'environment',
                        label: <span style={{ padding: '0 24px' }}><ThunderboltOutlined /> {t('settings.environment', 'Environment')}</span>,
                        children: (
                            <div style={{ padding: '0 24px' }}>
                                <Card bordered={false}><EnvironmentSettings /></Card>
                            </div>
                        )
                    },
                    {
                        key: 'terminal',
                        label: <span style={{ padding: '0 24px' }}><DesktopOutlined /> {t('settings.terminal')}</span>,
                        children: (
                            <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px' }}>
                                <Card bordered={false}><TerminalSettings /></Card>
                            </div>
                        )
                    }
                ]}
            />
        </div>
    );
};

export default Settings;
