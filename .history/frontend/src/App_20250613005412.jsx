// Enhanced App.jsx with mobile WebView fixes
import React, { useEffect, useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MiniAppWrapper from './components/MiniAppWrapper';
import MobileDebugger from './components/MobileDebugger';
import LandingPage from './pages/LandingPage';
import CoinFlipPage from './pages/CoinFlipPage';
import FlipskiCoinPage from './pages/FlipskiCoinPage';
import { useEnhancedWallet } from './context/EnhancedWalletProvider';
import './styles/App.css';

function App() {
  const { isMiniApp, isLoading } = useEnhancedWallet();
  const navigate = useNavigate();
  const location = useLocation();
  const [redirectAttempted, setRedirectAttempted] = useState(false);
  const [forceNavigation, setForceNavigation] = useState(false);

  // MOBILE FIX: Enhanced auto-redirect with multiple strategies
  useEffect(() => {
    if (!isLoading && isMiniApp && location.pathname === '/' && !redirectAttempted) {
      console.log('Mini app detected, attempting redirect to /flipski');
      setRedirectAttempted(true);
      
      // Strategy 1: Immediate navigation
      try {
        navigate('/flipski', { replace: true });
        console.log('Immediate navigation attempted');
      } catch (navError) {
        console.error('Immediate navigation failed:', navError);
      }
      
      // Strategy 2: Delayed navigation (mobile WebView might need time)
      setTimeout(() => {
        try {
          if (location.pathname === '/') {
            console.log('Delayed navigation attempt');
            navigate('/flipski', { replace: true });
          }
        } catch (delayedNavError) {
          console.error('Delayed navigation failed:', delayedNavError);
          // Strategy 3: Force navigation via state
          setForceNavigation(true);
        }
      }, 500);
      
      // Strategy 4: Emergency navigation
      setTimeout(() => {
        if (location.pathname === '/') {
          console.log('Emergency navigation - forcing state change');
          setForceNavigation(true);
        }
      }, 2000);
    }
  }, [isMiniApp, isLoading, location.pathname, navigate, redirectAttempted]);

  // MOBILE FIX: Force navigation fallback
  useEffect(() => {
    if (forceNavigation && isMiniApp) {
      console.log('Force navigation activated');
      // Use window.location as last resort
      try {
        window.history.pushState({}, '', '/flipski');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (historyError) {
        console.error('History API failed:', historyError);
      }
    }
  }, [forceNavigation, isMiniApp]);

  // MOBILE FIX: Emergency timeout to force app progression
  useEffect(() => {
    if (isMiniApp) {
      const emergencyTimer = setTimeout(() => {
        if (location.pathname === '/' && !forceNavigation) {
          console.log('Emergency: Forcing navigation after 5 seconds');
          setForceNavigation(true);
        }
      }, 5000);
      
      return () => clearTimeout(emergencyTimer);
    }
  }, [isMiniApp, location.pathname, forceNavigation]);

  // MOBILE FIX: Render game page directly if force navigation is active
  if (forceNavigation && isMiniApp) {
    console.log('Rendering CoinFlipPage directly due to force navigation');
    return (
      <MiniAppWrapper>
        <MobileDebugger />
        <CoinFlipPage />
      </MiniAppWrapper>
    );
  }

  return (
    <MiniAppWrapper>
      <MobileDebugger />
      {!isMiniApp && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/flipski" element={<CoinFlipPage />} />
        <Route path="/flipski-coin" element={<FlipskiCoinPage />} />
      </Routes>
      {!isMiniApp && <Footer />}
    </MiniAppWrapper>
  );
}

export default App;

