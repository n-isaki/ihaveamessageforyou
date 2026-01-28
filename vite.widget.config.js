import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    define: {
        'process.env.NODE_ENV': '"production"'
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    build: {
        outDir: 'dist/widget',
        emptyOutDir: true,
        lib: {
            entry: path.resolve(__dirname, 'src/embed/main.jsx'),
            name: 'AnimaWidget',
            fileName: () => 'widget.js',
            formats: ['iife']
        },
        rollupOptions: {
            output: {
                assetFileNames: 'widget.[ext]',
            }
        }
    }
});
