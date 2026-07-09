/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
  resolve: {
    alias: {
      'react': resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      '@testing-library/react': resolve(__dirname, 'node_modules/@testing-library/react'),
      'ajv': resolve(__dirname, 'node_modules/ajv'),
      'ajv-formats': resolve(__dirname, 'node_modules/ajv-formats'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    include: ['../tests/**/*.test.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  },
});
