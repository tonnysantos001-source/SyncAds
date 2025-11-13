import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Otimizações de build
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"],
      },
      format: {
        comments: false, // Remove comentários
      },
    },
    // Code splitting manual
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendors principais
          "vendor-react": ["react", "react-dom", "react-router-dom"],

          // UI Components
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-slot",
            "@radix-ui/react-label",
            "@radix-ui/react-checkbox",
            "@radix-ui/react-switch",
            "@radix-ui/react-progress",
          ],

          // Charts e visualização
          "vendor-charts": ["recharts"],

          // Forms
          "vendor-forms": ["react-hook-form", "zod", "@hookform/resolvers"],

          // Query e state
          "vendor-query": ["@tanstack/react-query", "zustand"],

          // Animations
          "vendor-animation": ["framer-motion"],

          // Icons
          "vendor-icons": ["lucide-react", "react-icons"],

          // Utilities
          "vendor-utils": [
            "date-fns",
            "clsx",
            "tailwind-merge",
            "class-variance-authority",
          ],

          // Supabase
          "vendor-supabase": ["@supabase/supabase-js"],
        },
        // Naming pattern para chunks
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Otimizações adicionais
    chunkSizeWarningLimit: 1000, // Aumentar limite de warning
    sourcemap: false, // Desabilitar sourcemaps em produção
    cssCodeSplit: true, // Split CSS por chunk
    reportCompressedSize: false, // Mais rápido em CI/CD
  },
  // Otimizações de servidor dev
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: true,
    },
  },
  // Otimizações de preview
  preview: {
    port: 4173,
    strictPort: false,
    host: true,
  },
  // Otimizações de dependências
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query",
    ],
    exclude: ["@supabase/functions-js"],
  },
});
