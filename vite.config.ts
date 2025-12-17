import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode, command }) => {
  const plugins = [react()];
  
  // Only add express plugin in dev/serve mode
  if (command === "serve") {
    plugins.push(expressPlugin());
  }
  
  return {
    server: {
      host: "::",
      port: 8080,
      fs: {
        allow: [".", "./client", "./shared"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
      },
    },
    build: {
      outDir: "dist/spa",
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve",
    async configureServer(server) {
      // Lazy load server only in dev mode - use string literal to avoid static analysis
      const serverPath = `./server/index.ts`;
      const { createServer } = await import(serverPath);
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}
