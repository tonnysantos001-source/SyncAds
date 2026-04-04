// vite.config.ts
import path from "path";
import react from "file:///C:/Users/dinho/Documents/GitHub/SyncAds/node_modules/@vitejs/plugin-react/dist/index.js";
import { defineConfig } from "file:///C:/Users/dinho/Documents/GitHub/SyncAds/node_modules/vite/dist/node/index.js";
var __vite_injected_original_dirname = "C:\\Users\\dinho\\Documents\\GitHub\\SyncAds";
var vite_config_default = defineConfig({
  plugins: [react()],
  base: "/",
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    // Otimizações de build
    target: "esnext",
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        // Remove console.log em produção
        drop_debugger: true,
        pure_funcs: ["console.log", "console.info", "console.debug"]
      },
      format: {
        comments: false
        // Remove comentários
      }
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
            "@radix-ui/react-progress"
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
            "class-variance-authority"
          ],
          // Supabase
          "vendor-supabase": ["@supabase/supabase-js"]
        },
        // Naming pattern para chunks
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]"
      }
    },
    // Otimizações adicionais
    chunkSizeWarningLimit: 1e3,
    // Aumentar limite de warning
    sourcemap: false,
    // Desabilitar sourcemaps em produção
    cssCodeSplit: true,
    // Split CSS por chunk
    reportCompressedSize: false
    // Mais rápido em CI/CD
  },
  // Otimizações de servidor dev
  server: {
    port: 5173,
    strictPort: false,
    hmr: {
      overlay: true
    }
  },
  // Otimizações de preview
  preview: {
    port: 4173,
    strictPort: false,
    host: true
  },
  // Otimizações de dependências
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react-router-dom",
      "@supabase/supabase-js",
      "@tanstack/react-query"
    ],
    exclude: ["@supabase/functions-js"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxkaW5ob1xcXFxEb2N1bWVudHNcXFxcR2l0SHViXFxcXFN5bmNBZHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGRpbmhvXFxcXERvY3VtZW50c1xcXFxHaXRIdWJcXFxcU3luY0Fkc1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvZGluaG8vRG9jdW1lbnRzL0dpdEh1Yi9TeW5jQWRzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcbmltcG9ydCByZWFjdCBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3RcIjtcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgYmFzZTogXCIvXCIsXG4gIHJlc29sdmU6IHtcbiAgICBhbGlhczoge1xuICAgICAgXCJAXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwiLi9zcmNcIiksXG4gICAgfSxcbiAgfSxcbiAgYnVpbGQ6IHtcbiAgICAvLyBPdGltaXphXHUwMEU3XHUwMEY1ZXMgZGUgYnVpbGRcbiAgICB0YXJnZXQ6IFwiZXNuZXh0XCIsXG4gICAgbWluaWZ5OiBcInRlcnNlclwiLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfY29uc29sZTogdHJ1ZSwgLy8gUmVtb3ZlIGNvbnNvbGUubG9nIGVtIHByb2R1XHUwMEU3XHUwMEUzb1xuICAgICAgICBkcm9wX2RlYnVnZ2VyOiB0cnVlLFxuICAgICAgICBwdXJlX2Z1bmNzOiBbXCJjb25zb2xlLmxvZ1wiLCBcImNvbnNvbGUuaW5mb1wiLCBcImNvbnNvbGUuZGVidWdcIl0sXG4gICAgICB9LFxuICAgICAgZm9ybWF0OiB7XG4gICAgICAgIGNvbW1lbnRzOiBmYWxzZSwgLy8gUmVtb3ZlIGNvbWVudFx1MDBFMXJpb3NcbiAgICAgIH0sXG4gICAgfSxcbiAgICAvLyBDb2RlIHNwbGl0dGluZyBtYW51YWxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB7XG4gICAgICAgICAgLy8gVmVuZG9ycyBwcmluY2lwYWlzXG4gICAgICAgICAgXCJ2ZW5kb3ItcmVhY3RcIjogW1wicmVhY3RcIiwgXCJyZWFjdC1kb21cIiwgXCJyZWFjdC1yb3V0ZXItZG9tXCJdLFxuXG4gICAgICAgICAgLy8gVUkgQ29tcG9uZW50c1xuICAgICAgICAgIFwidmVuZG9yLXVpXCI6IFtcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWRpYWxvZ1wiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtZHJvcGRvd24tbWVudVwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2VsZWN0XCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10YWJzXCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10b2FzdFwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtdG9vbHRpcFwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3Qtc2xvdFwiLFxuICAgICAgICAgICAgXCJAcmFkaXgtdWkvcmVhY3QtbGFiZWxcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWNoZWNrYm94XCIsXG4gICAgICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1zd2l0Y2hcIixcbiAgICAgICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXByb2dyZXNzXCIsXG4gICAgICAgICAgXSxcblxuICAgICAgICAgIC8vIENoYXJ0cyBlIHZpc3VhbGl6YVx1MDBFN1x1MDBFM29cbiAgICAgICAgICBcInZlbmRvci1jaGFydHNcIjogW1wicmVjaGFydHNcIl0sXG5cbiAgICAgICAgICAvLyBGb3Jtc1xuICAgICAgICAgIFwidmVuZG9yLWZvcm1zXCI6IFtcInJlYWN0LWhvb2stZm9ybVwiLCBcInpvZFwiLCBcIkBob29rZm9ybS9yZXNvbHZlcnNcIl0sXG5cbiAgICAgICAgICAvLyBRdWVyeSBlIHN0YXRlXG4gICAgICAgICAgXCJ2ZW5kb3ItcXVlcnlcIjogW1wiQHRhbnN0YWNrL3JlYWN0LXF1ZXJ5XCIsIFwienVzdGFuZFwiXSxcblxuICAgICAgICAgIC8vIEFuaW1hdGlvbnNcbiAgICAgICAgICBcInZlbmRvci1hbmltYXRpb25cIjogW1wiZnJhbWVyLW1vdGlvblwiXSxcblxuICAgICAgICAgIC8vIEljb25zXG4gICAgICAgICAgXCJ2ZW5kb3ItaWNvbnNcIjogW1wibHVjaWRlLXJlYWN0XCIsIFwicmVhY3QtaWNvbnNcIl0sXG5cbiAgICAgICAgICAvLyBVdGlsaXRpZXNcbiAgICAgICAgICBcInZlbmRvci11dGlsc1wiOiBbXG4gICAgICAgICAgICBcImRhdGUtZm5zXCIsXG4gICAgICAgICAgICBcImNsc3hcIixcbiAgICAgICAgICAgIFwidGFpbHdpbmQtbWVyZ2VcIixcbiAgICAgICAgICAgIFwiY2xhc3MtdmFyaWFuY2UtYXV0aG9yaXR5XCIsXG4gICAgICAgICAgXSxcblxuICAgICAgICAgIC8vIFN1cGFiYXNlXG4gICAgICAgICAgXCJ2ZW5kb3Itc3VwYWJhc2VcIjogW1wiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCJdLFxuICAgICAgICB9LFxuICAgICAgICAvLyBOYW1pbmcgcGF0dGVybiBwYXJhIGNodW5rc1xuICAgICAgICBjaHVua0ZpbGVOYW1lczogXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiLFxuICAgICAgICBlbnRyeUZpbGVOYW1lczogXCJhc3NldHMvW25hbWVdLVtoYXNoXS5qc1wiLFxuICAgICAgICBhc3NldEZpbGVOYW1lczogXCJhc3NldHMvW25hbWVdLVtoYXNoXS5bZXh0XVwiLFxuICAgICAgfSxcbiAgICB9LFxuICAgIC8vIE90aW1pemFcdTAwRTdcdTAwRjVlcyBhZGljaW9uYWlzXG4gICAgY2h1bmtTaXplV2FybmluZ0xpbWl0OiAxMDAwLCAvLyBBdW1lbnRhciBsaW1pdGUgZGUgd2FybmluZ1xuICAgIHNvdXJjZW1hcDogZmFsc2UsIC8vIERlc2FiaWxpdGFyIHNvdXJjZW1hcHMgZW0gcHJvZHVcdTAwRTdcdTAwRTNvXG4gICAgY3NzQ29kZVNwbGl0OiB0cnVlLCAvLyBTcGxpdCBDU1MgcG9yIGNodW5rXG4gICAgcmVwb3J0Q29tcHJlc3NlZFNpemU6IGZhbHNlLCAvLyBNYWlzIHJcdTAwRTFwaWRvIGVtIENJL0NEXG4gIH0sXG4gIC8vIE90aW1pemFcdTAwRTdcdTAwRjVlcyBkZSBzZXJ2aWRvciBkZXZcbiAgc2VydmVyOiB7XG4gICAgcG9ydDogNTE3MyxcbiAgICBzdHJpY3RQb3J0OiBmYWxzZSxcbiAgICBobXI6IHtcbiAgICAgIG92ZXJsYXk6IHRydWUsXG4gICAgfSxcbiAgfSxcbiAgLy8gT3RpbWl6YVx1MDBFN1x1MDBGNWVzIGRlIHByZXZpZXdcbiAgcHJldmlldzoge1xuICAgIHBvcnQ6IDQxNzMsXG4gICAgc3RyaWN0UG9ydDogZmFsc2UsXG4gICAgaG9zdDogdHJ1ZSxcbiAgfSxcbiAgLy8gT3RpbWl6YVx1MDBFN1x1MDBGNWVzIGRlIGRlcGVuZFx1MDBFQW5jaWFzXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgIFwicmVhY3RcIixcbiAgICAgIFwicmVhY3QtZG9tXCIsXG4gICAgICBcInJlYWN0LXJvdXRlci1kb21cIixcbiAgICAgIFwiQHN1cGFiYXNlL3N1cGFiYXNlLWpzXCIsXG4gICAgICBcIkB0YW5zdGFjay9yZWFjdC1xdWVyeVwiLFxuICAgIF0sXG4gICAgZXhjbHVkZTogW1wiQHN1cGFiYXNlL2Z1bmN0aW9ucy1qc1wiXSxcbiAgfSxcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUFtVCxPQUFPLFVBQVU7QUFDcFUsT0FBTyxXQUFXO0FBQ2xCLFNBQVMsb0JBQW9CO0FBRjdCLElBQU0sbUNBQW1DO0FBSXpDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVMsQ0FBQyxNQUFNLENBQUM7QUFBQSxFQUNqQixNQUFNO0FBQUEsRUFDTixTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUEsSUFDdEM7QUFBQSxFQUNGO0FBQUEsRUFDQSxPQUFPO0FBQUE7QUFBQSxJQUVMLFFBQVE7QUFBQSxJQUNSLFFBQVE7QUFBQSxJQUNSLGVBQWU7QUFBQSxNQUNiLFVBQVU7QUFBQSxRQUNSLGNBQWM7QUFBQTtBQUFBLFFBQ2QsZUFBZTtBQUFBLFFBQ2YsWUFBWSxDQUFDLGVBQWUsZ0JBQWdCLGVBQWU7QUFBQSxNQUM3RDtBQUFBLE1BQ0EsUUFBUTtBQUFBLFFBQ04sVUFBVTtBQUFBO0FBQUEsTUFDWjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsZUFBZTtBQUFBLE1BQ2IsUUFBUTtBQUFBLFFBQ04sY0FBYztBQUFBO0FBQUEsVUFFWixnQkFBZ0IsQ0FBQyxTQUFTLGFBQWEsa0JBQWtCO0FBQUE7QUFBQSxVQUd6RCxhQUFhO0FBQUEsWUFDWDtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxVQUNGO0FBQUE7QUFBQSxVQUdBLGlCQUFpQixDQUFDLFVBQVU7QUFBQTtBQUFBLFVBRzVCLGdCQUFnQixDQUFDLG1CQUFtQixPQUFPLHFCQUFxQjtBQUFBO0FBQUEsVUFHaEUsZ0JBQWdCLENBQUMseUJBQXlCLFNBQVM7QUFBQTtBQUFBLFVBR25ELG9CQUFvQixDQUFDLGVBQWU7QUFBQTtBQUFBLFVBR3BDLGdCQUFnQixDQUFDLGdCQUFnQixhQUFhO0FBQUE7QUFBQSxVQUc5QyxnQkFBZ0I7QUFBQSxZQUNkO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsVUFDRjtBQUFBO0FBQUEsVUFHQSxtQkFBbUIsQ0FBQyx1QkFBdUI7QUFBQSxRQUM3QztBQUFBO0FBQUEsUUFFQSxnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxRQUNoQixnQkFBZ0I7QUFBQSxNQUNsQjtBQUFBLElBQ0Y7QUFBQTtBQUFBLElBRUEsdUJBQXVCO0FBQUE7QUFBQSxJQUN2QixXQUFXO0FBQUE7QUFBQSxJQUNYLGNBQWM7QUFBQTtBQUFBLElBQ2Qsc0JBQXNCO0FBQUE7QUFBQSxFQUN4QjtBQUFBO0FBQUEsRUFFQSxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixZQUFZO0FBQUEsSUFDWixLQUFLO0FBQUEsTUFDSCxTQUFTO0FBQUEsSUFDWDtBQUFBLEVBQ0Y7QUFBQTtBQUFBLEVBRUEsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLElBQ1osTUFBTTtBQUFBLEVBQ1I7QUFBQTtBQUFBLEVBRUEsY0FBYztBQUFBLElBQ1osU0FBUztBQUFBLE1BQ1A7QUFBQSxNQUNBO0FBQUEsTUFDQTtBQUFBLE1BQ0E7QUFBQSxNQUNBO0FBQUEsSUFDRjtBQUFBLElBQ0EsU0FBUyxDQUFDLHdCQUF3QjtBQUFBLEVBQ3BDO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
