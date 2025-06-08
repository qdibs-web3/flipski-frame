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

        // Try to detect Farcaster Mini App environment
        try {
          console.log('Attempting to load Farcaster SDK...');
          const { sdk: farcasterSdk } = await import('@farcaster/frame-sdk');
          
          console.log('SDK loaded, checking if in Mini App...');
          const miniAppStatus = await farcasterSdk.isInMiniApp();
          
          console.log('SDK detection result:', miniAppStatus);
          setIsMiniApp(miniAppStatus);
          setSdk(miniAppStatus ? farcasterSdk : null);
          setError(null);
          
          // If we're in a Mini App, initialize the SDK
          if (miniAppStatus) {
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
          console.warn('SDK detection failed, assuming web environment:', sdkError);
          setIsMiniApp(false);
          setSdk(null);
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

