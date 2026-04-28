import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// root apunta a src/view donde vive index.html
export default defineConfig({
    root: 'src/view',
    base: './',
    plugins: [react()],
    server: {
        port: 5173,
        strictPort: true,
    },
    build: {
        outDir: '../../dist-renderer',
        emptyOutDir: true,
    },
})
