/*
 * @Author: Anthony Rivera && opcnlin@gmail.com
 * @FilePath: \src\components\Logo.tsx
 * Copyright (c) 2026 OpenVizUI Contributors
 * Licensed under the MIT License
 */

import React from 'react';

interface LogoProps {
  collapsed?: boolean;
  theme?: 'light' | 'dark';
}

const Logo: React.FC<LogoProps> = ({ collapsed }) => {
  
  return (
    <div style={{ 
      height: 32, 
      margin: 16,
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {collapsed ? (
         // Collapsed Logo (Icon only)
         <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
            <rect width="32" height="32" rx="6" fill="#1677ff" />
            <text x="16" y="22" textAnchor="middle" fill="white" fontFamily="sans-serif" fontWeight="bold" fontSize="20">V</text>
         </svg>
      ) : (
         // Full Logo (Image)
         <img src="/openvizui.png" alt="OpenVizUI" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} />
      )}
    </div>
  );
};

export default Logo;
