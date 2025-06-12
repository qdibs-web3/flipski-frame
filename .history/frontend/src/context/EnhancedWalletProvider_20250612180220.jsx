import React, { createContext, useContext, useEffect, useState } from 'react';
import { useMiniApp } from '../hooks/useMiniApp';

const EnhancedWalletContext = createContext();

export const useEnhancedWallet = () => {
  const context = useContext(EnhancedWalletContext);
  if (!context) {
    throw new Error('useEnhancedWallet must be used within an EnhancedWalletProvider');
  }
  return context;
};

export const EnhancedWalletProvider = ({ children }) => {
  const { isMiniApp, isLoading, context, isSDKLoaded } = useMiniApp();
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [sdk, setSdk] = useState(null);

  // Load SDK after mini app is initialized
  useEffect(() => {
    if (isMiniApp && isSDKLoaded) {
      const loadSDK = async () => {
        try {
          const { sdk: farcasterSDK } = await import('@farcaster/frame-sdk');
          setSdk(farcasterSDK);
          console.log('SDK loaded in wallet provider');
        } catch (error) {
          console.error('Failed to load SDK in wallet provider:', error);
        }
      };
      loadSDK();
    }
  }, [isMiniApp, isSDKLoaded]);

  // Connect wallet function
  const connectWallet = async () => {
    if (!sdk) {
      console.error('SDK not loaded');
      return null;
    }

    try {
      console.log('Connecting wallet...');
      const provider = await sdk.wallet.getEthereumProvider();
      
      if (!provider) {
        console.error('No ethereum provider available');
        return null;
      }

      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        setWalletAddress(address);
        setIsConnected(true);
        console.log('Wallet connected:', address);
        return address;
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
    return null;
  };

  // Disconnect wallet function
  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsConnected(false);
    console.log('Wallet disconnected');
  };

  // Get current wallet address
  const getCurrentWalletAddress = async () => {
    if (!sdk || !isConnected) return null;

    try {
      const provider = await sdk.wallet.getEthereumProvider();
      if (!provider) return null;

      const accounts = await provider.request({
        method: 'eth_accounts',
      });

      return accounts && accounts.length > 0 ? accounts[0] : null;
    } catch (error) {
      console.error('Failed to get current wallet address:', error);
      return null;
    }
  };

  const value = {
    // Mini app state
    isMiniApp,
    isLoading,
    context,
    isSDKLoaded,
    sdk,
    
    // Wallet state
    walletAddress,
    isConnected,
    
    // Wallet functions
    connectWallet,
    disconnectWallet,
    getCurrentWalletAddress,
  };

  return (
    <EnhancedWalletContext.Provider value={value}>
      {children}
    </EnhancedWalletContext.Provider>
  );
};

