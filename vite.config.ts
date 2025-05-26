
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on mode (development, production) in the current working directory
  // The third argument '' makes it load all environment variables from .env files, not just VITE_ prefixed ones
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    define: {
      // Make API_KEY from .env available as process.env.API_KEY in client code
      // JSON.stringify is important to correctly stringify the value
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // You can define other process.env variables here if needed
      // 'process.env.NODE_ENV': JSON.stringify(mode),
    },
    // Vite's server options (optional, defaults are usually fine)
    server: {
      port: 5173, // Default Vite port
      open: true, // Automatically open in browser
    },
  };
});
