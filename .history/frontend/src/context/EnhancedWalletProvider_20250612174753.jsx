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
  const { isMiniApp, isLoading, error, callReady, isReady } = useMiniApp();
  const [walletConfig, setWalletConfig] = useState(null);
  const [appReady, setAppReady] = useState(false);
  const [readyCalled, setReadyCalled] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      const config = isMiniApp ? createMiniAppConfig() : createWebConfig();
      setWalletConfig(config);
      console.log('Wallet config created:', { isMiniApp, config });
    }
  }, [isMiniApp, isLoading]);

  // Improved ready call logic with multiple attempts and better timing
  useEffect(() => {
    if (!isLoading && walletConfig && !readyCalled && isMiniApp) {
      console.log('Preparing to call ready...');
      
      // Use multiple strategies to ensure ready is called
      const callReadyWithRetry = async () => {
        let attempts = 0;
        const maxAttempts = 3;
        
        while (attempts < maxAttempts && !readyCalled) {
          try {
            attempts++;
            console.log(`Calling ready attempt ${attempts}/${maxAttempts}`);
            
            // Wait a bit longer on first attempt to ensure DOM is ready
            const delay = attempts === 1 ? 500 : 100;
            await new Promise(resolve => setTimeout(resolve, delay));
            
            await callReady();
            setReadyCalled(true);
            setAppReady(true);
            console.log('Ready called successfully');
            break;
            
          } catch (error) {
            console.error(`Ready call attempt ${attempts} failed:`, error);
            
            if (attempts === maxAttempts) {
              console.log('All ready attempts failed, marking as ready anyway');
              setReadyCalled(true);
              setAppReady(true);
            }
          }
        }
      };
      
      callReadyWithRetry();
    } else if (!isMiniApp && walletConfig) {
      // For web mode, mark as ready immediately
      setAppReady(true);
      setReadyCalled(true);
    }
  }, [isLoading, walletConfig, isMiniApp, callReady, readyCalled]);

  // Additional safety net - force ready after timeout
  useEffect(() => {
    if (isMiniApp && !readyCalled) {
      const forceReadyTimeout = setTimeout(() => {
        if (!readyCalled) {
          console.log('Force calling ready after timeout');
          callReady().catch(console.error);
          setReadyCalled(true);
          setAppReady(true);
        }
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(forceReadyTimeout);
    }
  }, [isMiniApp, readyCalled, callReady]);

  console.log('EnhancedWalletProvider state:', { 
    isMiniApp, 
    isLoading, 
    error, 
    walletConfig: !!walletConfig, 
    appReady, 
    isReady, 
    readyCalled 
  });

  // Show loading state while detecting environment or creating config
  if (isLoading || !walletConfig || (isMiniApp && !appReady)) {
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
          {isLoading ? 'Detecting environment...' : 
           !walletConfig ? 'Initializing wallet...' : 
           'Preparing app...'}
        </div>
        {isMiniApp && (
          <div style={{ fontSize: '14px', color: '#888' }}>
            Mini App Mode
          </div>
        )}
        <div style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
          {readyCalled ? 'Ready called' : 'Waiting for ready...'}
        </div>
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
          <EnhancedWalletContext.Provider value={{ isMiniApp: false, isLoading: false, walletConfig: fallbackConfig }}>
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
        <EnhancedWalletContext.Provider value={{ isMiniApp, isLoading, walletConfig }}>
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

