import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Используем имя репозитория в качестве базового пути при деплое на GitHub Pages
// и '/' для разработки
const base = process.env.NODE_ENV === 'production' ? '/HD2-utils/' : '/';

export default defineConfig({
  plugins: [react()],
  base, // Устанавливаем базовый путь для всех ресурсов
  root: './',
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
  },
  assetsInclude: ['**/*.gltf', '**/*.glb'],
});