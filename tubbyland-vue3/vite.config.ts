import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@/': path.resolve(__dirname, 'src/'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/assets': path.resolve(__dirname, 'src/assets'),
      '@/pages': path.resolve(__dirname, 'src/pages'),
      '@/ArtPage': path.resolve(__dirname, 'src/pages/root/Art'),
      '&/deploy': path.resolve(__dirname, 'deploy/')
    }
  },
  build: {
    outDir: 'deploy/dist'
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true
  }
})
