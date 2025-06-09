import React, { useState, useEffect } from 'react';
import '../styles/LevelSystem.css';
import axios from 'axios';
import { useEnhancedWallet } from '../context/EnhancedWalletProvider';

// API base URL - automatically adjusts for development or production
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api' 
  : 'http://localhost:3001/api';

const LevelSystem = ({ walletAddress, gameResult }) => {
  const { isMiniApp } = useEnhancedWallet();
  
  // State
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [nextLevelXp, setNextLevelXp] = useState(10);
  const [processedGameIds, setProcessedGameIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Load data when wallet connects
  useEffect(() => {
    if (!walletAddress) return;
    
    const fetchUserData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.get(`${API_BASE_URL}/users/${walletAddress}`);
        const userData = response.data;
        
        setXp(userData.xp);
        setLevel(userData.level);
        setNextLevelXp(userData.nextLevelXp);
        setProcessedGameIds(userData.processedGameIds);
      } catch (error) {
        console.error("Error loading user data:", error);
        setError("Failed to load user data. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [walletAddress]);
  
  // Process game results
  useEffect(() => {
    if (!walletAddress || !gameResult || !gameResult.gameId) return;
    
    // Skip if already processed locally - with defensive check for processedGameIds
    if (Array.isArray(processedGameIds) && processedGameIds.includes(gameResult.gameId)) {
      return;
    }
    
    const updateUserXp = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await axios.post(`${API_BASE_URL}/users/${walletAddress}/update-xp`, {
          gameId: gameResult.gameId,
          won: gameResult.won
        });
        
        const updatedData = response.data;
        
        // Update state with new data from server
        setXp(updatedData.xp);
        setLevel(updatedData.level);
        setNextLevelXp(updatedData.nextLevelXp);
        setProcessedGameIds(updatedData.processedGameIds);
      } catch (error) {
        console.error("Error updating XP:", error);
        setError("Failed to update XP. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };
    
    updateUserXp();
  }, [walletAddress, gameResult, processedGameIds]);
  
  // Calculate progress percentage
  const progressPercentage = (() => {
    const levelStartXp = (level - 1) * 10;
    const xpInCurrentLevel = xp - levelStartXp;
    return Math.min(Math.max((xpInCurrentLevel / 10) * 100, 1), 100);
  })();
  
  // Mini app specific styling
  const miniAppStyle = isMiniApp ? {
    width: 'calc(35% - 8px)',
    maxWidth: '140px',
    padding: '6px 8px',
    fontSize: '11px',
    top: '8px',
    left: '8px'
  } : {};
  
  return (
    <div className={`level-system ${isMiniApp ? 'mini-app-mode' : ''}`} 
         style={{ 
           maxWidth: isMiniApp ? '140px' : '560px', 
           minWidth: isMiniApp ? '120px' : '200px',
           ...miniAppStyle
         }}>
      {isLoading && <div className="loading-indicator">Loading...</div>}
      {error && <div className="error-message">{error}</div>}
      
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: isMiniApp ? '4px' : '8px'
      }}>
        <p className="level-title" style={{ 
          margin: 0, 
          fontSize: isMiniApp ? '10px' : '16px' 
        }}>
          Lv: {level}
        </p>
        <p className="xp-info" style={{ 
          margin: 0, 
          fontSize: isMiniApp ? '9px' : '14px' 
        }}>
          {xp}/{nextLevelXp}
        </p>
      </div>
      
      <div style={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: isMiniApp ? '4px' : '8px'
      }}>
        {/* Current level - inline with progress bar */}
        <span style={{
          fontSize: isMiniApp ? '10px' : '16px', 
          color: '#ffffff', 
          minWidth: isMiniApp ? '8px' : '10px'
        }}>
          {level}
        </span>
        
        {/* Progress bar with inline styles */}
        <div style={{
          flex: 1,
          height: isMiniApp ? '6px' : '10px',
          backgroundColor: '#333',
          borderRadius: '5px',
          overflow: 'hidden',
        }}>
          <div style={{
            width: `${progressPercentage}%`,
            height: '100%',
            backgroundColor: '#39ff14',
            borderRadius: '5px 0 0 5px',
            minWidth: '2px'
          }}></div>
        </div>
        
        {/* Next level - inline with progress bar */}
        <span style={{
          fontSize: isMiniApp ? '10px' : '16px', 
          color: '#ffffff', 
          minWidth: isMiniApp ? '8px' : '10px', 
          textAlign: 'right'
        }}>
          {level < 100 ? level + 1 : 'MAX'}
        </span>
      </div>
    </div>
  );
};

export default LevelSystem;
