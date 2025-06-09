import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useEnhancedWallet } from '../context/EnhancedWalletProvider';
import '../styles/LandingPage.css';
import gif from "../assets/flipski4.gif";

const LandingPage = () => {
  const navigate = useNavigate();
  const { isMiniApp } = useEnhancedWallet();

  return (
    <div className="landing-container">
      <div className="gif-container">
        <img src={gif} alt="Flipski" className="landing-gif" />
      </div>

      <h1 className="landing-header">FLIPSKI</h1>
      
      {/* In mini app mode, only show Play Now button */}
      {isMiniApp ? (
        <button className="play-button" onClick={() => navigate('/flipski')}>
          Play Now
        </button>
      ) : (
        <>
          <button className="play-button" onClick={() => navigate('/flipski-coin')}>
            $FLIPSKI
          </button>
          <button className="play-button" onClick={() => navigate('/flipski')}>
            Play Now
          </button>
        </>
      )}
    </div>
  );
};

export default LandingPage;