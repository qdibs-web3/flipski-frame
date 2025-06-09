import React, { createContext, useContext, useState, useEffect } from "react";
import { useAccount, useConnect as useWagmiConnect, useDisconnect as useWagmiDisconnect } from 'wagmi';
import { useEnhancedWallet } from './EnhancedWalletProvider';

const WalletContext = createContext({
  walletAddress: null,
  connectWallet: async () => {},
  disconnectWallet: async () => {},
  connectionStatus: "unknown",
  isConnecting: false,
  isConnected: false,
  userRelatedIsLoading: false,
  userRelatedError: null,
  activeWalletInstance: null,
});

export const WalletProvider = ({ children }) => {
  const { isMiniApp } = useEnhancedWallet();
  
  // Wagmi hooks (always available, CSP-safe)
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { connect: wagmiConnect, connectors, isPending: wagmiIsConnecting, error: wagmiConnectError } = useWagmiConnect();
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect();
  
  const [isConnectActionLoading, setIsConnectActionLoading] = useState(false);

  // Use only Wagmi values (no ThirdWeb to avoid CSP violations)
  const address = wagmiAddress;
  const isConnecting = wagmiIsConnecting || isConnectActionLoading;
  const isConnected = wagmiIsConnected;
  const connectError = wagmiConnectError;
  const userError = null; // No ThirdWeb user errors
  const signer = null; // No ThirdWeb signer
  const isLoadingUser = false; // No ThirdWeb user loading

  const userRelatedError = userError || connectError;
  const calculatedIsConnected = isConnected;

  // Debug logging for wallet connection state
  useEffect(() => {
    console.log('WalletProvider state:', {
      isMiniApp,
      wagmiAddress,
      wagmiIsConnected,
      finalAddress: address,
      finalIsConnected: calculatedIsConnected,
      connectors: connectors.length
    });
  }, [isMiniApp, wagmiAddress, wagmiIsConnected, address, calculatedIsConnected, connectors.length]);

  // Auto-connect in Mini App environment
  useEffect(() => {
    if (isMiniApp && connectors.length > 0 && !wagmiIsConnected && !wagmiIsConnecting) {
      console.log('Auto-connecting to mini app wallet...');
      wagmiConnect({ connector: connectors[0] });
    }
  }, [isMiniApp, connectors, wagmiIsConnected, wagmiIsConnecting, wagmiConnect]);

  const connectWallet = async () => {
    setIsConnectActionLoading(true);
    try {
      // Always use Wagmi (CSP-safe)
      if (connectors.length > 0) {
        await wagmiConnect({ connector: connectors[0] });
      } else {
        console.warn('No wallet connectors available');
      }
    } catch (err) {
      console.error("WalletProvider: Error during connect wallet action:", err);
    } finally {
      setIsConnectActionLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      await wagmiDisconnect();
    } catch (err) {
      console.error("WalletProvider: Error disconnecting wallet:", err);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress: address || null,
        connectWallet,
        disconnectWallet,
        connectionStatus: wagmiIsConnected ? "connected" : "disconnected",
        isConnecting,
        isConnected: calculatedIsConnected,
        userRelatedIsLoading: isLoadingUser,
        userRelatedError,
        activeWalletInstance: signer || null,
        isMiniApp,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);

