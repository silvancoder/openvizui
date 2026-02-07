/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\TitleBar.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { 
  MinusOutlined, 
  BorderOutlined, 
  CloseOutlined, 
  BlockOutlined 
} from "@ant-design/icons";
import { theme } from "antd";
import { useAppStore } from "../store/appStore";

const TitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(false);
  const { theme: appTheme } = useAppStore();
  const { token } = theme.useToken();
  const appWindow = getCurrentWindow();

  useEffect(() => {
    const checkMaximized = async () => {
      setIsMaximized(await appWindow.isMaximized());
    };
    
    // Initial check
    checkMaximized();

    // Tauri v2 might have better event listeners for this.
    const unlisten = appWindow.listen('tauri://resize', checkMaximized);

    return () => {
        unlisten.then(f => f());
    };
  }, []);

  const handleMinimize = () => appWindow.minimize();
  const handleMaximize = async () => {
    await appWindow.toggleMaximize();
    setIsMaximized(await appWindow.isMaximized());
  };
  const handleClose = () => appWindow.close();

  const isDark = appTheme === 'dark';
  const bg = token.colorBgContainer;
  const fg = token.colorText;
  const hoverBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
  const closeHoverBg = '#e81123';

  return (
    <div
      data-tauri-drag-region
      style={{
        height: "32px",
        background: bg,
        color: fg,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingLeft: "12px",
        userSelect: "none",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        borderBottom: `1px solid ${token.colorBorderSecondary}20` // Subtle border
      }}
    >
      {/* Title / Icon Area */}
      <div 
        data-tauri-drag-region 
        style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            fontSize: "12px",
            fontWeight: 500
        }}
      >
        <img src="/logo.png" alt="Logo" style={{ height: "16px", pointerEvents: "none" }} onError={(e) => e.currentTarget.style.display = 'none'} />
        <span data-tauri-drag-region>OpenVizUI</span>
      </div>

      {/* Window Controls */}
      <div style={{ display: "flex", height: "100%" }}>
        <TitleButton onClick={handleMinimize} hoverBg={hoverBg}>
          <MinusOutlined />
        </TitleButton>
        <TitleButton onClick={handleMaximize} hoverBg={hoverBg}>
          {isMaximized ? <BlockOutlined /> : <BorderOutlined />}
        </TitleButton>
        <TitleButton onClick={handleClose} hoverBg={closeHoverBg} hoverColor="white">
          <CloseOutlined />
        </TitleButton>
      </div>
    </div>
  );
};

const TitleButton = ({ children, onClick, hoverBg, hoverColor }: any) => {
  const [hover, setHover] = useState(false);
  
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: "46px",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        cursor: "default",
        background: hover ? hoverBg : "transparent",
        color: hover && hoverColor ? hoverColor : "inherit",
        transition: "background 0.2s"
      }}
    >
      {children}
    </div>
  );
};

export default TitleBar;
