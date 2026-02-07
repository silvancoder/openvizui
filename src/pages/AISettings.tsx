
import { Typography, Tabs, Card, List, Button, Input, message, Popconfirm, Tag, Empty, Space, Row, Col, Segmented } from 'antd';
import { useTranslation } from 'react-i18next';
import { 
    RobotOutlined, 
    AppstoreAddOutlined, 
    GithubOutlined, 
    DeleteOutlined, 
    ReloadOutlined,
    CloudDownloadOutlined, 
    FolderOpenOutlined 
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

const { Title, Paragraph, Text } = Typography;
const { Search } = Input;

interface McpInfo {
    path: string;
    name: string;
}

const AISettings = () => {
    const { t } = useTranslation();
    const [installedMcps, setInstalledMcps] = useState<McpInfo[]>([]);
    const [loading, setLoading] = useState(false);
    const [installUrl, setInstallUrl] = useState('');
    const [activeDir, setActiveDir] = useState<'agents' | 'claude'>('agents');

    // Popular skills list for quick install
    const POPULAR_SKILLS = [
        { 
            name: t('aiSettings.popularPacks.findSkills.name', "Find Skills"), 
            command: "npx skills add https://github.com/vercel-labs/skills.git --skill find-skills", 
            desc: t('aiSettings.popularPacks.findSkills.desc', "Tools for searching and discovering available skills.")
        },
        { 
            name: t('aiSettings.popularPacks.vercelBestPractices.name', "Vercel React Best Practices"), 
            command: "npx skills add https://github.com/vercel-labs/agent-skills.git --skill vercel-react-best-practices", 
            desc: t('aiSettings.popularPacks.vercelBestPractices.desc', "Official Vercel React development best practices.")
        },
        {
            name: t('aiSettings.popularPacks.webDesign.name', "Web Design Guidelines"),
            command: "npx skills add https://github.com/vercel-labs/agent-skills.git --skill web-design-guidelines",
            desc: t('aiSettings.popularPacks.webDesign.desc', "Modern Web design standards and guidelines.")
        },
        {
            name: t('aiSettings.popularPacks.remotion.name', "Remotion Best Practices"),
            command: "npx skills add https://github.com/remotion-dev/skills.git --skill remotion-best-practices",
            desc: t('aiSettings.popularPacks.remotion.desc', "Best practices for creating videos with React.")
        },
        {
            name: t('aiSettings.popularPacks.frontendDesign.name', "Frontend Design"),
            command: "npx skills add https://github.com/anthropics/skills.git --skill frontend-design",
            desc: t('aiSettings.popularPacks.frontendDesign.desc', "Frontend design patterns and implementation techniques.")
        },
        {
            name: t('aiSettings.popularPacks.composition.name', "Vercel Composition Patterns"),
            command: "npx skills add https://github.com/vercel-labs/agent-skills.git --skill vercel-composition-patterns",
            desc: t('aiSettings.popularPacks.composition.desc', "Vercel component composition patterns.")
        },
        {
            name: t('aiSettings.popularPacks.agentBrowser.name', "Agent Browser"),
            command: "npx skills add https://github.com/vercel-labs/agent-browser.git --skill agent-browser",
            desc: t('aiSettings.popularPacks.agentBrowser.desc', "Enable browser capabilities for Agents.")
        },
        {
            name: t('aiSettings.popularPacks.skillCreator.name', "Skill Creator"),
            command: "npx skills add https://github.com/anthropics/skills.git --skill skill-creator",
            desc: t('aiSettings.popularPacks.skillCreator.desc', "Tools to help create new Skills skills.")
        }
    ];

    const loadSkills = async () => {
        try {
            setLoading(true);
            const mcps = await invoke<McpInfo[]>('list_installed_skills', { target: activeDir });
            setInstalledMcps(mcps);
        } catch (error) {
            message.error(t('aiSettings.errors.loadFailed', 'Failed to load MCPs: ') + error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSkills();
    }, [activeDir]);

    const handleInstall = async (input: string) => {
        if (!input) {
            message.warning(t('aiSettings.warnings.enterUrl', 'Please enter a GitHub URL or npx command'));
            return;
        }

        let url = input;
        let name: string | undefined = undefined;

        // Parse npx command: npx skills add <url> --skill <name>
        if (input.startsWith('npx skills add')) {
            const parts = input.split(' ');
            // Find the URL (it should be the one starting with http)
            const urlPart = parts.find(p => p.startsWith('http'));
            
            if (urlPart) {
                url = urlPart;
            }

            // Find --skill and take the next part
            const skillIndex = parts.indexOf('--skill');
            if (skillIndex !== -1 && skillIndex + 1 < parts.length) {
                name = parts[skillIndex + 1];
            }
        }
        
        const key = 'installing';
        message.loading({ content: t('aiSettings.status.installing', 'Installing Skills...'), key });
        try {
            await invoke('install_skills', { url, name, target: activeDir });
            message.success({ content: t('aiSettings.status.installSuccess', 'Skills Installed Successfully!'), key, duration: 2 });
            setInstallUrl('');
            loadSkills();
        } catch (error) {
            message.error({ content: `${t('aiSettings.errors.installFailed', 'Installation failed: ')}${error}`, key, duration: 5 });
        }
    };

    const handleUninstall = async (path: string) => {
        try {
            await invoke('uninstall_skills', { path });
            message.success(t('aiSettings.status.uninstallSuccess', 'Skills Uninstalled'));
            loadSkills();
        } catch (error) {
            message.error(t('aiSettings.errors.uninstallFailed', 'Uninstall failed: ') + error);
        }
    };

    const McpManagement = () => (
        <div style={{ padding: '0 24px' }}>
            <Row gutter={[24, 24]}>
                {/* Installed MCPs */}
                <Col xs={24} lg={14}>
                    <Card 
                        title={
                            <Space>
                                <AppstoreAddOutlined /> 
                                <span>{t('aiSettings.installedTitle', 'Installed MCPs')}</span>
                                <Tag color="blue">{installedMcps.length}</Tag>
                            </Space>
                        } 
                        extra={
                            <Space>
                                <Segmented
                                    options={[
                                        { label: '.agents', value: 'agents' },
                                        { label: '.claude', value: 'claude' },
                                    ]}
                                    value={activeDir}
                                    onChange={(val) => setActiveDir(val as 'agents' | 'claude')}
                                />
                                <Button icon={<ReloadOutlined />} onClick={loadSkills}>{t('aiSettings.refresh', 'Refresh')}</Button>
                            </Space>
                        }
                    >
                        <List
                            loading={loading}
                            dataSource={installedMcps}
                            pagination={{
                                position: 'bottom',
                                align: 'center',
                                pageSize: 10
                            }}
                            locale={{ emptyText: <Empty description={t('aiSettings.noMcps', 'No MCPs installed yet')} /> }}
                            renderItem={item => (
                                <List.Item
                                    actions={[
                                        <Popconfirm
                                            title={t('aiSettings.uninstallConfirmTitle', 'Confirm Uninstall')}
                                            description={t('aiSettings.uninstallConfirmDesc', 'Are you sure you want to remove this Skills?')}
                                            onConfirm={() => handleUninstall(item.path)}
                                            okText={t('common.confirm', 'Yes')}
                                            cancelText={t('common.cancel', 'No')}
                                        >
                                            <Button danger size="small" icon={<DeleteOutlined />}>{t('aiSettings.uninstall', 'Uninstall')}</Button>
                                        </Popconfirm>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={<FolderOpenOutlined style={{ fontSize: 24, color: '#1890ff' }} />}
                                        title={<Text strong>{item.name}</Text>}
                                        description={<Text type="secondary" style={{ fontSize: 12 }}>{item.path}</Text>}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>

                    <Card title={t('aiSettings.quickInstallTitle', 'Quick Install')} style={{ marginTop: 24 }}>
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>{t('aiSettings.installViaUrl', 'Install via Command or URL')}</Text>
                            <Paragraph type="secondary" style={{ fontSize: 12 }}>
                                {t('aiSettings.installHint', 'Enter "npx skills add <url> --skill <name>" or just a GitHub URL.')}
                            </Paragraph>
                            <Search
                                placeholder="npx skills add https://github.com/owner/repo --skill name"
                                enterButton={t('aiSettings.install', 'Install')}
                                value={installUrl}
                                onChange={e => setInstallUrl(e.target.value)}
                                onSearch={handleInstall}
                                loading={loading}
                            />
                         </div>
                    </Card>
                </Col>

                {/* Popular MCPs */}
                <Col xs={24} lg={10}>
                    <Card title={<span><CloudDownloadOutlined /> {t('aiSettings.popularTitle', 'Popular MCPs')}</span>}>
                        <List
                            dataSource={POPULAR_SKILLS}
                            renderItem={item => (
                                <List.Item
                                    actions={[
                                        <Button 
                                            type="link" 
                                            icon={<CloudDownloadOutlined />} 
                                            onClick={() => handleInstall(item.command)}
                                            disabled={loading}
                                        >
                                            {t('aiSettings.install', 'Install')}
                                        </Button>
                                    ]}
                                >
                                    <List.Item.Meta
                                        avatar={<GithubOutlined style={{ fontSize: 20 }} />}
                                        title={
                                            <a 
                                                href={item.command.split(' ')[3]?.replace('.git', '') || '#'} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                            >
                                                {item.name}
                                            </a>
                                        }
                                        description={item.desc}
                                    />
                                </List.Item>
                            )}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );

    return (
        <div style={{ margin: '0 auto', width: '100%', height: '100%', overflowY: 'auto' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
                <Title level={2}><RobotOutlined /> {t('aiSettings.title', 'AI Settings')}</Title>
                <Tabs
                    defaultActiveKey="Skills"
                    items={[
                        {
                            key: 'Skills',
                            label: t('aiSettings.tabs.Skills', 'Skills Management'),
                            children: <McpManagement />
                        },
                        {
                            key: 'coming_soon',
                            label: t('aiSettings.tabs.more', 'More Settings'),
                            children: <Empty description={t('aiSettings.tabs.comingSoon', 'More AI settings coming soon...')} />
                        }
                    ]}
                />
            </div>
        </div>
    );
};

export default AISettings;
