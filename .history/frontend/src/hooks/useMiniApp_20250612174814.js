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

        // Method 1: Check for Farcaster-specific indicators (safe methods only)
        const userAgent = navigator.userAgent || '';
        const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
        const hasFarcasterUA = userAgent.includes('Farcaster') || userAgent.includes('farcaster');
        
        // Method 2: Check URL parameters that Farcaster might add
        const urlParams = new URLSearchParams(window.location.search);
        const hasFarcasterParams = urlParams.has('fc_frame') || urlParams.has('farcaster');
        
        // Method 3: Safe hostname checks (avoid cross-origin issues)
        let hasFarcasterWindow = false;
        try {
          // Only check current window hostname, not parent
          const currentHostname = window.location.hostname;
          hasFarcasterWindow = isInFrame && (
            currentHostname.includes('farcaster') ||
            currentHostname.includes('warpcast') ||
            currentHostname.includes('trycloudflare') // Development tunnels
          );
        } catch (e) {
          // Ignore cross-origin errors
          console.log('Cross-origin hostname check failed (expected in mini app)');
          hasFarcasterWindow = isInFrame; // If we can't check, assume mini app if in frame
        }

        console.log('Detection checks:', {
          userAgent,
          isInFrame,
          hasFarcasterUA,
          hasFarcasterParams,
          hasFarcasterWindow,
          hostname: window.location.hostname
        });

        // If any of these indicators suggest Farcaster, try SDK detection
        if (hasFarcasterUA || hasFarcasterParams || hasFarcasterWindow || isInFrame) {
          try {
            console.log('Attempting to load Farcaster SDK...');
            const { sdk: importedSdk } = await import('@farcaster/frame-sdk');
            
            console.log('SDK loaded, checking if in Mini App...');
            
            // Use the SDK's detection method with longer timeout for mobile
            const sdkResult = await Promise.race([
              importedSdk.isInMiniApp(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('SDK timeout')), 3000) // Increased timeout for mobile
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
            if (hasFarcasterUA || hasFarcasterParams || isInFrame) {
              console.log('Fallback: Assuming Farcaster mini app based on context');
              miniAppDetected = true;
              
              // Try to load SDK again for fallback scenarios
              try {
                const { sdk: fallbackSdk } = await import('@farcaster/frame-sdk');
                farcasterSdk = fallbackSdk;
                console.log('SDK loaded in fallback mode');
              } catch (fallbackError) {
                console.warn('Fallback SDK loading also failed:', fallbackError);
              }
            }
          }
        }

        // Final fallback for development/testing - if in frame, likely mini app
        if (!miniAppDetected && isInFrame) {
          console.log('Frame detected, assuming mini app for development');
          miniAppDetected = true;
          
          // Try to load SDK for development scenarios
          try {
            const { sdk: devSdk } = await import('@farcaster/frame-sdk');
            farcasterSdk = devSdk;
            console.log('SDK loaded in development mode');
          } catch (devError) {
            console.warn('Development SDK loading failed:', devError);
          }
        }

        console.log('Final detection result:', miniAppDetected);
        
        setIsMiniApp(miniAppDetected);
        setSdk(farcasterSdk);
        setError(null);
        
      } catch (err) {
        console.error('Error detecting Mini App environment:', err);
        
        // Even if detection fails, if we're in a frame, assume mini app
        const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
        if (isInFrame) {
          console.log('Detection failed but in frame - assuming mini app');
          setIsMiniApp(true);
          setSdk(null);
          setError(null);
        } else {
          setError(err);
          setIsMiniApp(false);
          setSdk(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    detectEnvironment();
  }, []);

  // Call ready when app is ready to be displayed
  const callReady = async () => {
    if (isMiniApp && !isReady) {
      try {
        if (sdk) {
          console.log('Calling sdk.actions.ready()...');
          await sdk.actions.ready();
          console.log('SDK ready called successfully');
          setIsReady(true);
        } else {
          // Fallback: try to load SDK and call ready
          console.log('No SDK available, attempting to load and call ready...');
          try {
            const { sdk: readySdk } = await import('@farcaster/frame-sdk');
            await readySdk.actions.ready();
            console.log('Fallback SDK ready called successfully');
            setSdk(readySdk);
            setIsReady(true);
          } catch (fallbackError) {
            console.error('Fallback ready call failed:', fallbackError);
            // Mark as ready anyway to prevent infinite loading
            setIsReady(true);
          }
        }
      } catch (err) {
        console.error('Error calling sdk.actions.ready():', err);
        // Don't treat this as a fatal error, set ready anyway
        setIsReady(true);
      }
    } else if (!isMiniApp) {
      // If not in mini app, mark as ready immediately
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

