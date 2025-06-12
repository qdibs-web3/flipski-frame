// src/App.js
import React, { useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MiniAppWrapper from './components/MiniAppWrapper';
import MobileDebugger from './components/MobileDebugger';
import LandingPage from './pages/LandingPage';
import CoinFlipPage from './pages/CoinFlipPage';
import FlipskiCoinPage from './pages/FlipskiCoinPage'; // Import the new page
import { useEnhancedWallet } from './context/EnhancedWalletProvider';
import './styles/App.css';

function App() {
  const { isMiniApp, isLoading } = useEnhancedWallet();
  const navigate = useNavigate();
  const location = useLocation();

  // Auto-redirect to game page in mini app mode
  useEffect(() => {
    if (!isLoading && isMiniApp && location.pathname === '/') {
      console.log('Mini app detected, redirecting to /flipski');
      navigate('/flipski', { replace: true });
    }
  }, [isMiniApp, isLoading, location.pathname, navigate]);

  return (
    <MiniAppWrapper>
      <MobileDebugger />
      {!isMiniApp && <Navbar />}
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/flipski" element={<CoinFlipPage />} />
        <Route path="/flipski-coin" element={<FlipskiCoinPage />} /> {/* Add route for the new page */}
      </Routes>
      {!isMiniApp && <Footer />}
    </MiniAppWrapper>
  );
}

export default App;

