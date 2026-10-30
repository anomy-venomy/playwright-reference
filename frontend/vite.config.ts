import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:4000';

  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_PORT) || 5173,
      strictPort: true,
      // Proxy API and uploaded files to the backend so the browser sees a single origin
      // (cookies just work, no CORS in the browser).
      proxy: {
        '/api': apiTarget,
        '/uploads': apiTarget,
      },
    },
    preview: {
      port: 4173,
      proxy: { '/api': apiTarget, '/uploads': apiTarget },
    },
  };
});
