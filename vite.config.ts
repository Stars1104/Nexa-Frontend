import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: ["nexacreators.com.br", "www.nexacreators.com.br"], // ← fixed
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base : "/",
  build: {
    // Optimize build for production
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // CRITICAL: Keep React, React DOM, and React-Redux together in the same chunk
          // React-Redux uses useSyncExternalStore which requires React to be available
          // This chunk must load synchronously before any lazy-loaded components
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') ||
              id.includes('node_modules/react-redux')) {
            return 'react-vendor';
          }
          
          // Redux core libraries (but not react-redux - that's with React)
          if (id.includes('node_modules/@reduxjs') || 
              id.includes('node_modules/redux') ||
              id.includes('node_modules/redux-persist')) {
            return 'redux-vendor';
          }
          
          // React Router - can be separate but depends on React
          if (id.includes('node_modules/react-router')) {
            return 'react-router-vendor';
          }
          
          // Stripe - can be separate
          if (id.includes('node_modules/@stripe')) {
            return 'stripe-vendor';
          }
          
          // UI libraries (Radix UI, Lucide, etc.)
          if (id.includes('node_modules/@radix-ui') || 
              id.includes('node_modules/lucide-react')) {
            return 'ui-vendor';
          }
          
          // TanStack Query
          if (id.includes('node_modules/@tanstack')) {
            return 'tanstack-vendor';
          }
          
          // Socket.io
          if (id.includes('node_modules/socket.io')) {
            return 'socket-vendor';
          }
          
          // Other vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
      // Ensure proper external handling
      external: [],
    },
    chunkSizeWarningLimit: 1500,
    // Enable minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    // Enable source maps in production for debugging (optional)
    sourcemap: mode === 'development',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-redux', 'react-router-dom'],
    // Ensure React is always available
    esbuildOptions: {
      target: 'esnext',
    },
  },
}));