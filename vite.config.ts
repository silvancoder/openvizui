import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        // Split large vendor libraries into separate chunks to improve caching and
        // reduce the initial bundle size (#8)
        rollupOptions: {
            output: {
                manualChunks: {
                    // Ant Design is large; isolate it so it can be cached independently
                    'vendor-antd': ['antd', '@ant-design/icons'],
                    // Monaco editor is huge (~5 MB) — always separate
                    'vendor-monaco': ['@monaco-editor/react'],
                    // Terminal emulator
                    'vendor-xterm': ['@xterm/xterm', '@xterm/addon-fit', '@xterm/addon-web-links'],
                    // React core
                    'vendor-react': ['react', 'react-dom', 'react-router-dom'],
                    // i18next
                    'vendor-i18n': ['i18next', 'react-i18next'],
                    // Zustand state management
                    'vendor-zustand': ['zustand'],
                },
            },
        },
    },
})
