// Enhanced useMiniApp hook with mobile optimizations
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
    setDebugInfo(prev => [...prev.slice(-15), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    const detectEnvironment = async () => {
      try {
        addDebug('🔍 Starting mobile-optimized environment detection...');
        setIsLoading(true);
        
        // Check if we're in a browser environment first
        if (typeof window === 'undefined') {
          addDebug('❌ Not in browser environment');
          setIsMiniApp(false);
          setError(null);
          setIsLoading(false);
          return;
        }

        // MOBILE-OPTIMIZED: Simplified detection with longer timeouts
        let miniAppDetected = false;
        let farcasterSdk = null;

        // Step 1: Quick environment checks (mobile-friendly)
        const userAgent = navigator.userAgent || '';
        const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
        const hasFarcasterUA = userAgent.includes('Farcaster') || userAgent.includes('farcaster');
        
        // Step 2: URL parameter checks
        const urlParams = new URLSearchParams(window.location.search);
        const hasFarcasterParams = urlParams.has('fc_frame') || urlParams.has('farcaster');
        
        addDebug(`🔍 Quick checks: UA=${hasFarcasterUA}, Frame=${isInFrame}, Params=${hasFarcasterParams}`);

        // Step 3: MOBILE-OPTIMIZED SDK loading with extended timeout
        if (hasFarcasterUA || hasFarcasterParams || isInFrame) {
          try {
            addDebug('📦 Loading Farcaster SDK (mobile-optimized)...');
            
            // MOBILE FIX: Use longer timeout for mobile networks
            const sdkLoadPromise = import('@farcaster/frame-sdk');
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('SDK load timeout')), 10000) // 10 seconds for mobile
            );
            
            const { sdk: importedSdk } = await Promise.race([sdkLoadPromise, timeoutPromise]);
            addDebug('✅ SDK loaded successfully');
            
            // MOBILE FIX: Extended timeout for SDK detection
            addDebug('🔍 Checking if in Mini App (extended timeout for mobile)...');
            const detectionPromise = importedSdk.isInMiniApp();
            const detectionTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Detection timeout')), 8000) // 8 seconds for detection
            );
            
            const sdkResult = await Promise.race([detectionPromise, detectionTimeoutPromise]);
            addDebug(`🎯 SDK detection result: ${sdkResult}`);
            
            if (sdkResult) {
              miniAppDetected = true;
              farcasterSdk = importedSdk;
              addDebug('✅ Mini app detected via SDK');
            }
            
          } catch (sdkError) {
            addDebug(`⚠️ SDK detection failed: ${sdkError.message}`);
            
            // MOBILE FIX: More aggressive fallback for mobile
            if (hasFarcasterUA || isInFrame) {
              addDebug('🔄 Mobile fallback: Assuming Farcaster mini app');
              miniAppDetected = true;
              
              // Try to load SDK without detection
              try {
                addDebug('📦 Loading SDK in fallback mode...');
                const { sdk: fallbackSdk } = await import('@farcaster/frame-sdk');
                farcasterSdk = fallbackSdk;
                addDebug('✅ SDK loaded in fallback mode');
              } catch (fallbackError) {
                addDebug(`⚠️ Fallback SDK load failed: ${fallbackError.message}`);
                // Continue without SDK - we'll handle this in ready call
              }
            }
          }
        }

        // MOBILE FIX: Final fallback with timeout protection
        if (!miniAppDetected && isInFrame) {
          addDebug('🔄 Frame detected, assuming mini app (mobile-safe)');
          miniAppDetected = true;
        }

        addDebug(`🎯 Final detection result: ${miniAppDetected}`);
        
        setIsMiniApp(miniAppDetected);
        setSdk(farcasterSdk);
        setError(null);
        
      } catch (err) {
        addDebug(`❌ Detection error: ${err.message}`);
        
        // MOBILE FIX: Always resolve loading state, never leave it hanging
        const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
        setIsMiniApp(isInFrame); // Assume mini app if in frame
        setSdk(null);
        setError(null); // Don't set error, just continue
      } finally {
        // MOBILE FIX: Always resolve loading state
        addDebug('✅ Detection complete, resolving loading state');
        setIsLoading(false);
      }
    };

    // MOBILE FIX: Add overall timeout to prevent infinite loading
    const overallTimeout = setTimeout(() => {
      addDebug('⏰ Overall detection timeout - forcing completion');
      setIsLoading(false);
      setIsMiniApp(window.location !== window.parent.location || window.frameElement !== null);
    }, 15000); // 15 seconds maximum

    detectEnvironment().finally(() => {
      clearTimeout(overallTimeout);
    });

    return () => clearTimeout(overallTimeout);
  }, []);

  // MOBILE-OPTIMIZED ready call
  const callReady = async () => {
    if (isMiniApp && !isReady) {
      addDebug('🚀 Starting mobile-optimized ready sequence...');
      let workingSdk = sdk;
      
      // MOBILE FIX: Try to load SDK if not available
      if (!workingSdk) {
        try {
          addDebug('📦 Loading SDK for ready call...');
          const loadPromise = import('@farcaster/frame-sdk');
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SDK load timeout')), 5000)
          );
          
          const { sdk: loadedSdk } = await Promise.race([loadPromise, timeoutPromise]);
          workingSdk = loadedSdk;
          setSdk(loadedSdk);
          addDebug('✅ SDK loaded for ready call');
        } catch (sdkLoadError) {
          addDebug(`⚠️ Failed to load SDK: ${sdkLoadError.message}`);
          // Continue without SDK - mark as ready anyway
          setIsReady(true);
          return;
        }
      }
      
      // MOBILE FIX: Simplified ready call with timeout
      if (workingSdk) {
        try {
          addDebug('⚡ Calling SDK ready...');
          const readyPromise = workingSdk.actions.ready({});
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Ready timeout')), 3000)
          );
          
          await Promise.race([readyPromise, timeoutPromise]);
          addDebug('✅ Ready call successful!');
          setIsReady(true);
        } catch (readyError) {
          addDebug(`⚠️ Ready call failed: ${readyError.message}`);
          // MOBILE FIX: Mark as ready even if call fails
          addDebug('🔄 Marking as ready despite failure (mobile-safe)');
          setIsReady(true);
        }
      } else {
        // No SDK available, mark as ready
        addDebug('🔄 No SDK available, marking as ready');
        setIsReady(true);
      }
    } else if (!isMiniApp) {
      addDebug('🌐 Not in mini app, marking as ready');
      setIsReady(true);
    }
  };

  // MOBILE FIX: Auto-ready mechanism with timeout
  useEffect(() => {
    if (!isLoading && !isReady) {
      addDebug('⏰ Auto-ready timer started');
      const autoReadyTimer = setTimeout(() => {
        addDebug('🔄 Auto-ready triggered');
        if (isMiniApp) {
          callReady();
        } else {
          setIsReady(true);
        }
      }, 1000);
      
      return () => clearTimeout(autoReadyTimer);
    }
  }, [isLoading, isReady, isMiniApp]);

  // MOBILE FIX: Emergency timeout to prevent infinite loading
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (isLoading) {
        addDebug('🚨 Emergency timeout - forcing ready state');
        setIsLoading(false);
        setIsReady(true);
      }
    }, 20000); // 20 seconds emergency timeout

    return () => clearTimeout(emergencyTimeout);
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

