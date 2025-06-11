// api/manifest.js - Serverless function to serve the manifest
export default function handler(req, res) {
  // Set proper headers for JSON response
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'public, max-age=3600');
  
  // Return the manifest JSON
  const manifest = {
    "frame": {
      "version": "1",
      "name": "FLIPSKI",
      "iconUrl": "https://flipski-frame.vercel.app/miniApp1024.png",
      "homeUrl": "https://flipski-frame.vercel.app/flipski",
      "splashImageUrl": "https://flipski-frame.vercel.app/miniApp200.png",
      "splashBackgroundColor": "#1a1a1a",
      "subtitle": "Blockchain Coin Flip Game",
      "description": "Bet ETH on coin flips using Base network. Fair, fast, and fun blockchain gaming with instant payouts and provable randomness.",
      "heroImageUrl": "https://flipski-frame.vercel.app/miniAppHero.png",
      "tagline": "Flip. Bet. Win. On Base.",
      "ogTitle": "FLIPSKI - Blockchain Coin Flip",
      "ogDescription": "The ultimate blockchain coin flip game on Base network. Bet ETH and win instantly!",
      "ogImageUrl": "https://flipski-frame.vercel.app/miniAppHero.png",
      "screenshotUrls": [
        "https://flipski-frame.vercel.app/miniApp1024.png"
      ],
      "primaryCategory": "games",
      "tags": ["gaming", "crypto", "betting", "base", "ethereum"],
      "requiredChains": ["eip155:8453"],
      "requiredCapabilities": [
        "actions.signIn",
        "wallet.getEthereumProvider"
      ]
    }
  };
  
  res.status(200).json(manifest);
}