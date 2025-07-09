import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SoundCloudAuthButton from '../components/features/auth/SoundCloudAuthButton';

describe('SoundCloudAuthButton', () => {
    const originalLocation = window.location;

    beforeEach(() => {
        // Mock crypto.getRandomValues
        vi.spyOn(window.crypto, 'getRandomValues').mockImplementation((array: Uint8Array) => {
            for (let i = 0; i < array.length; i++) array[i] = i + 1;
            return array;
        });

        // Mock crypto.subtle.digest
        vi.spyOn(window.crypto.subtle, 'digest').mockImplementation(async () => {
            return new Uint8Array(32).fill(1).buffer;
        });

        // Mock window.location.href setter (no actual navigation)
        delete (window as any).location;
        (window as any).location = { href: '' };
    });

    afterEach(() => {
        vi.restoreAllMocks();
        window.location = originalLocation;
    });

    it('renders the button', () => {
        render(<SoundCloudAuthButton />);
        const btn = screen.getByRole('button', { name: /connect with soundcloud/i });
        expect(btn).toBeInTheDocument();
    });

    it('logs error and does not redirect if client ID is missing', async () => {
        // Temporarily override env var to simulate missing client ID
        const originalClientId = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;
        (import.meta.env as any).VITE_SOUNDCLOUD_CLIENT_ID = '';

        const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        render(<SoundCloudAuthButton />);
        const btn = screen.getByRole('button');
        await fireEvent.click(btn);

        expect(errorSpy).toHaveBeenCalledWith(
            'SoundCloud Client ID or Redirect URI is not configured in .env file.'
        );
        expect(window.location.href).toBe('');

        (import.meta.env as any).VITE_SOUNDCLOUD_CLIENT_ID = originalClientId;
        errorSpy.mockRestore();
    });
});