/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\App.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import { ConfigProvider, theme as antTheme, message, Spin } from 'antd';
import { useAppStore } from './store/appStore';

// Lazy-load all pages to reduce initial JS parse time (#5)
const Terminal   = lazy(() => import('./pages/Terminal'));
const Dashboard  = lazy(() => import('./pages/Dashboard'));
const Settings   = lazy(() => import('./pages/Settings'));
const Apps       = lazy(() => import('./pages/Apps'));
const AISettings = lazy(() => import('./pages/AISettings'));
const About      = lazy(() => import('./pages/About'));
const Chat       = lazy(() => import('./pages/Chat'));

// Configure global message offset to avoid overlapping with custom title bar (height: 32px)
message.config({
    top: 40,
    maxCount: 3,
});

const PageLoader = () => (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 200 }}>
        <Spin size="large" />
    </div>
);

function App() {
    const { theme, primaryColor, fontFamily, textColor } = useAppStore();
    // Build theme tokens dynamically to avoid overriding defaults with undefined
    const themeTokens: any = {
        colorPrimary: primaryColor,
        fontFamily: fontFamily,
        borderRadius: 8,
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
                        <Route index element={<Suspense fallback={<PageLoader />}><Dashboard /></Suspense>} />
                        <Route path="apps" element={<Suspense fallback={<PageLoader />}><Apps /></Suspense>} />
                        <Route path="ai-settings" element={<Suspense fallback={<PageLoader />}><AISettings /></Suspense>} />
                        <Route path="settings" element={<Suspense fallback={<PageLoader />}><Settings /></Suspense>} />
                        <Route path="terminal" element={<Suspense fallback={<PageLoader />}><Terminal /></Suspense>} />
                        <Route path="chat" element={<Suspense fallback={<PageLoader />}><Chat /></Suspense>} />
                        <Route path="about" element={<Suspense fallback={<PageLoader />}><About /></Suspense>} />
                    </Route>
                </Routes>
            </BrowserRouter>
        </ConfigProvider>
    );
}

export default App;
