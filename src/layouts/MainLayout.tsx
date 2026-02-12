/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\layouts\MainLayout.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { Layout, Menu, Switch, theme, Select } from 'antd';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
    ToolOutlined,
    SettingOutlined,
    CodeOutlined,
    AppstoreOutlined,
    RobotOutlined,
    InfoCircleOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { useEffect, useState } from 'react';
import EnvironmentStatusInfo from '../components/EnvironmentStatusInfo';
import Logo from '../components/Logo';
import TitleBar from '../components/TitleBar';



const { Header, Content, Sider, Footer } = Layout;

const MainLayout = () => {
    const { token } = theme.useToken();
    const navigate = useNavigate();
    const location = useLocation();
    const { t, i18n } = useTranslation();
    const { theme: appTheme, setTheme, opacity, language, setLanguage } = useAppStore();
    const [collapsed, setCollapsed] = useState(false);

    const items = [
        {
            key: '/',
            icon: <ToolOutlined />,
            label: t('app.dashboard'),
        },
        {
            key: '/apps',
            icon: <AppstoreOutlined />,
            label: t('app.apps'),
        },
        {
            key: '/ai-settings',
            icon: <RobotOutlined />,
            label: t('app.aiSettings'),
        },

        {
            key: '/terminal',
            icon: <CodeOutlined />,
            label: t('app.terminal.label'),
        },
        {
            key: '/settings',
            icon: <SettingOutlined />,
            label: t('app.settings'),
        },
        {
            key: '/about',
            icon: <InfoCircleOutlined />,
            label: t('app.about', 'About'),
        },
    ];

    const handleThemeChange = (checked: boolean) => {
        setTheme(checked ? 'dark' : 'light');
    };

    const { loadConfig } = useAppStore();

    useEffect(() => {
        loadConfig();
    }, []);

    useEffect(() => {
        // Apply theme to body
        if (appTheme === 'dark') {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [appTheme]);

    useEffect(() => {
        if (language && i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [language, i18n]);

    const handleLanguageChange = (value: string) => {
        setLanguage(value);
        i18n.changeLanguage(value);
    };

    const isDark = appTheme === 'dark';

    return (
        <div style={{ height: '100vh', overflow: 'hidden', opacity: opacity, display: 'flex', flexDirection: 'column' }}>
            <TitleBar />
            <Layout style={{ flex: 1, overflow: 'hidden', marginTop: '32px' }}>
                <Sider
                    collapsible
                    collapsed={collapsed}
                    onCollapse={setCollapsed}
                    theme={isDark ? 'dark' : 'light'}
                    style={{ background: token.colorBgContainer }}
                    trigger={null}
                >
                    <Logo collapsed={collapsed} theme={appTheme || 'light'} />
                    <Menu
                        theme={isDark ? 'dark' : 'light'}
                        mode="inline"
                        selectedKeys={[location.pathname]}
                        items={items}
                        onClick={({ key }) => navigate(key)}
                        style={{ background: 'transparent', borderRight: 0 }}
                    />
                    <div onClick={() => setCollapsed(!collapsed)} style={{
                        position: 'absolute',
                        bottom: 0,
                        width: '100%',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        background: token.colorBgContainer,
                        borderTop: `1px solid ${token.colorBorderSecondary}`,
                        color: token.colorTextSecondary,
                        fontSize: '22px',
                        fontWeight: 'bold',
                        transition: 'all 0.3s'
                    }}>
                        {collapsed ? '›' : '‹'}
                    </div>
                </Sider>
                <Layout style={{ display: 'flex', flexDirection: 'column', height: '100%', background: token.colorBgLayout }}>
                    <Header style={{
                        padding: '0 16px',
                        background: token.colorBgContainer,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        alignItems: 'center',
                        borderBottom: isDark ? 'none' : `1px solid ${token.colorBorderSecondary}`
                    }}>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <Select
                                defaultValue={i18n.language}
                                value={language || i18n.language}
                                onChange={handleLanguageChange}
                                style={{ width: 100 }}
                                size="small"
                                variant="borderless"
                                options={[
                                    { value: 'en', label: 'English' },
                                    { value: 'zh', label: '中文' },
                                ]}
                            />
                            <Switch
                                checkedChildren="Dark"
                                unCheckedChildren="Light"
                                checked={isDark}
                                onChange={handleThemeChange}
                            />
                        </div>
                    </Header>
                    <Content style={{ margin: '16px', flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
                        <Outlet />
                    </Content>
                    <Footer style={{
                        background: 'transparent',
                        padding: '10px 16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ flex: 1 }}>
                            <EnvironmentStatusInfo />
                        </div>
                        <div style={{ color: token.colorTextSecondary, fontSize: '10px', whiteSpace: 'nowrap' }}>
                            OpenVizUI v1.0.0
                        </div>
                    </Footer>
                </Layout>
            </Layout>
        </div>
    );
};

export default MainLayout;
