import { useState, useEffect } from 'react';

export const useMiniApp = () => {
  const [isMiniApp, setIsMiniApp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sdk, setSdk] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [debugInfo, setDebugInfo] = useState([]);

  // Add debug info that will be visible on screen
  const addDebug = (message) => {
    console.log(message);
    setDebugInfo(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const detectEnvironment = async () => {
      try {
        addDebug('🚀 ULTRA-AGGRESSIVE: Starting bypass detection...');
        setIsLoading(true);
        
        // Check if we're in a browser environment first
        if (typeof window === 'undefined') {
          addDebug('❌ Not in browser environment');
          setIsMiniApp(false);
          setError(null);
          setIsLoading(false);
          return;
        }

        // ULTRA-AGGRESSIVE: Assume mini app if any indicators present
        const userAgent = navigator.userAgent || '';
        const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
        const hasFarcasterUA = userAgent.includes('Farcaster') || userAgent.includes('farcaster');
        const urlParams = new URLSearchParams(window.location.search);
        const hasFarcasterParams = urlParams.has('fc_frame') || urlParams.has('farcaster');

        addDebug(`🔍 BYPASS Detection: UA=${hasFarcasterUA}, Frame=${isInFrame}, Params=${hasFarcasterParams}`);

        // BYPASS STRATEGY: If any indicator suggests Farcaster, assume mini app immediately
        let miniAppDetected = false;
        let farcasterSdk = null;

        if (hasFarcasterUA || hasFarcasterParams || isInFrame) {
          addDebug('⚡ BYPASS: Assuming mini app immediately based on indicators');
          miniAppDetected = true;
          
          // Try to load SDK but don't wait or fail if it doesn't work
          try {
            addDebug('📦 BYPASS: Attempting quick SDK load (non-blocking)...');
            const { sdk: importedSdk } = await Promise.race([
              import('@farcaster/frame-sdk'),
              new Promise((_, reject) => setTimeout(() => reject(new Error('SDK timeout')), 1000))
            ]);
            
            farcasterSdk = importedSdk.sdk;
            addDebug('✅ BYPASS: SDK loaded successfully');
          } catch (sdkError) {
            addDebug(`⚠️ BYPASS: SDK load failed, continuing without SDK: ${sdkError.message}`);
            // Continue without SDK - this is the bypass!
          }
        } else {
          addDebug('🌐 BYPASS: No Farcaster indicators, assuming browser');
        }

        addDebug(`🎯 BYPASS: Final result - miniApp=${miniAppDetected}, hasSdk=${!!farcasterSdk}`);
        
        setIsMiniApp(miniAppDetected);
        setSdk(farcasterSdk);
        setError(null);
        
        // ULTRA-AGGRESSIVE: Mark as ready immediately if mini app detected
        if (miniAppDetected) {
          addDebug('⚡ BYPASS: Mini app detected, forcing ready state immediately');
          setIsReady(true);
        }
        
      } catch (err) {
        addDebug(`❌ BYPASS: Detection error, forcing mini app assumption: ${err.message}`);
        
        // ULTRA-AGGRESSIVE: Even if detection fails, assume mini app if in frame
        const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
        if (isInFrame) {
          addDebug('🔄 BYPASS: Error occurred but in frame - forcing mini app mode');
          setIsMiniApp(true);
          setSdk(null);
          setError(null);
          setIsReady(true); // Force ready immediately
        } else {
          setError(err);
          setIsMiniApp(false);
          setSdk(null);
          setIsReady(true); // Force ready even on error
        }
      } finally {
        setIsLoading(false);
      }
    };

    detectEnvironment();
  }, []);

  // ULTRA-AGGRESSIVE ready call - try everything but don't block
  const callReady = async () => {
    addDebug('🚀 BYPASS: Starting non-blocking ready sequence...');
    
    if (!isReady) {
      // Strategy 1: Try with existing SDK
      if (sdk) {
        try {
          addDebug('⚡ BYPASS: Trying ready with existing SDK...');
          await sdk.actions.ready({});
          addDebug('✅ BYPASS: Ready successful with existing SDK!');
          setIsReady(true);
          return;
        } catch (error) {
          addDebug(`⚠️ BYPASS: Existing SDK ready failed: ${error.message}`);
        }
      }
      
      // Strategy 2: Try to load SDK and call ready
      try {
        addDebug('📦 BYPASS: Loading SDK for ready call...');
        const { sdk: loadedSdk } = await Promise.race([
          import('@farcaster/frame-sdk'),
          new Promise((_, reject) => setTimeout(() => reject(new Error('SDK timeout')), 2000))
        ]);
        
        await loadedSdk.sdk.actions.ready({});
        addDebug('✅ BYPASS: Ready successful with loaded SDK!');
        setSdk(loadedSdk.sdk);
        setIsReady(true);
        return;
      } catch (error) {
        addDebug(`⚠️ BYPASS: Loaded SDK ready failed: ${error.message}`);
      }
      
      // Strategy 3: Force ready state regardless
      addDebug('🔄 BYPASS: All SDK attempts failed, forcing ready state');
      setIsReady(true);
    }
  };

  // BYPASS: Auto-call ready immediately when mini app is detected
  useEffect(() => {
    if (isMiniApp && !isReady && !isLoading) {
      addDebug('⏰ BYPASS: Auto-triggering ready call...');
      callReady();
    }
  }, [isMiniApp, isReady, isLoading]);

  // BYPASS: Force ready after timeout regardless of state
  useEffect(() => {
    const forceReadyTimer = setTimeout(() => {
      if (!isReady) {
        addDebug('⏰ BYPASS: Timeout reached, forcing ready state');
        setIsReady(true);
      }
    }, 5000); // Force ready after 5 seconds no matter what

    return () => clearTimeout(forceReadyTimer);
  }, []);

  return {
    isMiniApp,
    isLoading,
    error,
    sdk,
    isReady,
    callReady,
    debugInfo
  };
};

