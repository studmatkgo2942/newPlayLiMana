import '@testing-library/jest-dom';

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
    value: {
        VITE_SPOTIFY_CLIENT_ID: '5a1f44b670a24ef6a4bd896e51a1109e',
        VITE_SPOTIFY_REDIRECT_URI: 'http://localhost:3000/callback/spotify',
        VITE_APPLE_MUSIC_DEV_TOKEN: '',
        VITE_SOUNDCLOUD_CLIENT_ID: 'M9HK5mecMarW5T6vvcjMogdYlTpZWrLX',
        VITE_SOUNDCLOUD_REDIRECT_URI: 'http://localhost:3000/callback/soundcloud',
    },
    writable: true,
});
