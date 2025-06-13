// Enhanced EnhancedWalletProvider with mobile optimizations
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

  // MOBILE FIX: Simplified config creation with timeout protection
  useEffect(() => {
    if (!isLoading) {
      try {
        const config = isMiniApp ? createMiniAppConfig() : createWebConfig();
        setWalletConfig(config);
        console.log('Wallet config created:', { isMiniApp, config });
      } catch (configError) {
        console.error('Config creation error:', configError);
        // MOBILE FIX: Fallback to web config if mini app config fails
        const fallbackConfig = createWebConfig();
        setWalletConfig(fallbackConfig);
        console.log('Using fallback web config');
      }
    }
  }, [isMiniApp, isLoading]);

  // MOBILE FIX: Simplified ready call with timeout protection
  useEffect(() => {
    if (!isLoading && walletConfig && !appReady) {
      const timer = setTimeout(async () => {
        try {
          if (isMiniApp) {
            console.log('App is ready, calling SDK ready...');
            await Promise.race([
              callReady(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Ready timeout')), 5000)
              )
            ]);
          }
        } catch (readyError) {
          console.warn('Ready call failed, continuing anyway:', readyError);
        } finally {
          setAppReady(true);
          console.log('App marked as ready');
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isLoading, walletConfig, isMiniApp, callReady, appReady]);

  // MOBILE FIX: Emergency timeout to prevent infinite loading
  useEffect(() => {
    const emergencyTimer = setTimeout(() => {
      if (!walletConfig) {
        console.warn('Emergency: Creating fallback config');
        setWalletConfig(createWebConfig());
      }
      if (!appReady) {
        console.warn('Emergency: Marking app as ready');
        setAppReady(true);
      }
    }, 10000); // 10 seconds emergency timeout

    return () => clearTimeout(emergencyTimer);
  }, []);

  console.log('EnhancedWalletProvider state:', { isMiniApp, isLoading, error, walletConfig, appReady, isReady });

  // MOBILE FIX: Show loading state with timeout protection
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
        {/* MOBILE FIX: Add loading progress indicator */}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          Loading will complete automatically...
        </div>
      </div>
    );
  }

  // MOBILE FIX: Simplified error handling - always continue
  if (error) {
    console.warn('Wallet initialization error (continuing with fallback):', error);
    // Don't show error screen, just use fallback config
  }

  // Main app render
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={walletConfig}>
        <EnhancedWalletContext.Provider value={{ 
          isMiniApp, 
          isLoading: false, // Always false here since we've resolved loading
          walletConfig, 
          debugInfo 
        }}>
          <ThirdwebProvider 
            clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID || ""}
            activeChain={Base}
          >
            <OriginalWalletProvider>
              {children}
            </OriginalWalletProvider>
          </ThirdwebProvider>
        </EnhancedWalletContext.Provider>
      </WagmiProvider>
    </QueryClientProvider>
  );
};

export const useEnhancedWallet = () => {
  const context = useContext(EnhancedWalletContext);
  if (!context) {
    throw new Error('useEnhancedWallet must be used within EnhancedWalletProvider');
  }
  return context;
};

