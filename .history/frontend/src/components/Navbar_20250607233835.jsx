// src/components/Navbar.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedWallet } from '../context/EnhancedWalletProvider';
import { useWallet } from '../context/WalletProvider';
import '../styles/Navbar.css';

const Navbar = () => {
  const navigate = useNavigate();
  const { isMiniApp } = useEnhancedWallet();
  const { walletAddress, connectWallet, disconnectWallet, isConnecting, isConnected } = useWallet();

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleWalletAction = () => {
    if (isConnected) {
      disconnectWallet();
    } else {
      connectWallet();
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <nav className="navbar">
      <div className="dropdown">
        <button className="logo dropbtn">FLIPSKI</button>
        <div className="dropdown-content">
          <span onClick={() => handleNavigate('/')}>Home</span>
          <span onClick={() => handleNavigate('/flipski-coin')}>$FLIPSKI</span>
          <span onClick={() => handleNavigate('/flipski')}>Play FLIPSKI</span>
        </div>
      </div>

      <div className="wallet-section">
        {isMiniApp ? (
          // In Mini App, wallet connection is handled by Farcaster
          <div className="mini-app-wallet">
            <span className="wallet-status">🔗 Farcaster Wallet</span>
          </div>
        ) : (
          // In web app, use custom wallet button
          <button 
            onClick={handleWalletAction}
            disabled={isConnecting}
            className="connect-wallet-btn"
            style={{
              background: isConnected ? '#4CAF50' : '#667eea',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: isConnecting ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {isConnecting ? 'Connecting...' : 
             isConnected ? `Connected: ${formatAddress(walletAddress)}` : 
             'Connect Wallet'}
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

