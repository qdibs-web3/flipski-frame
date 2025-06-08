import { useState, useEffect } from 'react';

export const useMiniApp = () => {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

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

        // For now, let's just assume web environment to test the app
        // We can add proper SDK detection later
        console.log('Assuming web environment for testing');
        setIsMiniApp(false);
        setError(null);
        setIsLoading(false);

        // Commented out SDK detection for now to avoid blocking
        /*
        try {
          const { sdk } = await import('@farcaster/frame-sdk');
          const miniAppStatus = await sdk.isInMiniApp();
          console.log('SDK detection result:', miniAppStatus);
          setIsMiniApp(miniAppStatus);
          setError(null);
        } catch (sdkError) {
          console.warn('SDK detection failed, assuming web environment:', sdkError);
          setIsMiniApp(false);
          setError(null); // Don't treat this as an error, just assume web environment
        }
        */
      } catch (err) {
        console.error('Error detecting Mini App environment:', err);
        setError(err);
        setIsMiniApp(false);
      } finally {
        setIsLoading(false);
      }
    };

    detectEnvironment();
  }, []);

  console.log('useMiniApp state:', { isMiniApp, isLoading, error });

  return {
    isMiniApp,
    isLoading,
    error,
    sdk: null // isMiniApp ? sdk : null
  };
};

