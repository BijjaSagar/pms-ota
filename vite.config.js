import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      // Dev: the app calls /api/v1/... on its own origin and Vite forwards it to the NestJS backend.
      // Same origin = no CORS preflights, and the httpOnly refresh cookies just work.
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:3000',
          changeOrigin: false, // keep Origin: http://localhost:5173 (the backend checks it on /refresh)
        },
      },
    },
  };
});
