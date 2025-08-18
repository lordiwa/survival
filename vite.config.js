import { defineConfig } from 'vite';

export default defineConfig({
    // Development server config
    server: {
        port: 3000,
        open: true, // Auto-open browser
    },

    // Build config
    build: {
        outDir: 'dist',
        assetsDir: 'assets',

        // Optimize for game performance
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        }
    },

    // Asset handling
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.mp3', '**/*.ogg']
});