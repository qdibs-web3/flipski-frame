// Test utility to simulate Mini App environment
export const simulateMiniAppEnvironment = () => {
  // Mock the Farcaster SDK
  window.farcasterSDK = {
    isInMiniApp: () => Promise.resolve(true),
    wallet: {
      getEthereumProvider: () => {
        // Return existing window.ethereum or mock provider
        return window.ethereum || {
          request: async (params) => {
            console.log('Mock wallet request:', params);
            // Mock responses for testing
            if (params.method === 'eth_accounts') {
              return ['0x742d35Cc6634C0532925a3b8D0C4E5C3C2c4c4c4'];
            }
            if (params.method === 'eth_chainId') {
              return '0x2105'; // Base mainnet
            }
            return null;
          },
          on: (event, handler) => console.log('Mock event listener:', event),
          removeListener: (event, handler) => console.log('Mock remove listener:', event)
        };
      }
    },
    actions: {
      ready: () => console.log('Mini App ready'),
      share: (data) => console.log('Mock share:', data)
    },
    notifications: {
      getPermission: () => Promise.resolve('granted'),
      requestPermission: () => Promise.resolve('granted'),
      send: (data) => console.log('Mock notification:', data)
    }
  };

  // Add URL parameter to simulate Mini App context
  const url = new URL(window.location);
  url.searchParams.set('miniApp', 'true');
  window.history.replaceState({}, '', url);
};

export const resetEnvironment = () => {
  delete window.farcasterSDK;
  const url = new URL(window.location);
  url.searchParams.delete('miniApp');
  window.history.replaceState({}, '', url);
};