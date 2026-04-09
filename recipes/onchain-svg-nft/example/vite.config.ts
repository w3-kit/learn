import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  server: { port: 3333 },
  resolve: { tsconfigPaths: true },
  plugins: [tanstackStart(), nitro(), viteReact(), tailwindcss()],
});
