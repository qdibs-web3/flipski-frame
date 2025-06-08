import React, { createContext, useContext, useState, useEffect } from "react";
import {
  useConnect,
  useDisconnect,
  useAddress,
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
  const thirdwebConnect = useConnect();
  const { disconnect: thirdwebDisconnect } = useDisconnect();
  const thirdwebConnectionStatus = useConnectionStatus();
  const thirdwebSigner = useSigner();
  
  // Remove the problematic useUser hook for now
  const thirdwebIsLoadingUser = false;
  const thirdwebErrorUser = null;
  
  // Wagmi hooks for Mini App
  const { address: wagmiAddress, isConnected: wagmiIsConnected } = useAccount();
  const { connect: wagmiConnect, connectors, isPending: wagmiIsConnecting, error: wagmiConnectError } = useWagmiConnect();
  const { disconnect: wagmiDisconnect } = useWagmiDisconnect();
  
  const [isConnectActionLoading, setIsConnectActionLoading] = useState(false);

  // Determine which values to use based on environment
  const address = isMiniApp ? wagmiAddress : thirdwebAddress;
  const isConnecting = isMiniApp ? wagmiIsConnecting : (thirdwebConnect.isConnecting || isConnectActionLoading);
  const isConnected = isMiniApp ? wagmiIsConnected : (thirdwebConnectionStatus === "connected" || !!thirdwebAddress);
  const connectError = isMiniApp ? wagmiConnectError : thirdwebConnect.error;
  const userError = isMiniApp ? null : thirdwebErrorUser;
  const signer = isMiniApp ? null : thirdwebSigner;
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
        // ThirdWeb connect - just call the connect function directly
        await thirdwebConnect.connect();
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
        isMiniApp,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => useContext(WalletContext);

