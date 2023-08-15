import path from 'path'
import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  resolve: {
    alias: {
      '@css': path.resolve(__dirname, 'static/css'),
      '@js': path.resolve(__dirname, 'static/js'),
    }
  },
  plugins: [
    RubyPlugin(),
    wasm(),
    topLevelAwait(),
    vue(),
  ],
})
