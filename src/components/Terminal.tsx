/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\Terminal.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { listen } from '@tauri-apps/api/event';
import { Button, Tooltip, Space, theme as antdTheme, Select, Input, Dropdown, Modal } from 'antd';
import { 
  ClearOutlined, 
  ReloadOutlined, 
  BranchesOutlined
} from '@ant-design/icons';
import '@xterm/xterm/css/xterm.css';
import { ptyOpen, ptyWrite, ptyResize, ptyClose } from '../lib/tauri';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import { useTranslation } from 'react-i18next';

// Module-level lock to prevent double initialization in Strict Mode
let isPtyInitializing = false;

const TerminalUI = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const { token } = antdTheme.useToken();
  const { t } = useTranslation();
  
  const { 
    terminalFontFamily, 
    terminalFontSize, 
    terminalForeground,
    terminalCursorStyle,
    pendingCommand,
    setPendingCommand,
    setTerminalSettings,
    terminalBackground
  } = useAppStore();

  const terminalPresets = [
    { name: 'Default Dark', bg: '#1e1e1e', fg: '#d4d4d4' },
    { name: 'One Dark', bg: '#282c34', fg: '#abb2bf' },
    { name: 'Dracula', bg: '#282a36', fg: '#f8f8f2' },
    { name: 'Monokai', bg: '#272822', fg: '#f8f8f2' },
    { name: 'Nord', bg: '#2e3440', fg: '#d8dee9' },
    { name: 'Solarized Dark', bg: '#002b36', fg: '#839496' }
  ];

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cursorBlink: true,
      fontFamily: terminalFontFamily,
      fontSize: terminalFontSize,
      theme: {
        background: terminalBackground,
        foreground: terminalForeground,
        selectionBackground: token.colorPrimaryBg,
        cursor: token.colorPrimary
      },
      cursorStyle: terminalCursorStyle as any,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current);
    fitAddon.fit();
    xtermRef.current = term;

    let unlisten: () => void;

    const initPty = async () => {
      // 1. Register data listener first so we don't miss the initial prompt
      const unlistenFn = await listen<number[]>('pty-data', (event) => {
        term.write(new Uint8Array(event.payload));
      });
      unlisten = unlistenFn;

      // 2. Bind terminal input to PTY write
      term.onData((data) => {
        ptyWrite(data);
      });

      // 3. Fit dimensions FIRST to ensure we know the correct size
      fitAddon.fit();
      const initialCols = term.cols;
      const initialRows = term.rows;

      // 5. Initialize PTY session
      try {
        // Wait loop: if locked, poll until free
        while (isPtyInitializing) {
            await new Promise(resolve => setTimeout(resolve, 50));
        }

        // Acquire lock immediately to block other effects
        isPtyInitializing = true;

        let exists = false;
        try {
             exists = await invoke<boolean>('pty_exists');
             
             if (exists) {
                 // If PTY exists, just resize and attach.
                 await ptyResize(initialCols, initialRows);
                 setIsReady(true);
             } else {
                 // Print UI banner only for new sessions
                 term.write(`\x1b[1;34mOpenVizUI Terminal\x1b[0m \r\n`);
                 term.write(`\x1b[2mType 'help' to see available commands or 'exit' to close.\x1b[0m\r\n\r\n`);
    
                 // await ptyClose();
                 await ptyOpen(initialCols, initialRows);
                 
                 setTimeout(() => {
                      term.focus();
                      setIsReady(true); 
                 }, 100);
             }
        } finally {
             isPtyInitializing = false;
        }

      } catch (e) {
        isPtyInitializing = false;
        console.error('PTY Open failed', e);
        term.write(`\r\n\x1b[1;31mError: Failed to open terminal session.\x1b[0m\r\n`);
        return () => unlisten();
      }

      const handleResize = () => {
        try {
            fitAddon.fit();
            if (term.cols > 0 && term.rows > 0) {
                ptyResize(term.cols, term.rows);
            }
        } catch (e) {
            console.error("Failed to fit terminal:", e);
        }
      };

      // Use ResizeObserver instead of window.resize
      const resizeObserver = new ResizeObserver(() => {
          // Debounce slightly or just call
          // For terminal resize, immediate is usually fine, but requestAnimationFrame helps perf
          requestAnimationFrame(handleResize);
      });
      
      if (terminalRef.current) {
          resizeObserver.observe(terminalRef.current);
      }

      // window.addEventListener('resize', handleResize); // Removed in favor of ResizeObserver
      
      return () => {
        resizeObserver.disconnect();
        unlisten();
      };
    };

    initPty();

    return () => {
      if (unlisten) unlisten();
      term.dispose();
      xtermRef.current = null;
      setIsReady(false);
    };
  }, [terminalFontFamily, terminalFontSize, terminalBackground, terminalForeground, terminalCursorStyle, token]);

  const [availableFonts, setAvailableFonts] = useState<string[]>([
       'Cascadia Code', 
       'Fira Code', 
       'JetBrains Mono', 
       'Source Code Pro', 
       'MesloLGS NF', 
       'Maple Mono', 
       'Consolas', 
       'Courier New'
  ]);

  useEffect(() => {
     invoke<string[]>('get_system_fonts').then(fonts => {
         if (fonts && fonts.length > 0) { 
             const codingFonts = fonts.filter(f => {
                 const low = f.toLowerCase();
                 return low.includes('code') || low.includes('mono') || low.includes('console') || low.includes('terminal') || low.includes('meslo') || low.includes('hack');
             });
             
             // Merge with defaults
             const combined = Array.from(new Set([...availableFonts, ...codingFonts])).sort();
             setAvailableFonts(combined);
         }
     }).catch(console.error);
  }, []);

  // Handle pending commands (e.g. from "Launch in Terminal" or Tool Switch)
  useEffect(() => {
    const handleCommand = async () => {
        if (pendingCommand && xtermRef.current && isReady) {
            try {
                // 1. Close existing session to kill any running process
                await ptyClose();
                
                // 2. Clear terminal visually
                xtermRef.current.clear();
                xtermRef.current.write('\x1b[2J\x1b[H');
                
                // 3. Start fresh session
                const cols = xtermRef.current.cols;
                const rows = xtermRef.current.rows;
                await ptyOpen(cols, rows);
                
                // 4. Execute new command after brief pause for shell init
                setTimeout(() => {
                    ptyWrite(`${pendingCommand}\r`);
                    setPendingCommand(null);
                    xtermRef.current?.focus();
                }, 200);
            } catch (e) {
                console.error("Failed to restart terminal session", e);
            }
        }
    };

    if (pendingCommand) {
        handleCommand();
    }
  }, [pendingCommand, isReady, setPendingCommand]);


  const handleClear = () => {
    xtermRef.current?.clear();
    xtermRef.current?.focus();
  };


  const handleRestart = () => {
    window.location.reload();
  };

  const focusTerminal = () => {
      xtermRef.current?.focus();
  };


  const [gitInputModal, setGitInputModal] = useState({
      open: false,
      title: '',
      label: '',
      value: '',
      commandTemplate: ''
  });

  return (
    <div 
      style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100%', 
      background: terminalBackground,
      borderRadius: '8px',
      overflow: 'hidden',
      border: `1px solid ${token.colorBorderSecondary}`,
      cursor: 'text'
    }}
    onClick={focusTerminal}
    >
      <div style={{ 
        padding: '6px 12px', 
        background: token.colorBgContainer, 
        borderBottom: `1px solid ${token.colorBorderSecondary}`,
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 40
      }}>
        <Space>
           <div onClick={(e) => e.stopPropagation()}>
             <Select
               value={
                  terminalPresets.find(p => p.bg === terminalBackground && p.fg === terminalForeground)?.name || 'Custom'
               }
               onChange={(val) => {
                  const p = terminalPresets.find(preset => preset.name === val);
                  if (p) {
                      setTerminalSettings({
                          terminalBackground: p.bg,
                          terminalForeground: p.fg
                      });
                  }
               }}
               variant="borderless"
               size="small"
               style={{ width: 140 }}
               options={terminalPresets.map(p => ({ value: p.name, label: p.name }))}
             />
           </div>
           
           <div onClick={(e) => e.stopPropagation()}>
             <Select
               value={terminalFontFamily}
               onChange={(val) => setTerminalSettings({ terminalFontFamily: val })}
               variant="borderless"
               size="small"
               style={{ width: 140 }}
               options={availableFonts.map(f => ({ value: f, label: f }))}
             />
           </div>

           <div onClick={(e) => e.stopPropagation()}>
              <Dropdown 
                  menu={{ 
                      items: [
                          {
                              key: 'git-config-user',
                              label: t('terminal.git.setUser'),
                              onClick: () => {
                                  setGitInputModal({
                                      open: true,
                                      title: t('terminal.git.modal.userName'),
                                      label: t('terminal.git.modal.labelName'),
                                      value: '',
                                      commandTemplate: 'git config --global user.name "{value}"'
                                  });
                              }
                          },
                          {
                              key: 'git-config-email',
                              label: t('terminal.git.setEmail'),
                              onClick: () => {
                                  setGitInputModal({
                                      open: true,
                                      title: t('terminal.git.modal.userEmail'),
                                      label: t('terminal.git.modal.labelEmail'),
                                      value: '',
                                      commandTemplate: 'git config --global user.email "{value}"'
                                  });
                              }
                          },
                          { type: 'divider' },
                          {
                              key: 'git-init',
                              label: t('terminal.git.init'),
                              onClick: () => {
                                  ptyWrite('git init\r');
                              }
                          },
                          {
                              key: 'git-remote',
                              label: t('terminal.git.addRemote'),
                              onClick: () => {
                                  setGitInputModal({
                                      open: true,
                                      title: t('terminal.git.modal.remote'),
                                      label: t('terminal.git.modal.labelUrl'),
                                      value: '',
                                      commandTemplate: 'git remote add origin {value}'
                                  });
                              }
                          },
                          { type: 'divider' },
                          {
                              key: 'git-add',
                              label: t('terminal.git.add'),
                              onClick: () => {
                                  ptyWrite('git add .\r');
                              }
                          },
                          {
                              key: 'git-commit',
                              label: t('terminal.git.commit'),
                              onClick: () => {
                                   setGitInputModal({
                                      open: true,
                                      title: t('terminal.git.modal.commit'),
                                      label: t('terminal.git.modal.labelMessage'),
                                      value: '',
                                      commandTemplate: 'git commit -m "{value}"'
                                  });
                              }
                          },
                          {
                              key: 'git-push',
                              label: t('terminal.git.push'),
                              onClick: () => {
                                  ptyWrite('git push -u origin master\r');
                              }
                          }
                      ]
                  }} 
                  trigger={['click']}
              >
                  <Button type="text" size="small" icon={<BranchesOutlined />}>{t('terminal.git.menu')}</Button>
              </Dropdown>
           </div>
        </Space>
        
        <Space>
          <Tooltip title={t('app.terminal.clear') || "Clear"}>
            <Button 
                type="text" 
                size="small" 
                icon={<ClearOutlined />} 
                onClick={handleClear} 
            />
          </Tooltip>
          <Tooltip title={t('app.terminal.restart') || "Restart Session"}>
            <Button 
                type="text" 
                size="small" 
                icon={<ReloadOutlined />} 
                onClick={handleRestart} 
            />
          </Tooltip>
        </Space>
      </div>
       <div 
        ref={terminalRef} 
        style={{ 
          flex: 1, 
          padding: '8px 4px 4px 12px', 
          overflow: 'hidden' 
        }} 
      />

      <Modal
          title={gitInputModal.title}
          open={gitInputModal.open}
          onOk={() => {
              if (gitInputModal.value) {
                  const cmd = gitInputModal.commandTemplate.replace('{value}', gitInputModal.value);
                  ptyWrite(cmd + '\r');
                  setGitInputModal({ ...gitInputModal, open: false, value: '' });
                  xtermRef.current?.focus();
              }
          }}
          onCancel={() => setGitInputModal({ ...gitInputModal, open: false })}
      >
          <div style={{ marginBottom: 8 }}>{gitInputModal.label}:</div>
          <Input 
              value={gitInputModal.value}
              onChange={(e) => setGitInputModal({ ...gitInputModal, value: e.target.value })}
              onPressEnter={() => {
                   if (gitInputModal.value) {
                      const cmd = gitInputModal.commandTemplate.replace('{value}', gitInputModal.value);
                      ptyWrite(cmd + '\r');
                      setGitInputModal({ ...gitInputModal, open: false, value: '' });
                      xtermRef.current?.focus();
                  }
              }}
              autoFocus
          />
      </Modal>
    </div>
  );
};

export default TerminalUI;
