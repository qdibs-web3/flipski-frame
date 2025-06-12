import React, { createContext, useContext, useState, useEffect } from "react";
import { ThirdwebProvider } from "@thirdweb-dev/react";
import { Base } from "@thirdweb-dev/chains";
import { createConfig, WagmiProvider } from 'wagmi';
import { base } from 'wagmi/chains';
import { http } from 'viem';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { farcasterFrame as miniAppConnector } from '@farcaster/frame-wagmi-connector';
import { useMiniApp } from '../hooks/useMiniApp';
import { WalletProvider as OriginalWalletProvider } from './WalletProvider';

// Create QueryClient for Wagmi
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// Create Wagmi config for Mini App (CSP-safe)
const createMiniAppConfig = () => {
  return createConfig({
    chains: [base],
    transports: {
      [base.id]: http(),
    },
    connectors: [miniAppConnector()],
  });
};

// Create Wagmi config for Web (minimal to avoid CSP issues)
const createWebConfig = () => {
  return createConfig({
    chains: [base],
    transports: {
      [base.id]: http(),
    },
    connectors: [
      // Only Farcaster connector to avoid CSP violations
      miniAppConnector(),
    ],
  });
};

const EnhancedWalletContext = createContext({
  isMiniApp: false,
  isLoading: true,
  walletConfig: null,
});

export const EnhancedWalletProvider = ({ children }) => {
  const { isMiniApp, isLoading, error, callReady, isReady, debugInfo } = useMiniApp();
  const [walletConfig, setWalletConfig] = useState(null);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const config = isMiniApp ? createMiniAppConfig() : createWebConfig();
      setWalletConfig(config);
      console.log('Wallet config created:', { isMiniApp, config });
    }
  }, [isMiniApp, isLoading]);

  // Call ready when the app is fully loaded and ready to display
  useEffect(() => {
    if (!isLoading && walletConfig && !appReady) {
      const timer = setTimeout(async () => {
        if (isMiniApp) {
          console.log('App is ready, calling SDK ready...');
          await callReady();
        }
        setAppReady(true);
        console.log('App marked as ready');
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isLoading, walletConfig, isMiniApp, callReady, appReady]);

  console.log('EnhancedWalletProvider state:', { isMiniApp, isLoading, error, walletConfig, appReady, isReady });

  // Show loading state while detecting environment or creating config
  if (isLoading || !walletConfig) {
    console.log('Showing loading state - environment detection or config creation in progress');
    return (
      <div className="loading-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px',
        backgroundColor: '#1a1a1a',
        color: 'white',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '20px' }}>
          {isLoading ? 'Detecting environment...' : 'Initializing wallet...'}
        </div>
        {isMiniApp && (
          <div style={{ fontSize: '14px', color: '#888' }}>
            Mini App Mode
          </div>
        )}
      </div>
    );
  }

  // If there's an error, fallback to web configuration
  if (error) {
    console.error('Wallet initialization error:', error);
    const fallbackConfig = createWebConfig();
    
    return (
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={fallbackConfig}>
          <EnhancedWalletContext.Provider value={{ isMiniApp: false, isLoading: false, walletConfig: fallbackConfig, debugInfo: [] }}>
            <ThirdwebProvider 
              clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID || ""}
              activeChain={Base}
              autoConnect={true}
            >
              <OriginalWalletProvider>
                {children}
              </OriginalWalletProvider>
            </ThirdwebProvider>
          </EnhancedWalletContext.Provider>
        </WagmiProvider>
      </QueryClientProvider>
    );
  }

  console.log('Rendering normal app with environment:', isMiniApp ? 'Mini App' : 'Web');

  // Render based on detected environment
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={walletConfig}>
        <EnhancedWalletContext.Provider value={{ isMiniApp, isLoading, walletConfig, debugInfo }}>
          {isMiniApp ? (
            // Mini App environment - use only Wagmi (CSP-safe)
            <OriginalWalletProvider>
              {children}
            </OriginalWalletProvider>
          ) : (
            // Web environment - use ThirdWeb + Wagmi (full wallet support)
            <ThirdwebProvider 
              clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID || ""}
              activeChain={Base}
              autoConnect={true}
            >
              <OriginalWalletProvider>
                {children}
              </OriginalWalletProvider>
            </ThirdwebProvider>
          )}
        </EnhancedWalletContext.Provider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export const useEnhancedWallet = () => useContext(EnhancedWalletContext);

