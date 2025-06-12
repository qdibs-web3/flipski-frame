import { useState, useEffect } from 'react';

export const useMiniApp = () => {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [context, setContext] = useState(null);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);

  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        console.log('Starting mini app initialization...');
        
        // Check if we're in a mini app environment
        const isMiniAppEnv = typeof window !== 'undefined' && 
          (window.parent !== window || 
           window.location !== window.parent.location ||
           document.referrer.includes('farcaster') ||
           navigator.userAgent.includes('Farcaster'));
        
        console.log('Mini app environment detected:', isMiniAppEnv);
        setIsMiniApp(isMiniAppEnv);
        
        if (!isMiniAppEnv) {
          setIsLoading(false);
          return;
        }

        // Dynamic import of the SDK
        console.log('Loading Farcaster SDK...');
        const { sdk } = await import('@farcaster/frame-sdk');
        
        if (!sdk) {
          console.error('Failed to load SDK');
          setIsLoading(false);
          return;
        }

        console.log('SDK loaded successfully, initializing...');
        
        // Follow the official demo pattern exactly
        const load = async () => {
          try {
            // Step 1: Get context (this is critical for mobile)
            console.log('Getting SDK context...');
            const sdkContext = await sdk.context;
            console.log('SDK context loaded:', sdkContext);
            setContext(sdkContext);

            // Step 2: Set up ethereum provider (important for mobile)
            console.log('Setting up ethereum provider...');
            const ethereumProvider = await sdk.wallet.getEthereumProvider();
            if (ethereumProvider) {
              ethereumProvider.on("chainChanged", (chainId) => {
                console.log("[EthereumProvider] chainChanged", chainId);
              });
              console.log('Ethereum provider set up successfully');
            }

            // Step 3: Set up event listeners
            console.log('Setting up SDK event listeners...');
            
            sdk.on("frameAdded", ({ notificationDetails }) => {
              console.log('Frame added event:', notificationDetails);
            });

            sdk.on("frameAddRejected", ({ reason }) => {
              console.log('Frame add rejected:', reason);
            });

            sdk.on("frameRemoved", () => {
              console.log('Frame removed');
            });

            sdk.on("notificationsEnabled", ({ notificationDetails }) => {
              console.log('Notifications enabled:', notificationDetails);
            });

            sdk.on("notificationsDisabled", () => {
              console.log('Notifications disabled');
            });

            sdk.on("primaryButtonClicked", () => {
              console.log('Primary button clicked');
            });

            // Step 4: NOW call ready() - this is the critical timing
            console.log('All setup complete, calling ready()...');
            await sdk.actions.ready({});
            console.log('Ready called successfully - splash screen should be dismissed');
            
            setIsSDKLoaded(true);
            setIsLoading(false);

          } catch (error) {
            console.error('Error in load function:', error);
            // Even if there's an error, try to call ready() to dismiss splash
            try {
              await sdk.actions.ready({});
              console.log('Ready called in error handler');
            } catch (readyError) {
              console.error('Failed to call ready in error handler:', readyError);
            }
            setIsLoading(false);
          }
        };

        // Start the loading process
        await load();

        // Cleanup function
        return () => {
          if (sdk) {
            sdk.removeAllListeners();
          }
        };

      } catch (error) {
        console.error('Failed to initialize mini app:', error);
        setIsLoading(false);
      }
    };

    initializeMiniApp();
  }, []);

  return {
    isMiniApp,
    isLoading,
    context,
    isSDKLoaded
  };
};

