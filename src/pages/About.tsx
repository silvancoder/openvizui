/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\pages\About.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { useState, useEffect } from 'react';
import { Typography, Card, Space, Divider, Button, Row, Col, List, Layout, Tag, Badge, message } from 'antd';
import { 
    GithubOutlined, 
    GlobalOutlined, 
    HeartFilled, 
    InfoCircleOutlined,
    RocketOutlined,
    TeamOutlined,
    LinkOutlined,
    SyncOutlined,
    CheckCircleOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Logo from '../components/Logo';
import { invoke } from '@tauri-apps/api/core';
import packageJson from '../../package.json';

const { Title, Paragraph, Text } = Typography;
const { Footer } = Layout;

const About = () => {
    const { t } = useTranslation();
    const currentVersion = packageJson.version;
    const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
    const [checking, setChecking] = useState(false);
    const [status, setStatus] = useState<'idle' | 'up-to-date' | 'available' | 'error'>('idle');

    const openUrl = (url: string) => {
        invoke('open_url', { url });
    };

    const isNewer = (latest: string, current: string) => {
        const l = latest.split('.').map(Number);
        const c = current.split('.').map(Number);
        for (let i = 0; i < 3; i++) {
            if (l[i] > (c[i] || 0)) return true;
            if (l[i] < (c[i] || 0)) return false;
        }
        return false;
    };

    const checkUpdate = async () => {
        setChecking(true);
        setStatus('idle');
        try {
            const response = await fetch('https://raw.githubusercontent.com/silvancoder/openvizui/master/package.json');
            if (!response.ok) throw new Error('Failed to fetch version info');
            const data = await response.json();
            const latestVersion = data.version;
            setRemoteVersion(latestVersion);

            if (isNewer(latestVersion, currentVersion)) {
                setStatus('available');
                message.info(t('about.update.available', 'New version available: {{version}}', { version: latestVersion }));
            } else {
                setStatus('up-to-date');
                message.success(t('about.update.latest', 'You are up to date!'));
            }
        } catch (error) {
            console.error('Update check failed:', error);
            setStatus('error');
            message.error(t('about.update.error', 'Failed to check for updates.'));
        } finally {
            setChecking(false);
        }
    };

    useEffect(() => {
        // Automatically check on mount but silently
        const silentCheck = async () => {
            try {
                const response = await fetch('https://raw.githubusercontent.com/silvancoder/openvizui/master/package.json');
                if (response.ok) {
                    const data = await response.json();
                    setRemoteVersion(data.version);
                    if (isNewer(data.version, currentVersion)) {
                        setStatus('available');
                    } else {
                        setStatus('up-to-date');
                    }
                }
            } catch (e) {
                // Ignore silent errors
            }
        };
        silentCheck();
    }, [currentVersion]);

    const features = [
        { icon: <RocketOutlined />, title: t('about.features.fast.title', 'Blazing Fast'), desc: t('about.features.fast.desc', 'Optimized for performance with Rust and React.') },
        { icon: <TeamOutlined />, title: t('about.features.community.title', 'Community Driven'), desc: t('about.features.community.desc', 'Open source and collaborative development.') },
        { icon: <RocketOutlined />, title: t('about.features.tools.title', 'AI Multi-Tool'), desc: t('about.features.tools.desc', 'Unified interface for leading AI CLI tools.') },
    ];

    const resources = [
        { name: 'GitHub Repository', url: 'https://github.com/silvancoder/openvizui', icon: <GithubOutlined /> },
        { name: 'Official Website', url: 'https://openvizui.com', icon: <GlobalOutlined /> },
        { name: 'Documentation', url: 'https://docs.openvizui.com', icon: <LinkOutlined /> },
    ];

    return (
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px' }}>
            <Card variant="borderless" style={{ textAlign: 'center', background: 'transparent' }}>
                <div style={{ transform: 'scale(1.5)', marginBottom: 24 }}>
                    <Logo collapsed={false} theme="light" />
                </div>
                <Space orientation="vertical" align="center" size={0}>
                    <Text type="secondary" style={{ fontSize: 16 }}>
                        OpenVizUI
                    </Text>
                    <Space size="large" orientation="horizontal" style={{ marginBottom: 16 }}>
                        <Space>
                            <Text type="secondary">{t('about.version.local', 'Local Version')}:</Text>
                            <Tag color="blue" style={{ margin: 0 }}>v{currentVersion}</Tag>
                        </Space>
                        <Space>
                            <Text type="secondary">{t('about.version.server', 'Server Version')}:</Text>
                            <Tag color={status === 'available' ? 'gold' : 'blue'} style={{ margin: 0 }}>
                                {remoteVersion ? `v${remoteVersion}` : (checking ? t('about.update.checking', 'Checking...') : '---')}
                            </Tag>
                        </Space>
                    </Space>
                    <Badge dot={status === 'available'} offset={[-5, 5]}>
                        <Button 
                            type={status === 'available' ? 'primary' : 'default'}
                            size="middle" 
                            icon={checking ? <SyncOutlined spin /> : <SyncOutlined />} 
                            onClick={status === 'available' ? () => openUrl('https://github.com/silvancoder/openvizui') : checkUpdate}
                            disabled={checking}
                        >
                            {status === 'available' 
                                ? t('about.update.now', 'Update Now') 
                                : (checking ? t('about.update.checking', 'Checking...') : t('about.update.check', 'Check Update'))
                            }
                        </Button>
                    </Badge>

                    {status === 'available' && remoteVersion && (
                        <div style={{ marginTop: 8 }}>
                            <Tag color="gold" icon={<ExclamationCircleOutlined />}>
                                {t('about.update.newVersion', 'Latest version: {{version}}', { version: remoteVersion })}
                            </Tag>
                        </div>
                    )}
                    {status === 'up-to-date' && (
                        <div style={{ marginTop: 8 }}>
                            <Tag color="success" icon={<CheckCircleOutlined />}>
                                {t('about.update.isLatest', 'Latest Version')}
                            </Tag>
                        </div>
                    )}
                </Space>
                <div style={{ marginTop: 24 }}>
                    <Paragraph style={{ fontSize: 16 }}>
                        {t('about.description', 'OpenVizUI is a powerful, modern visualization interface for AI CLI tools. It provides a unified, beautiful, and efficient way to manage your AI workflows, from skills management to complex configurations.')}
                    </Paragraph>
                </div>
                <Space size="large" style={{ marginTop: 24 }}>
                    <Button 
                        type="primary" 
                        size="large" 
                        icon={<GithubOutlined />}
                        onClick={() => openUrl('https://github.com/silvancoder/openvizui')}
                    >
                        GitHub
                    </Button>
                    <Button 
                        size="large" 
                        icon={<GlobalOutlined />}
                        onClick={() => openUrl('https://openvizui.com')}
                    >
                        {t('about.visitWebsite', 'Visit Website')}
                    </Button>
                </Space>
            </Card>

            <Divider />

            <Row gutter={[32, 32]} style={{ marginTop: 32 }}>
                <Col xs={24} md={12}>
                    <Title level={4}><RocketOutlined /> {t('about.whyTitle', 'Key Features')}</Title>
                    <List
                        itemLayout="horizontal"
                        dataSource={features}
                        renderItem={item => (
                            <List.Item>
                                <List.Item.Meta
                                    avatar={<div style={{ fontSize: 24, color: '#1890ff' }}>{item.icon}</div>}
                                    title={<Text strong>{item.title}</Text>}
                                    description={item.desc}
                                />
                            </List.Item>
                        )}
                    />
                </Col>
                <Col xs={24} md={12}>
                    <Title level={4}><InfoCircleOutlined /> {t('about.resourcesTitle', 'Resources')}</Title>
                    <List
                        dataSource={resources}
                        renderItem={item => (
                            <List.Item>
                                <Button 
                                    type="link" 
                                    icon={item.icon} 
                                    onClick={() => openUrl(item.url)}
                                    style={{ padding: 0 }}
                                >
                                    {item.name}
                                </Button>
                            </List.Item>
                        )}
                    />
                    <Card size="small" style={{ marginTop: 24, background: 'rgba(24, 144, 255, 0.05)' }}>
                        <Text italic>
                            {t('about.madeBy', 'Made with')} <HeartFilled style={{ color: '#ff4d4f' }} /> {t('about.byContributors', 'by OpenVizUI Contributors')}
                        </Text>
                    </Card>
                </Col>
            </Row>

            <Footer style={{ textAlign: 'center', marginTop: 64, background: 'transparent' }}>
                <Text type="secondary">
                    Copyright © 2026 OpenVizUI. Released under the MIT License.
                </Text>
            </Footer>
        </div>
    );
};

export default About;
