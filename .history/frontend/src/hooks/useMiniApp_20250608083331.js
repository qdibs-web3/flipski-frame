import { useState, useEffect } from 'react';

export const useMiniApp = () => {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sdk, setSdk] = useState(null);

  useEffect(() => {
    const detectEnvironment = async () => {
      try {
        console.log('Starting environment detection...');
        setIsLoading(true);
        
        // Check if we're in a browser environment first
        if (typeof window === 'undefined') {
          console.log('Not in browser environment');
          setIsMiniApp(false);
          setError(null);
          setIsLoading(false);
          return;
        }

        // Check for Farcaster user agent or frame context
        const userAgent = navigator.userAgent || '';
        const isFarcasterApp = userAgent.includes('Farcaster') || 
                              window.location !== window.parent.location ||
                              window.frameElement !== null;
        
        console.log('User agent check:', { userAgent, isFarcasterApp });

        // Try to detect Farcaster Mini App environment
        try {
          console.log('Attempting to load Farcaster SDK...');
          const { sdk: farcasterSdk } = await import('@farcaster/frame-sdk');
          
          console.log('SDK loaded, checking if in Mini App...');
          
          // Give the SDK more time to initialize
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const miniAppStatus = await farcasterSdk.isInMiniApp();
          
          console.log('SDK detection result:', miniAppStatus);
          
          // If SDK says false but we detected Farcaster context, assume it's a frame
          const finalStatus = miniAppStatus || isFarcasterApp;
          
          setIsMiniApp(finalStatus);
          setSdk(finalStatus ? farcasterSdk : null);
          setError(null);
          
          // If we're in a Mini App, initialize the SDK
          if (finalStatus) {
            console.log('Initializing Mini App SDK...');
            try {
              await farcasterSdk.ready();
              console.log('Mini App SDK ready');
            } catch (initError) {
              console.warn('SDK initialization warning:', initError);
              // Don't treat this as a fatal error
            }
          }
          
        } catch (sdkError) {
          console.warn('SDK detection failed:', sdkError);
          
          // Fallback: if we can't load SDK but detected Farcaster context, assume it's a frame
          if (isFarcasterApp) {
            console.log('Fallback: Assuming Farcaster frame based on context');
            setIsMiniApp(true);
            setSdk(null);
          } else {
            console.log('Assuming web environment');
            setIsMiniApp(false);
            setSdk(null);
          }
          setError(null); // Don't treat this as an error, just assume web environment
        }
      } catch (err) {
        console.error('Error detecting Mini App environment:', err);
        setError(err);
        setIsMiniApp(false);
        setSdk(null);
      } finally {
        setIsLoading(false);
      }
    };

    detectEnvironment();
  }, []);

  console.log('useMiniApp state:', { isMiniApp, isLoading, error, hasSdk: !!sdk });

  return {
    isMiniApp,
    isLoading,
    error,
    sdk
  };
};

