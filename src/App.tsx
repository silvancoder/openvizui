/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\App.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Terminal from './pages/Terminal';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Apps from './pages/Apps';
import AISettings from './pages/AISettings';
import About from './pages/About';
//import Chat from './pages/Chat';
import { ConfigProvider, theme as antTheme, message } from 'antd';
import { useAppStore } from './store/appStore';

// Configure global message offset to avoid overlapping with custom title bar (height: 32px)
message.config({
    top: 50,
    maxCount: 3,
});

function App() {
    const { theme, primaryColor, fontFamily, textColor } = useAppStore();

    // Build theme tokens dynamically to avoid overriding defaults with undefined
    const themeTokens: any = {
        colorPrimary: primaryColor,
        fontFamily: fontFamily,
    };

    if (textColor) {
        themeTokens.colorText = textColor;
    }

    return (
        <ConfigProvider
            theme={{
                algorithm: theme === 'dark' ? antTheme.darkAlgorithm : antTheme.defaultAlgorithm,
                token: themeTokens,
            }}
        >
            <BrowserRouter>
                <Routes>
                    <Route path="/" element={<MainLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="apps" element={<Apps />} />
                        <Route path="ai-settings" element={<AISettings />} />
                        <Route path="settings" element={<Settings />} />
                        <Route path="terminal" element={<Terminal />} />
                        {/* <Route path="chat" element={<Chat />} /> */}
                        <Route path="about" element={<About />} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
}

export default App;
