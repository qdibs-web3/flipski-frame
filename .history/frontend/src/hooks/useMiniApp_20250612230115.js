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
        addDebug('🔍 Starting environment detection...');
        setIsLoading(true);
        
        // Check if we're in a browser environment first
        if (typeof window === 'undefined') {
          addDebug('❌ Not in browser environment');
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
          addDebug('⚠️ Cross-origin hostname check failed (expected in mini app)');
          hasFarcasterWindow = isInFrame; // If we can't check, assume mini app if in frame
        }

        addDebug(`🔍 Detection checks: UA=${hasFarcasterUA}, Frame=${isInFrame}, Params=${hasFarcasterParams}, Window=${hasFarcasterWindow}`);

        // If any of these indicators suggest Farcaster, try SDK detection
        if (hasFarcasterUA || hasFarcasterParams || hasFarcasterWindow || isInFrame) {
          try {
            addDebug('📦 Attempting to load Farcaster SDK...');
            const { sdk: importedSdk } = await import('@farcaster/frame-sdk');
            
            addDebug('✅ SDK loaded, checking if in Mini App...');
            
            // Use the SDK's detection method with longer timeout for mobile
            const sdkResult = await Promise.race([
              importedSdk.isInMiniApp(),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('SDK timeout')), 5000) // Even longer timeout
              )
            ]);
            
            addDebug(`🎯 SDK detection result: ${sdkResult}`);
            
            if (sdkResult) {
              miniAppDetected = true;
              farcasterSdk = importedSdk;
              addDebug('✅ Mini app detected via SDK');
            }
            
          } catch (sdkError) {
            addDebug(`⚠️ SDK detection failed: ${sdkError.message}`);
            
            // Fallback: if we have strong indicators, assume mini app AND try to load SDK
            if (hasFarcasterUA || hasFarcasterParams || isInFrame) {
              addDebug('🔄 Fallback: Assuming Farcaster mini app based on context');
              miniAppDetected = true;
              
              // CRITICAL: Try to load SDK even if detection failed
              try {
                addDebug('📦 Loading SDK in fallback mode...');
                const { sdk: fallbackSdk } = await import('@farcaster/frame-sdk');
                farcasterSdk = fallbackSdk;
                addDebug('✅ SDK loaded successfully in fallback mode');
              } catch (fallbackSdkError) {
                addDebug(`❌ Failed to load SDK in fallback mode: ${fallbackSdkError.message}`);
              }
            }
          }
        }

        // Final fallback for development/testing - if in frame, likely mini app
        if (!miniAppDetected && isInFrame) {
          addDebug('🔄 Frame detected, assuming mini app for development');
          miniAppDetected = true;
          
          // CRITICAL: Also try to load SDK for development scenarios
          if (!farcasterSdk) {
            try {
              addDebug('📦 Loading SDK for development scenario...');
              const { sdk: devSdk } = await import('@farcaster/frame-sdk');
              farcasterSdk = devSdk;
              addDebug('✅ SDK loaded for development scenario');
            } catch (devSdkError) {
              addDebug(`❌ Failed to load SDK for development: ${devSdkError.message}`);
            }
          }
        }

        addDebug(`🎯 Final detection result: ${miniAppDetected}`);
        
        setIsMiniApp(miniAppDetected);
        setSdk(farcasterSdk);
        setError(null);
        
      } catch (err) {
        addDebug(`❌ Error detecting Mini App environment: ${err.message}`);
        
        // Even if detection fails, if we're in a frame, assume mini app
        const isInFrame = window.location !== window.parent.location || window.frameElement !== null;
        if (isInFrame) {
          addDebug('🔄 Detection failed but in frame - assuming mini app');
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

  // AGGRESSIVE ready call with multiple strategies
  const callReady = async () => {
    if (isMiniApp && !isReady) {
      addDebug('🚀 Starting aggressive ready sequence...');
      let workingSdk = sdk;
      
      // Strategy 1: Try to load SDK if not available
      if (!workingSdk) {
        try {
          addDebug('📦 No SDK available, attempting to load SDK for ready call...');
          const { sdk: loadedSdk } = await import('@farcaster/frame-sdk');
          workingSdk = loadedSdk;
          setSdk(loadedSdk);
          addDebug('✅ SDK loaded successfully for ready call');
        } catch (sdkLoadError) {
          addDebug(`❌ Failed to load SDK for ready call: ${sdkLoadError.message}`);
        }
      }
      
      // Strategy 2: Immediate ready call (aggressive approach)
      if (workingSdk) {
        try {
          addDebug('⚡ IMMEDIATE ready call attempt...');
          await workingSdk.actions.ready({});
          addDebug('✅ IMMEDIATE ready call successful!');
          setIsReady(true);
          return; // If immediate works, we're done
        } catch (immediateError) {
          addDebug(`⚠️ Immediate ready failed: ${immediateError.message}`);
        }
      }
      
      // Strategy 3: Official demo pattern (if immediate failed)
      if (workingSdk) {
        try {
          addDebug('🔄 Trying official demo pattern...');
          
          // Get context
          addDebug('📋 Getting SDK context...');
          const context = await workingSdk.context;
          addDebug('✅ SDK context loaded');
          
          // Set up ethereum provider
          addDebug('🔗 Setting up ethereum provider...');
          const ethereumProvider = await workingSdk.wallet.getEthereumProvider();
          if (ethereumProvider) {
            ethereumProvider.on("chainChanged", (chainId) => {
              addDebug(`🔄 Chain changed: ${chainId}`);
            });
            addDebug('✅ Ethereum provider set up');
          }
          
          // Set up event listeners
          addDebug('👂 Setting up SDK event listeners...');
          workingSdk.on("frameAdded", ({ notificationDetails }) => {
            addDebug('📱 Frame added event');
          });
          
          workingSdk.on("frameAddRejected", ({ reason }) => {
            addDebug(`❌ Frame add rejected: ${reason}`);
          });
          
          workingSdk.on("frameRemoved", () => {
            addDebug('📱 Frame removed');
          });
          
          // NOW call ready() - official pattern
          addDebug('🎯 Official pattern ready call...');
          await workingSdk.actions.ready({});
          addDebug('✅ Official pattern ready call successful!');
          setIsReady(true);
          
        } catch (officialError) {
          addDebug(`⚠️ Official pattern failed: ${officialError.message}`);
          
          // Strategy 4: Fallback ready calls
          const fallbackStrategies = [
            () => workingSdk.actions.ready(),
            () => workingSdk.actions.ready({}),
            () => workingSdk.actions.ready({ theme: 'light' }),
            () => workingSdk.actions.ready({ theme: 'dark' })
          ];
          
          for (let i = 0; i < fallbackStrategies.length; i++) {
            try {
              addDebug(`🔄 Fallback strategy ${i + 1}...`);
              await fallbackStrategies[i]();
              addDebug(`✅ Fallback strategy ${i + 1} successful!`);
              setIsReady(true);
              return;
            } catch (fallbackError) {
              addDebug(`⚠️ Fallback strategy ${i + 1} failed: ${fallbackError.message}`);
            }
          }
        }
      }
      
      // Strategy 5: Force ready state if all else fails
      addDebug('🔄 All strategies failed, forcing ready state...');
      setIsReady(true);
      
    } else if (!isMiniApp) {
      addDebug('🌐 Not in mini app, marking as ready');
      setIsReady(true);
    }
  };

  // Auto-retry mechanism for mobile
  useEffect(() => {
    if (isMiniApp && !isReady && !isLoading) {
      addDebug('⏰ Setting up auto-retry for ready call...');
      const retryTimer = setTimeout(() => {
        addDebug('🔄 Auto-retry triggered');
        callReady();
      }, 2000);
      
      return () => clearTimeout(retryTimer);
    }
  }, [isMiniApp, isReady, isLoading]);

  return {
    isMiniApp,
    isLoading,
    error,
    sdk,
    isReady,
    callReady,
    debugInfo // Expose debug info for visual display
  };
};

