import React, { createContext, useContext, useState, useEffect } from "react";
import {
  useConnect,
  useDisconnect,
  useAddress,
  useUser,
  useConnectionStatus,
  useSigner,
} from "@thirdweb-dev/react";
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
  
  // ThirdWeb hooks for traditional web (only used when NOT in mini app)
  const thirdwebAddress = isMiniApp ? null : useAddress();
  const { connect: thirdwebConnect, isConnecting: thirdwebIsConnecting, error: thirdwebConnectError } = isMiniApp ? { connect: null, isConnecting: false, error: null } : useConnect();
  const { disconnect: thirdwebDisconnect } = isMiniApp ? { disconnect: null } : useDisconnect();
  const thirdwebConnectionStatus = isMiniApp ? "disconnected" : useConnectionStatus();
  const thirdwebSigner = isMiniApp ? null : useSigner();
  const { isLoading: thirdwebIsLoadingUser, error: thirdwebErrorUser } = isMiniApp ? { isLoading: false, error: null } : useUser();
  
  // Wagmi hooks for Mini App (always available)
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { connect: wagmiConnect, connectors, isPending: wagmiIsConnecting, error: wagmiConnectError } = useWagmiConnect();
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect();
  
  const [isConnectActionLoading, setIsConnectActionLoading] = useState(false);

  // Determine which values to use based on environment
  const address = isMiniApp ? wagmiAddress : (thirdwebAddress || wagmiAddress);
  const isConnecting = isMiniApp ? wagmiIsConnecting : (thirdwebIsConnecting || isConnectActionLoading || wagmiIsConnecting);
  const isConnected = isMiniApp ? wagmiIsConnected : (thirdwebConnectionStatus === "connected" || !!thirdwebAddress || wagmiIsConnected);
  const connectError = isMiniApp ? wagmiConnectError : (thirdwebConnectError || wagmiConnectError);
  const userError = isMiniApp ? null : thirdwebErrorUser;
  const signer = isMiniApp ? null : thirdwebSigner;
  const isLoadingUser = isMiniApp ? false : thirdwebIsLoadingUser;

  const userRelatedError = userError || connectError;
  const calculatedIsConnected = isConnected;

  // Debug logging for wallet connection state
  useEffect(() => {
    console.log('WalletProvider state:', {
      isMiniApp,
      wagmiAddress,
      wagmiIsConnected,
      thirdwebAddress,
      thirdwebConnectionStatus,
      finalAddress: address,
      finalIsConnected: calculatedIsConnected,
      connectors: connectors.length
    });
  }, [isMiniApp, wagmiAddress, wagmiIsConnected, thirdwebAddress, thirdwebConnectionStatus, address, calculatedIsConnected, connectors.length]);

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
      if (isMiniApp) {
        // Mini app: use Wagmi only
        if (connectors.length > 0) {
          await wagmiConnect({ connector: connectors[0] });
        } else {
          console.warn('No wallet connectors available for mini app');
        }
      } else {
        // Web: try ThirdWeb first, fallback to Wagmi
        try {
          if (thirdwebConnect) {
            await thirdwebConnect();
          } else {
            throw new Error('ThirdWeb not available');
          }
        } catch (thirdwebError) {
          console.warn('ThirdWeb connection failed, trying Wagmi:', thirdwebError);
          if (connectors.length > 0) {
            await wagmiConnect({ connector: connectors[0] });
          }
        }
      }
    } catch (err) {
      console.error("WalletProvider: Error during connect wallet action:", err);
    } finally {
      setIsConnectActionLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (isMiniApp) {
        await wagmiDisconnect();
      } else {
        // Disconnect from both providers in web environment
        if (thirdwebDisconnect) {
          await thirdwebDisconnect();
        }
        if (wagmiIsConnected) {
          await wagmiDisconnect();
        }
      }
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
        connectionStatus: isMiniApp ? (wagmiIsConnected ? "connected" : "disconnected") : thirdwebConnectionStatus,
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

