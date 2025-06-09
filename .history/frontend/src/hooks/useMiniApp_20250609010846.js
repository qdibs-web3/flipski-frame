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

        // Enhanced detection logic for Farcaster Mini App
        let miniAppDetected = false;
        let farcasterSdk = null;

        // Method 1: Check for Farcaster-specific indicators
        const userAgent = navigator.userAgent || '';
        const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
        const hasFarcasterUA = userAgent.includes('Farcaster') || userAgent.includes('farcaster');
        
        // Method 2: Check URL parameters that Farcaster might add
        const urlParams = new URLSearchParams(window.location.search);
        const hasFarcasterParams = urlParams.has('fc_frame') || urlParams.has('farcaster');
        
        // Method 3: Check for Farcaster-specific window properties
        const hasFarcasterWindow = window.parent !== window && 
                                  (window.parent.location.hostname.includes('farcaster') ||
                                   window.parent.location.hostname.includes('warpcast'));

        console.log('Detection checks:', {
          userAgent,
          isInFrame,
          hasFarcasterUA,
          hasFarcasterParams,
          hasFarcasterWindow,
          hostname: window.location.hostname,
          parentHostname: window.parent?.location?.hostname
        });

        // If any of these indicators suggest Farcaster, try SDK detection
        if (hasFarcasterUA || hasFarcasterParams || hasFarcasterWindow || isInFrame) {
          try {
            console.log('Attempting to load Farcaster SDK...');
            const { sdk: importedSdk } = await import('@farcaster/frame-sdk');
            
            console.log('SDK loaded, checking if in Mini App...');
            
            // Use the SDK's detection method with timeout
            const sdkResult = await Promise.race([
              importedSdk.isInMiniApp(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('SDK timeout')), 1000)
              )
            ]);
            
            console.log('SDK detection result:', sdkResult);
            
            if (sdkResult) {
              miniAppDetected = true;
              farcasterSdk = importedSdk;
            }
            
          } catch (sdkError) {
            console.warn('SDK detection failed, using fallback:', sdkError);
            
            // Fallback: if we have strong indicators, assume mini app
            if (hasFarcasterUA || hasFarcasterParams || 
                (isInFrame && window.location.hostname.includes('trycloudflare'))) {
              console.log('Fallback: Assuming Farcaster mini app based on context');
              miniAppDetected = true;
            }
          }
        }

        // Final fallback for development/testing
        if (!miniAppDetected && isInFrame) {
          console.log('Frame detected, checking if likely Farcaster context...');
          // If we're in a frame and the URL suggests it's a tunnel/preview, assume mini app
          if (window.location.hostname.includes('trycloudflare') || 
              window.location.hostname.includes('ngrok') ||
              window.location.hostname.includes('localhost')) {
            console.log('Development context detected, assuming mini app');
            miniAppDetected = true;
          }
        }

        console.log('Final detection result:', miniAppDetected);
        
        setIsMiniApp(miniAppDetected);
        setSdk(farcasterSdk);
        setError(null);
        
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

