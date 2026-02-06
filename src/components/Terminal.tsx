
import { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { listen } from '@tauri-apps/api/event';
import { Button, Tooltip, Space, theme as antdTheme, Select, Input, Dropdown, Modal } from 'antd';
import { 
  ClearOutlined, 
  ReloadOutlined, 
  SendOutlined, 
  BranchesOutlined
} from '@ant-design/icons';
import '@xterm/xterm/css/xterm.css';
import { ptyOpen, ptyWrite, ptyResize, ptyClose } from '../lib/tauri';
import { invoke } from '@tauri-apps/api/core';
import { useAppStore } from '../store/appStore';
import { useTranslation } from 'react-i18next';

const TerminalUI = () => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const { token } = antdTheme.useToken();
  useTranslation();
  
  const { 
    terminalFontFamily, 
    terminalFontSize, 
    terminalForeground,
    terminalCursorStyle,
    pendingCommand,
    setPendingCommand,
    setTerminalSettings,
    terminalBackground,
    chatInput,
    setChatInput
  } = useAppStore();

  const terminalPresets = [
    { name: 'Default Dark', bg: '#1e1e1e', fg: '#d4d4d4' },
    { name: 'One Dark', bg: '#282c34', fg: '#abb2bf' },
    { name: 'Dracula', bg: '#282a36', fg: '#f8f8f2' },
    { name: 'Monokai', bg: '#272822', fg: '#f8f8f2' },
    { name: 'Nord', bg: '#2e3440', fg: '#d8dee9' },
    { name: 'Solarized Dark', bg: '#002b36', fg: '#839496' }
  ];

  const [, setIsReady] = useState(false);

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
      // Backend now sends raw bytes (number[]) to avoid UTF-8 issues
      const unlistenFn = await listen<number[]>('pty-data', (event) => {
        // xterm.write supports Uint8Array
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

      // 4. Print UI banner
      term.write('\x1b[2J\x1b[H'); 
      term.write(`\x1b[1;34mOpenVizUI Terminal\x1b[0m \r\n`);
      term.write(`\x1b[2mType 'help' to see available commands or 'exit' to close.\x1b[0m\r\n\r\n`);

      // 5. Initialize PTY session
      try {
        await ptyClose(); // Clean up any existing session
        await ptyOpen(initialCols, initialRows);
        
        // Force a clear screen (Ctrl+L) to remove potential double prompts from shell startup
        setTimeout(() => {
             ptyWrite('\x0c'); 
             term.focus(); // Force focus on init
             setIsReady(true); // <--- Set readiness here
        }, 500);
        
      } catch (e) {
        console.error('PTY Open failed', e);
        term.write(`\r\n\x1b[1;31mError: Failed to open terminal session.\x1b[0m\r\n`);
        return () => unlisten();
      }

      const handleResize = () => {
        fitAddon.fit();
        if (term.cols > 0 && term.rows > 0) {
            ptyResize(term.cols, term.rows);
        }
      };

      window.addEventListener('resize', handleResize);
      
      return () => {
          window.removeEventListener('resize', handleResize);
          // Don't close PTY here to allow persistence, or close if you want ephemeral
          // ptyClose(); 
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

  // Handle pending commands (e.g. from "Launch in Terminal")
  useEffect(() => {
    if (pendingCommand && xtermRef.current) {
        // Wait a bit for shell to be ready if it's a fresh mount
        setTimeout(() => {
            ptyWrite(`${pendingCommand}\r`);
            setPendingCommand(null);
            xtermRef.current?.focus();
        }, 800);
    }
  }, [pendingCommand, setPendingCommand]);


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

  const handleInputSend = () => {
      if (!chatInput) return;
      ptyWrite(chatInput + '\r');
      setChatInput('');
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
                              label: 'Set User Name',
                              onClick: () => {
                                  setGitInputModal({
                                      open: true,
                                      title: 'Set Git User Name',
                                      label: 'Name',
                                      value: '',
                                      commandTemplate: 'git config --global user.name "{value}"'
                                  });
                              }
                          },
                          {
                              key: 'git-config-email',
                              label: 'Set User Email',
                              onClick: () => {
                                  setGitInputModal({
                                      open: true,
                                      title: 'Set Git User Email',
                                      label: 'Email',
                                      value: '',
                                      commandTemplate: 'git config --global user.email "{value}"'
                                  });
                              }
                          },
                          { type: 'divider' },
                          {
                              key: 'git-init',
                              label: 'Initialize Repository',
                              onClick: () => {
                                  ptyWrite('git init\r');
                              }
                          },
                          {
                              key: 'git-remote',
                              label: 'Add Remote Origin',
                              onClick: () => {
                                  setGitInputModal({
                                      open: true,
                                      title: 'Add Remote Origin',
                                      label: 'Repository URL',
                                      value: '',
                                      commandTemplate: 'git remote add origin {value}'
                                  });
                              }
                          },
                          { type: 'divider' },
                          {
                              key: 'git-add',
                              label: 'Add All (git add .)',
                              onClick: () => {
                                  ptyWrite('git add .\r');
                              }
                          },
                          {
                              key: 'git-commit',
                              label: 'Commit',
                              onClick: () => {
                                   setGitInputModal({
                                      open: true,
                                      title: 'Git Commit',
                                      label: 'Commit Message',
                                      value: '',
                                      commandTemplate: 'git commit -m "{value}"'
                                  });
                              }
                          },
                          {
                              key: 'git-push',
                              label: 'Push (origin master)',
                              onClick: () => {
                                  ptyWrite('git push -u origin master\r');
                              }
                          }
                      ]
                  }} 
                  trigger={['click']}
              >
                  <Button type="text" size="small" icon={<BranchesOutlined />}>Git Operations</Button>
              </Dropdown>
           </div>
        </Space>
        
        <Space>
          <Tooltip title="Clear">
            <Button 
                type="text" 
                size="small" 
                icon={<ClearOutlined />} 
                onClick={handleClear} 
            />
          </Tooltip>
          <Tooltip title="Restart Session">
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
      <div onClick={(e) => e.stopPropagation()} style={{ padding: '12px', borderTop: `1px solid ${token.colorBorderSecondary}20`, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <Input.TextArea
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleInputSend();
                  }
              }}
              placeholder="Type a message... (Shift+Enter for new line)"
              variant="filled"
              autoSize={{ minRows: 2, maxRows: 6 }} 
              style={{ 
                  background: `${terminalForeground}15`, 
                  color: terminalForeground,
                  border: 'none',
                  flex: 1,
                  resize: 'none'
              }}
          />
          <Button 
              type="primary" 
              icon={<SendOutlined />} 
              onClick={handleInputSend}
              style={{ flexShrink: 0 }}
          />
      </div>

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
