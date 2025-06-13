// Enhanced useMiniApp hook with SDK ready call bypass for mobile
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
    setDebugInfo(prev => [...prev.slice(-25), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // MOBILE FIX: Enhanced mobile detection
  const isMobileWebView = () => {
    const userAgent = navigator.userAgent || '';
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isFarcasterMobile = userAgent.includes('Farcaster') && isMobile;
    const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
    
    addDebug(`📱 Mobile detection: isMobile=${isMobile}, isFarcasterMobile=${isFarcasterMobile}, isInFrame=${isInFrame}`);
    
    return isFarcasterMobile || (isMobile && isInFrame);
  };

  useEffect(() => {
    const detectEnvironment = async () => {
      try {
        addDebug('🔍 Starting SDK-aware environment detection...');
        setIsLoading(true);
        
        // Enhanced mobile detection
        const mobileWebView = isMobileWebView();
        addDebug(`📱 Mobile WebView detected: ${mobileWebView}`);
        
        // Environment info
        addDebug(`📱 User Agent: ${navigator.userAgent.substring(0, 50)}...`);
        addDebug(`🌐 Location: ${window.location.href}`);
        addDebug(`📏 Screen: ${window.screen.width}x${window.screen.height}`);
        
        // Check if we're in a browser environment first
        if (typeof window === 'undefined') {
          addDebug('❌ Not in browser environment');
          setIsMiniApp(false);
          setError(null);
          setIsLoading(false);
          return;
        }

        let miniAppDetected = false;
        let farcasterSdk = null;

        // Step 1: Quick environment checks
        const userAgent = navigator.userAgent || '';
        const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
        const hasFarcasterUA = userAgent.includes('Farcaster') || userAgent.includes('farcaster');
        
        // Step 2: URL parameter checks
        const urlParams = new URLSearchParams(window.location.search);
        const hasFarcasterParams = urlParams.has('fc_frame') || urlParams.has('farcaster');
        
        addDebug(`🔍 Environment checks: UA=${hasFarcasterUA}, Frame=${isInFrame}, Params=${hasFarcasterParams}`);

        // Step 3: SDK loading with mobile-aware timeout
        if (hasFarcasterUA || hasFarcasterParams || isInFrame) {
          try {
            addDebug('📦 Loading Farcaster SDK...');
            
            // Shorter timeout for mobile
            const sdkTimeout = mobileWebView ? 8000 : 15000;
            const sdkLoadPromise = import('@farcaster/frame-sdk');
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('SDK load timeout')), sdkTimeout)
            );
            
            const { sdk: importedSdk } = await Promise.race([sdkLoadPromise, timeoutPromise]);
            addDebug('✅ SDK loaded successfully');
            
            // Step 4: SDK detection with mobile-aware timeout
            addDebug('🔍 Checking if in Mini App...');
            const detectionTimeout = mobileWebView ? 5000 : 12000;
            const detectionPromise = importedSdk.isInMiniApp();
            const detectionTimeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Detection timeout')), detectionTimeout)
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
            
            // More aggressive fallback for mobile
            if (hasFarcasterUA || isInFrame) {
              addDebug('🔄 Using fallback detection');
              miniAppDetected = true;
              
              // Try to load SDK without detection
              try {
                const { sdk: fallbackSdk } = await import('@farcaster/frame-sdk');
                farcasterSdk = fallbackSdk;
                addDebug('✅ SDK loaded in fallback mode');
              } catch (fallbackError) {
                addDebug(`⚠️ Fallback SDK load failed: ${fallbackError.message}`);
              }
            }
          }
        }

        // Final fallback
        if (!miniAppDetected && isInFrame) {
          addDebug('🔄 Frame detected, assuming mini app');
          miniAppDetected = true;
        }

        addDebug(`🎯 Final detection result: ${miniAppDetected}`);
        
        setIsMiniApp(miniAppDetected);
        setSdk(farcasterSdk);
        setError(null);
        
      } catch (err) {
        addDebug(`❌ Detection error: ${err.message}`);
        
        // Always resolve loading state
        const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
        setIsMiniApp(isInFrame);
        setSdk(null);
        setError(null);
      } finally {
        addDebug('✅ Detection complete, resolving loading state');
        setIsLoading(false);
      }
    };

    // Overall timeout
    const overallTimeout = setTimeout(() => {
      addDebug('⏰ Overall detection timeout - forcing completion');
      setIsLoading(false);
      setIsMiniApp(window.location !== window.parent.location || window.frameElement !== null);
    }, 20000);

    detectEnvironment().finally(() => {
      clearTimeout(overallTimeout);
    });

    return () => clearTimeout(overallTimeout);
  }, []);

  // MOBILE FIX: SDK ready call with mobile bypass
  const callReady = async () => {
    if (isMiniApp && !isReady) {
      const mobileWebView = isMobileWebView();
      
      addDebug('🚀 Starting ready sequence...');
      addDebug(`📱 Mobile WebView: ${mobileWebView}`);
      
      // MOBILE FIX: Skip SDK ready call on mobile WebView
      if (mobileWebView) {
        addDebug('📱 Mobile WebView detected - BYPASSING SDK ready call');
        addDebug('✅ Marking as ready without SDK call (mobile-safe)');
        setIsReady(true);
        return;
      }
      
      // Browser: Normal SDK ready call
      let workingSdk = sdk;
      
      if (!workingSdk) {
        try {
          addDebug('📦 Loading SDK for ready call...');
          const { sdk: loadedSdk } = await import('@farcaster/frame-sdk');
          workingSdk = loadedSdk;
          setSdk(loadedSdk);
          addDebug('✅ SDK loaded for ready call');
        } catch (sdkLoadError) {
          addDebug(`⚠️ Failed to load SDK: ${sdkLoadError.message}`);
          setIsReady(true);
          return;
        }
      }
      
      // Try SDK ready call (browser only)
      if (workingSdk) {
        try {
          addDebug('⚡ Calling SDK ready (browser mode)...');
          const readyPromise = workingSdk.actions.ready({});
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Ready timeout')), 5000)
          );
          
          await Promise.race([readyPromise, timeoutPromise]);
          addDebug('✅ SDK ready call successful!');
          setIsReady(true);
        } catch (readyError) {
          addDebug(`⚠️ SDK ready call failed: ${readyError.message}`);
          addDebug('🔄 Marking as ready despite failure');
          setIsReady(true);
        }
      } else {
        addDebug('🔄 No SDK available, marking as ready');
        setIsReady(true);
      }
    } else if (!isMiniApp) {
      addDebug('🌐 Not in mini app, marking as ready');
      setIsReady(true);
    }
  };

  // Auto-ready mechanism
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

  // Emergency timeout
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (isLoading || !isReady) {
        addDebug('🚨 Emergency timeout - forcing ready state');
        setIsLoading(false);
        setIsReady(true);
      }
    }, 15000); // Shorter emergency timeout

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

