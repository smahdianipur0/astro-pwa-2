import { defineConfig } from 'astro/config';


import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import solidJs from "@astrojs/solid-js";

// https://astro.build/config
export default defineConfig({
  integrations: [
    solidJs()
    ],
  vite: {
    plugins: [wasm(), topLevelAwait()],
    css: { transformer: 'lightningcss' },
  },
  build: {
    assetsInlineLimit: 51200,
    inlineStylesheets: 'always',
  },
});