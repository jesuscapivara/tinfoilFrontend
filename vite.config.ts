import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";


const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 3000, // Força o Vite a usar a porta 3000 (alinha com backend)
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    proxy: {
      // Proxy para evitar CORS em desenvolvimento
      // Redireciona chamadas /api locais para o backend
      '/api': {
        target: process.env.VITE_BACKEND_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/indexing-status': {
        target: process.env.VITE_BACKEND_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/health': {
        target: process.env.VITE_BACKEND_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/refresh': {
        target: process.env.VITE_BACKEND_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
      '/bridge': {
        target: process.env.VITE_BACKEND_API_URL || 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
      },
    },
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
