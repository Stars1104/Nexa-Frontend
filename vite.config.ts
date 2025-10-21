import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { webcrypto as nodeWebCrypto } from "node:crypto";

// Ensure Web Crypto API is available for Vite/plugins during Node execution
// Some environments might not expose global crypto by default
if (typeof (globalThis as any).crypto === 'undefined' && nodeWebCrypto) {
  (globalThis as any).crypto = nodeWebCrypto as unknown as Crypto;
}

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
  base : "/"
}));