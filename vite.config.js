import path from 'path'
import { defineConfig } from 'vite'
import RubyPlugin from 'vite-plugin-ruby'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  resolve: {
    alias: {
      '@css': path.resolve(__dirname, 'static/css'),
    }
  },
  plugins: [
    RubyPlugin(),
    vue()
  ],
})
