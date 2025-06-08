import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { EnhancedWalletProvider } from './context/EnhancedWalletProvider';
import App from './App';
import './styles/index.css';

// Simple test to bypass the wallet provider temporarily
const TestApp = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <EnhancedWalletProvider>
      <TestApp />
    </EnhancedWalletProvider>
  </React.StrictMode>,
);

