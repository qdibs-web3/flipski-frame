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
        overflow: 'hidden'
      }}>
        {/* Add frame-specific header if needed */}
        <div className="frame-header" style={{
          padding: '10px',
          borderBottom: '1px solid #333',
          textAlign: 'center',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          🎲 FLIPSKI - Coin Flip Game
        </div>
        
        <div className="frame-content" style={{
          padding: '20px',
          paddingBottom: '60px' // Extra space for frame UI
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

