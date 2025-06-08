// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { nodePolyfills } from "vite-plugin-node-polyfills";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: '0.0.0.0', // Bind to all interfaces for external access
    port: 5173, // Explicit port
    strictPort: true, // Fail if port is already in use
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '.trycloudflare.com', // Allow all cloudflare tunnel subdomains
      '.ngrok.io', // Allow ngrok tunnels as well
      '.loca.lt', // Allow localtunnel
    ],
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  plugins: [
    react(),
    nodePolyfills({
      exclude: [],
      protocolImports: true,
    }),
  ],
  esbuild: {
    loader: "jsx",
    include: [/src\/.*\.jsx$/, /src\/.*\.js$/],
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
      },
    },
    include: ['@thirdweb-dev/react', '@thirdweb-dev/chains'],
  },
  build: {
    sourcemap: true, // Enable source maps for debugging
    rollupOptions: {
      // Ensure external dependencies are properly handled
      external: [],
      output: {
        manualChunks: {
          'thirdweb': ['@thirdweb-dev/react', '@thirdweb-dev/chains'],
          'viem': ['viem'],
        }
      }
    }
  },
  // Additional configuration for better compatibility
  define: {
    global: 'globalThis',
  },
});

