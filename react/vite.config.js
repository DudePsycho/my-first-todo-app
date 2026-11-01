// Vite settings: the tool that runs the React version while we work on it,
// and packs it into plain files for the internet when it's finished
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],   // teaches Vite to understand React's JSX (HTML written inside JavaScript)
  base: "./",           // the packed files work from any folder, e.g. .../my-first-todo-app/app/
  build: {
    outDir: "../app",   // "npm run build" packs the app into the app/ folder, which the live site serves
    emptyOutDir: true   // clear out the old packed files first
  }
});
