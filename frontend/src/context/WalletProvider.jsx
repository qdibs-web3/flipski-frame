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
  
  // ThirdWeb hooks for traditional web
  const thirdwebAddress = useAddress();
  const { connect: thirdwebConnect, isConnecting: thirdwebIsConnecting, error: thirdwebConnectError } = useConnect();
  const { disconnect: thirdwebDisconnect } = useDisconnect();
  const thirdwebConnectionStatus = useConnectionStatus();
  const thirdwebSigner = useSigner();
  const { isLoading: thirdwebIsLoadingUser, error: thirdwebErrorUser } = useUser();
  
  // Wagmi hooks for Mini App
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { connect: wagmiConnect, connectors, isPending: wagmiIsConnecting, error: wagmiConnectError } = useWagmiConnect();
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect();
  
  const [isConnectActionLoading, setIsConnectActionLoading] = useState(false);

  // Determine which values to use based on environment
  const address = isMiniApp ? wagmiAddress : thirdwebAddress;
  const isConnecting = isMiniApp ? wagmiIsConnecting : (thirdwebIsConnecting || isConnectActionLoading);
  const isConnected = isMiniApp ? wagmiIsConnected : (thirdwebConnectionStatus === "connected" || !!thirdwebAddress);
  const connectError = isMiniApp ? wagmiConnectError : thirdwebConnectError;
  const userError = isMiniApp ? null : thirdwebErrorUser;
  const signer = isMiniApp ? null : thirdwebSigner; // Mini App uses different signing approach
  const isLoadingUser = isMiniApp ? false : thirdwebIsLoadingUser;

  const userRelatedError = userError || connectError;
  const calculatedIsConnected = isConnected;

  // Auto-connect in Mini App environment
  useEffect(() => {
    if (isMiniApp && connectors.length > 0 && !wagmiIsConnected && !wagmiIsConnecting) {
      // Auto-connect to Mini App wallet
      wagmiConnect({ connector: connectors[0] });
    }
  }, [isMiniApp, connectors, wagmiIsConnected, wagmiIsConnecting, wagmiConnect]);

  const connectWallet = async () => {
    setIsConnectActionLoading(true);
    try {
      if (isMiniApp) {
        if (connectors.length > 0) {
          await wagmiConnect({ connector: connectors[0] });
        }
      } else {
        await thirdwebConnect();
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
        await thirdwebDisconnect();
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
        isMiniApp, // Add this for components that need to know the environment
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);