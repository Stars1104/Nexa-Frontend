import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "0.0.0.0",
    port: 5000,
    allowedHosts: ["nexacreators.com.br", "www.nexacreators.com.br"],
  },

  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve("./src"),
    },
    dedupe: ["react", "react-dom", "react-redux"],
  },

  base: "/",

  build: {
    sourcemap: mode === "development",

    minify: "terser",

    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: mode === "production",
      },
    },

    chunkSizeWarningLimit: 1500,

    rollupOptions: {
      output: {
        manualChunks: {
          // React core (MUST stay together)
          "react-vendor": [
            "react",
            "react-dom",
            "react-redux",
          ],

          // Router
          "router-vendor": [
            "react-router-dom",
          ],

          // Redux toolkit
          "redux-vendor": [
            "@reduxjs/toolkit",
            "redux-persist",
          ],

          // Stripe
          "stripe-vendor": [
            "@stripe/react-stripe-js",
            "@stripe/stripe-js",
          ],

          // UI libs
          "radix-vendor": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-select",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-alert-dialog",
            "@radix-ui/react-tabs",
            "@radix-ui/react-switch",
            "@radix-ui/react-avatar",
            "@radix-ui/react-progress",
            "@radix-ui/react-accordion",
            "@radix-ui/react-label",
            "@radix-ui/react-separator",
            "@radix-ui/react-popover",
            "@radix-ui/react-scroll-area",
            "@radix-ui/react-aspect-ratio",
            "@radix-ui/react-slot",
          ],

          // Tanstack
          "tanstack-vendor": [
            "@tanstack/react-query",
          ],

          // Socket
          "socket-vendor": [
            "socket.io-client",
          ],

          // Default vendor
          vendor: ["axios", "clsx", "date-fns", "sonner"],
        },
      },
    },
  },

  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-redux",
      "react-router-dom",
    ],
    esbuildOptions: {
      target: "esnext",
    },
  },
}));
