import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({ plugins: [react()], base: "./" /* UPDATE: keep "./" for GitHub Pages under any repository name */ });
