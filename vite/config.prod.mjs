import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue'

const phasermsg = () => {
    return {
        name: 'phasermsg',
        buildStart() {
            process.stdout.write(`Building for production...\n`);
        },
        buildEnd() {
            const line = "---------------------------------------------------------";
            const msg = `❤️❤️❤️ Tell us about your game! - games@phaser.io ❤️❤️❤️`;
            process.stdout.write(`${line}\n${msg}\n${line}\n`);

            process.stdout.write(`✨ Done ✨\n`);
        }
    }
}

export default defineConfig({
    base: './',
    plugins: [
        vue(),
        phasermsg()
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('../src', import.meta.url)),
            '@tests': fileURLToPath(new URL('../src/tests', import.meta.url)),
            '@game': fileURLToPath(new URL('../src/game', import.meta.url)),
            '@api': fileURLToPath(new URL('../src/game/api', import.meta.url)),
            '@scenes': fileURLToPath(new URL('../src/game/scenes', import.meta.url)),
            '@ui': fileURLToPath(new URL('../src/game/ui', import.meta.url)),
            '@utils': fileURLToPath(new URL('../src/game/utils', import.meta.url)),
            '@mocks': fileURLToPath(new URL('../src/tests/mocks', import.meta.url)),
        }
    },
    logLevel: 'warning',
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    phaser: ['phaser']
                }
            }
        },
        minify: 'terser',
        terserOptions: {
            compress: {
                passes: 2
            },
            mangle: true,
            format: {
                comments: false
            }
        }
    }
});
