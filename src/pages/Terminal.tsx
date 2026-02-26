/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\pages\Terminal.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { useState } from 'react';
import Terminal from '../components/Terminal';
import { Layout, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { ptyClose } from '../lib/tauri';
import WorkspaceSider from '../components/WorkspaceSider';

type TargetKey = React.MouseEvent | React.KeyboardEvent | string;

const TerminalPage = () => {
    const { t } = useTranslation();

    // --- Terminal Tabs State ---
    const [activeTerminalId, setActiveTerminalId] = useState<string>('1');
    const [terminals, setTerminals] = useState<{ key: string; closable?: boolean }[]>([
        { key: '1', closable: false },
    ]);

    const addTerminal = () => {
        const newActiveKey = `${terminals.length + 1}`;
        const newPanes = [...terminals];
        newPanes.push({ key: newActiveKey });
        setTerminals(newPanes);
        setActiveTerminalId(newActiveKey);
    };

    const removeTerminal = async (targetKey: TargetKey) => {
        let newActiveKey = activeTerminalId;
        let lastIndex = -1;
        terminals.forEach((item, i) => {
            if (item.key === targetKey) {
                lastIndex = i - 1;
            }
        });
        const newPanes = terminals.filter((item) => item.key !== targetKey);
        if (newPanes.length && newActiveKey === targetKey) {
            if (lastIndex >= 0) {
                newActiveKey = newPanes[lastIndex].key;
            } else {
                newActiveKey = newPanes[0].key;
            }
        }
        setTerminals(newPanes);
        setActiveTerminalId(newActiveKey);

        // Clean up PTY session
        await ptyClose(targetKey as string);
    };

    const onEdit = (targetKey: TargetKey, action: 'add' | 'remove') => {
        if (action === 'add') {
            addTerminal();
        } else {
            removeTerminal(targetKey);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Layout style={{ height: '100%', background: 'transparent' }}>
                <WorkspaceSider sessionId={activeTerminalId} placement="left" />

                <div style={{ flex: 1, overflow: 'hidden' }}>
                    <Tabs
                        type="editable-card"
                        onChange={setActiveTerminalId}
                        activeKey={activeTerminalId}
                        onEdit={onEdit}
                        items={terminals.map((pane) => ({
                            label: t('terminal.tabs.new', { number: pane.key }),
                            key: pane.key,
                            children: <Terminal sessionId={pane.key} />,
                            closable: pane.closable,
                        }))}
                        style={{ height: '100%' }}
                    />
                </div>
            </Layout>

            <style>{`
                .ant-tabs-content, .ant-tabs-content-holder, .ant-tabs-tabpane {
                    height: 100%;
                }
            `}</style>
        </div>
    );
};

export default TerminalPage;
