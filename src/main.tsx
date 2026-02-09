/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\main.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css';
import './i18n';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <App />
    </StrictMode>,
)
