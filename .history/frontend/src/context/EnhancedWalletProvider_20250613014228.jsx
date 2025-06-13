// Enhanced EnhancedWalletProvider with mobile SDK bypass
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

// Create Wagmi config for Mini App
const createMiniAppConfig = () => {
  return createConfig({
    chains: [base],
    transports: {
      [base.id]: http(),
    },
    connectors: [miniAppConnector()],
  });
};

// Create Wagmi config for Web
const createWebConfig = () => {
  return createConfig({
    chains: [base],
    transports: {
      [base.id]: http(),
    },
    connectors: [miniAppConnector()],
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

  // MOBILE FIX: Enhanced mobile detection
  const isMobileWebView = () => {
    const userAgent = navigator.userAgent || '';
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isFarcasterMobile = userAgent.includes('Farcaster') && isMobile;
    const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
    
    return isFarcasterMobile || (isMobile && isInFrame);
  };

  // Config creation with mobile optimization
  useEffect(() => {
    if (!isLoading) {
      try {
        const config = isMiniApp ? createMiniAppConfig() : createWebConfig();
        setWalletConfig(config);
        console.log('Wallet config created:', { isMiniApp, config });
      } catch (configError) {
        console.error('Config creation error:', configError);
        const fallbackConfig = createWebConfig();
        setWalletConfig(fallbackConfig);
        console.log('Using fallback web config');
      }
    }
  }, [isMiniApp, isLoading]);

  // MOBILE FIX: Enhanced ready call with mobile bypass
  useEffect(() => {
    if (!isLoading && walletConfig && !appReady) {
      const mobileWebView = isMobileWebView();
      
      const timer = setTimeout(async () => {
        try {
          if (isMiniApp) {
            console.log(`App is ready, mobile: ${mobileWebView}`);
            
            if (mobileWebView) {
              console.log('Mobile WebView: Skipping SDK ready call');
              // Skip SDK ready call on mobile
            } else {
              console.log('Browser: Calling SDK ready');
              await Promise.race([
                callReady(),
                new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Ready timeout')), 3000)
                )
              ]);
            }
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

  // Emergency timeout with mobile consideration
  useEffect(() => {
    const mobileWebView = isMobileWebView();
    const emergencyTime = mobileWebView ? 5000 : 10000; // Shorter timeout for mobile
    
    const emergencyTimer = setTimeout(() => {
      if (!walletConfig) {
        console.warn('Emergency: Creating fallback config');
        setWalletConfig(createWebConfig());
      }
      if (!appReady) {
        console.warn('Emergency: Marking app as ready');
        setAppReady(true);
      }
    }, emergencyTime);

    return () => clearTimeout(emergencyTimer);
  }, []);

  console.log('EnhancedWalletProvider state:', { 
    isMiniApp, 
    isLoading, 
    error, 
    walletConfig, 
    appReady, 
    isReady,
    isMobileWebView: isMobileWebView()
  });

  // Show loading state with mobile-aware messaging
  if (isLoading || !walletConfig) {
    const mobileWebView = isMobileWebView();
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
            {mobileWebView ? 'Mobile Mini App Mode' : 'Browser Mini App Mode'}
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          {mobileWebView ? 'Mobile-optimized loading...' : 'Loading will complete automatically...'}
        </div>
      </div>
    );
  }

  // Error handling - always continue
  if (error) {
    console.warn('Wallet initialization error (continuing with fallback):', error);
  }

  // Main app render
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={walletConfig}>
        <EnhancedWalletContext.Provider value={{ 
          isMiniApp, 
          isLoading: false,
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

