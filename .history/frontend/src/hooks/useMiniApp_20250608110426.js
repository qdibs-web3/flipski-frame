import { useState, useEffect } from 'react';

export const useMiniApp = () => {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sdk, setSdk] = useState(null);
  const [isReady, setIsReady] = useState(false);

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
          
          // Use the SDK's detection method with proper timeout
          const miniAppStatus = await farcasterSdk.isInMiniApp(500); // 500ms timeout
          
          console.log('SDK detection result:', miniAppStatus);
          
          setIsMiniApp(miniAppStatus);
          setSdk(miniAppStatus ? farcasterSdk : null);
          setError(null);
          
        } catch (sdkError) {
          console.warn('SDK detection failed:', sdkError);
          
          // Fallback detection based on user agent and iframe context
          const userAgent = navigator.userAgent || '';
          const isFarcasterContext = userAgent.includes('Farcaster') || 
                                   window.location !== window.parent.location ||
                                   window.frameElement !== null;
          
          if (isFarcasterContext) {
            console.log('Fallback: Assuming Farcaster frame based on context');
            setIsMiniApp(true);
            setSdk(null);
          } else {
            console.log('Assuming web environment');
            setIsMiniApp(false);
            setSdk(null);
          }
          setError(null);
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

  // Call ready when app is ready to be displayed
  const callReady = async () => {
    if (sdk && isMiniApp && !isReady) {
      try {
        console.log('Calling sdk.actions.ready()...');
        await sdk.actions.ready();
        console.log('SDK ready called successfully');
        setIsReady(true);
      } catch (err) {
        console.error('Error calling sdk.actions.ready():', err);
        // Don't treat this as a fatal error, set ready anyway
        setIsReady(true);
      }
    } else if (isMiniApp && !sdk) {
      // If we're in mini app but don't have SDK, still mark as ready
      console.log('Mini app detected but no SDK available, marking as ready');
      setIsReady(true);
    }
  };

  console.log('useMiniApp state:', { isMiniApp, isLoading, error, hasSdk: !!sdk, isReady });

  return {
    isMiniApp,
    isLoading,
    error,
    sdk,
    isReady,
    callReady
  };
};

