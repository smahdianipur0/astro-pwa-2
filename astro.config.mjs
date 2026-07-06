import { defineConfig } from 'astro/config';
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";
import solidJs from "@astrojs/solid-js";
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  integrations: [solidJs()],
  vite: {
    plugins: [wasm(), topLevelAwait()],
    css: { transformer: 'lightningcss' },
    optimizeDeps: {
      exclude: ['@surrealdb/wasm'],
      esbuildOptions: { target: 'esnext' },
    },
    build: {
      minify: false,
      assetsInlineLimit: 51200,
    },
  },
  esbuild: {
    supported: { 'top-level-await': true },
  },
  build: {
    inlineStylesheets: 'always',
  },
  output: 'static',
  adapter: vercel(),
});
