import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { resolve } from "path";

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const config = {
    plugins: [react(), tailwindcss],
    // Set base to '/' for both development and production
    // We'll handle the production path differently if needed
    base: "/",
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      rollupOptions: {
        input: {
          main: resolve(__dirname, "index.html"),
        },
        output: {
          assetFileNames: "assets/[name]-[hash][extname]",
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
        },
      },
    },
    server: {
      port: 3000,
      host: "localhost",
      strictPort: true,
      open: true,
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
    resolve: {
      alias: {
        "@": "/src",
        "@assets": "/src/assets",
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/test/setup.js"],
      coverage: {
        reporter: ["text", "json", "html"],
      },
    },
    preview: {
      port: 3000,
      strictPort: true,
      cors: true,
      headers: {
        "Access-Control-Allow-Origin": "*",
      },
    },
  };

  return config;
});
