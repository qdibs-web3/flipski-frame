// src/components/MiniAppWrapper.jsx
import React from 'react';
import { useEnhancedWallet } from '../context/EnhancedWalletProvider';
import '../styles/MiniApp.css';

const MiniAppWrapper = ({ children }) => {
  const { isMiniApp } = useEnhancedWallet();

  if (isMiniApp) {
    // In Mini App context, apply frame-specific styling and behavior
    return (
      <div className="mini-app-container" style={{
        minHeight: '100vh',
        backgroundColor: '#1a1a1a',
        color: 'white',
        padding: '0',
        margin: '0',
        // Remove any fixed positioning that might not work in frames
        position: 'relative',
        // Ensure touch-friendly interface
        touchAction: 'manipulation',
        // Optimize for mobile viewport
        maxWidth: '100vw',
        overflow: 'auto',
        // Remove debug border
        // border: '2px solid #00ff00' // Removed debug border
      }}>
        {/* Simplified header for mini app */}
        <div className="frame-header" style={{
          padding: '15px',
          borderBottom: '1px solid #333',
          textAlign: 'center',
          fontSize: '20px',
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
        }}>
          🎲 FLIPSKI
        </div>
        
        <div className="frame-content" style={{
          padding: '20px',
          paddingBottom: '60px', // Extra space for frame UI
          minHeight: '400px' // Ensure minimum height
        }}>
          {children}
        </div>
      </div>
    );
  }

  // In web context, render normally
  return <>{children}</>;
};

export default MiniAppWrapper;

