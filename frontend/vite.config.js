import { defineConfig } from "vite";
import { dirname } from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";

const proxyOptions = {
  target: `http://127.0.0.1:${process.env.BACKEND_PORT}`,
  changeOrigin: false,
  secure: true,
  ws: false,
};

const host = process.env.HOST
  ? process.env.HOST.replace(/https?:\/\//, "")
  : "localhost";

const extensionUrl = process.env.EXTENSION_BASE_URL;
let allowedHost = '';

try {
  allowedHost = new URL(extensionUrl).hostname;
} catch (e) {
  console.warn('Invalid EXTENSION_BASE_URL provided:', extensionUrl);
}




let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: process.env.FRONTEND_PORT,
    clientPort: 443,
  };
}

export default defineConfig({
  root: dirname(fileURLToPath(import.meta.url)),
  plugins: [react()],
  resolve: {
    preserveSymlinks: true,
  },
  build: {
    outDir: 'public/dist'
  },
  server: {
    host: "localhost",
    port: process.env.FRONTEND_PORT,
    allowedHosts: allowedHost ? [allowedHost] : [],
    proxy: {
      '^/(\\?.*)?$': proxyOptions,
      '^/api(/|(\\?.*)?$)': proxyOptions,
      '^/fp(/|(\\?.*)?$)': proxyOptions,
      '^/adm(/|(\\?.*)?$)': proxyOptions,
      '^/protected(/|(\\?.*)?$)': proxyOptions,
      '^/v1(/|(\\?.*)?$)': proxyOptions,
      '^/payment(/|(\\?.*)?$)': proxyOptions,
      '^/creds(/|(\\?.*)?$)': proxyOptions
    },
  },
});