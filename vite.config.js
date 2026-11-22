import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
  },
  // This section fixes the Render "Blocked request" error for your domains
  preview: {
    allowedHosts: [
      'kaztalacademycbt.onrender.com', // Your new specific Render URL
      'cbt-portal-a4iu.onrender.com',  // Keeping the old one just in case
      '.onrender.com',                 // Allows any Render URL (future-proof)
      'localhost'
    ]
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['framer-motion'],
          'icons-vendor': ['@heroicons/react'],
        },
      },
    },
  },
  publicDir: 'public', // ensures manifest.json, sw.js, offline.html are copied
});