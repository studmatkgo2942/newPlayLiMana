import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        globals: true,
        setupFiles: './src/test/setup.ts',
        environment: 'jsdom',
        include: ['src/test/**/*.{test,spec}.{ts,tsx,js,jsx}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'lcov'],
            include: ['src/**/*.{ts,tsx,js,jsx}'],
            exclude: ['node_modules/'],
            reportsDirectory: './coverage',
        },
    },
});