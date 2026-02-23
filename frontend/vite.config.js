import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    hmr: {
      port: 5173,
    },
  },
  customLogger: {
    ...console,
    warn: (msg, options) => {
      // Silence Web3Modal/Coinbase "util" externalized warnings
      if (msg.includes('Module "util" has been externalized')) return;
      if (msg.includes('Lit is in dev mode')) return;
      if (msg.includes('Multiple versions of Lit loaded')) return;
    },
    error: (msg, options) => {
      // Route remaining errors to standard console
      console.error(msg, options);
    }
  }
});
