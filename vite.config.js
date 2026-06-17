import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/LumenKids/',
  plugins: [react()],
  test: { environment: 'jsdom', pool: 'vmForks' },
});
