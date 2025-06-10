// Disabled Express.js wrapper for serverless functions
// This file is no longer needed as we're using individual serverless functions

module.exports = (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found. Use specific serverless function endpoints.',
    availableEndpoints: [
      '/api/users/leaderboard',
      '/api/users/{walletAddress}',
      '/api/users/{walletAddress}/update-xp'
    ]
  });
};
