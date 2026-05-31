import React, { useState, useEffect } from 'react';
import { Layout, theme } from 'antd';

const { Sider } = Layout;

interface ResizableSiderProps {
    width: number;
    setWidth: (width: number) => void;
    placement?: 'left' | 'right';
    minWidth?: number;
    maxWidth?: number;
    children: React.ReactNode;
    style?: React.CSSProperties;
}

const ResizableSider: React.FC<ResizableSiderProps> = ({
    width,
    setWidth,
    placement = 'left',
    minWidth = 200,
    maxWidth = 600,
    children,
    style
}) => {
    const [isResizing, setIsResizing] = useState(false);
    const { token } = theme.useToken();

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            if (placement === 'left') {
                const newWidth = Math.max(minWidth, Math.min(maxWidth, e.clientX));
                setWidth(newWidth);
            } else {
                const newWidth = Math.max(minWidth, Math.min(maxWidth, window.innerWidth - e.clientX));
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = 'default';
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, placement, setWidth, minWidth, maxWidth]);

    return (
        <>
            <Sider
                width={width}
                style={{
                    background: token.colorBgContainer,
                    borderRadius: '8px',
                    border: `1px solid ${token.colorBorderSecondary}`,
                    [placement === 'left' ? 'marginRight' : 'marginLeft']: 16,
                    padding: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    height: '100%',
                    ...style
                }}
            >
                {/* Resize Handle */}
                <div
                    style={{
                        position: 'absolute',
                        [placement === 'left' ? 'right' : 'left']: -8,
                        top: 0,
                        bottom: 0,
                        width: 10,
                        cursor: 'col-resize',
                        zIndex: 20,
                    }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                    }}
                />
                
                {children}
            </Sider>

            {/* Resize Overlay */}
            {isResizing && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 9999,
                        cursor: 'col-resize',
                        userSelect: 'none'
                    }}
                />
            )}
        </>
    );
};

export default ResizableSider;
