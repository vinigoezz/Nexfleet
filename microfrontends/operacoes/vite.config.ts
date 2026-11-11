import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// No modo biblioteca o Vite não substitui process.env.NODE_ENV (usado pelo React);
// sem isto o navegador lança "process is not defined" ao carregar o microfrontend.
export default defineConfig(({ mode }) => ({
  define: { "process.env.NODE_ENV": JSON.stringify(mode) },
  plugins: [react()],
  server: { host: "127.0.0.1", port: 5175, strictPort: true, cors: true },
  build: {
    lib: { entry: "src/entry.tsx", formats: ["es"], fileName: "remoteEntry" },
  },
}));
