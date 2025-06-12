import React from 'react';
import { useEnhancedWallet } from '../context/EnhancedWalletProvider';

export const MobileDebugger = () => {
  const { isMiniApp, isLoading, debugInfo } = useEnhancedWallet();
  
  // Only show on mobile/mini app or if there's debug info
  if (!isMiniApp && (!debugInfo || debugInfo.length === 0)) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      color: '#00ff00',
      padding: '8px',
      fontSize: '11px',
      zIndex: 9999,
      maxHeight: '250px',
      overflow: 'auto',
      fontFamily: 'monospace',
      borderBottom: '2px solid #00ff00'
    }}>
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '8px',
        color: '#ffff00',
        textAlign: 'center'
      }}>
        🔧 MOBILE DEBUG CONSOLE 🔧
      </div>
      
      <div style={{ marginBottom: '8px', fontSize: '10px' }}>
        <span style={{ color: '#ff6600' }}>Status:</span> 
        <span style={{ color: isMiniApp ? '#00ff00' : '#ff0000' }}>
          {isMiniApp ? '📱 Mini App' : '🌐 Browser'}
        </span>
        {' | '}
        <span style={{ color: '#ff6600' }}>Loading:</span>
        <span style={{ color: isLoading ? '#ffff00' : '#00ff00' }}>
          {isLoading ? '⏳ Yes' : '✅ No'}
        </span>
      </div>
      
      <div style={{ 
        borderTop: '1px solid #333',
        paddingTop: '5px',
        maxHeight: '180px',
        overflow: 'auto'
      }}>
        {debugInfo && debugInfo.length > 0 ? (
          debugInfo.map((info, index) => (
            <div key={index} style={{ 
              marginBottom: '2px',
              fontSize: '10px',
              wordBreak: 'break-word'
            }}>
              {info}
            </div>
          ))
        ) : (
          <div style={{ color: '#888' }}>No debug info available</div>
        )}
      </div>
      
      <div style={{ 
        marginTop: '5px',
        fontSize: '9px',
        color: '#888',
        textAlign: 'center'
      }}>
        Tap to scroll • This will help debug mobile issues
      </div>
    </div>
  );
};

