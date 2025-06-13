// Enhanced MobileDebugger with forced visibility on mobile
import React from 'react';
import { useEnhancedWallet } from '../context/EnhancedWalletProvider';

const MobileDebugger = () => {
  const { isMiniApp, isLoading, debugInfo } = useEnhancedWallet();

  // MOBILE FIX: Force visibility on mobile mini apps
  const shouldShow = isMiniApp || (debugInfo && debugInfo.length > 0);
  
  if (!shouldShow) return null;

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
      zIndex: 99999, // MOBILE FIX: Higher z-index
      maxHeight: '300px',
      overflow: 'auto',
      fontFamily: 'monospace',
      borderBottom: '2px solid #00ff00',
      // MOBILE FIX: Ensure visibility on mobile WebView
      WebkitTransform: 'translateZ(0)', // Force hardware acceleration
      transform: 'translateZ(0)',
      willChange: 'transform' // Optimize for mobile
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
      
      {/* MOBILE FIX: Add current location info */}
      <div style={{ marginBottom: '8px', fontSize: '10px' }}>
        <span style={{ color: '#ff6600' }}>Location:</span>
        <span style={{ color: '#00ffff' }}>
          {window.location.pathname}
        </span>
      </div>
      
      <div style={{
        borderTop: '1px solid #333',
        paddingTop: '5px',
        maxHeight: '200px',
        overflow: 'auto'
      }}>
        {debugInfo && debugInfo.length > 0 ? (
          debugInfo.map((info, index) => (
            <div key={index} style={{
              marginBottom: '2px',
              fontSize: '10px',
              wordBreak: 'break-word',
              lineHeight: '1.2'
            }}>
              {info}
            </div>
          ))
        ) : (
          <div style={{ color: '#888' }}>No debug info available</div>
        )}
        
        {/* MOBILE FIX: Add real-time status */}
        <div style={{ 
          marginTop: '5px', 
          fontSize: '9px', 
          color: '#888',
          borderTop: '1px solid #333',
          paddingTop: '3px'
        }}>
          Real-time: {new Date().toLocaleTimeString()}
        </div>
      </div>
      
      <div style={{
        marginTop: '5px',
        fontSize: '9px',
        color: '#888',
        textAlign: 'center'
      }}>
        Mobile-Enhanced Debug • Force Visible
      </div>
    </div>
  );
};

export default MobileDebugger;

