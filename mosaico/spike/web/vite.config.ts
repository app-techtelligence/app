import { defineConfig } from "vite";

export default defineConfig({
  server: {
    // The PTY bridge serves the built app itself; in dev we proxy the socket to it so
    // the page works identically from `pnpm dev` and from the bridge's own port.
    proxy: { "/ws": { target: "ws://127.0.0.1:7333", ws: true } },
  },
  build: { target: "es2022", outDir: "dist", emptyOutDir: true },
});
