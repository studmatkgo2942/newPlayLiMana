import React from "react";
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App.tsx';

// Mock the hooks from SpotifyContext and UseAuth

vi.mock('../context/SpotifyContext.tsx', () => ({
    useSpotifyContext: vi.fn(),
    SpotifyContext: React.createContext(null), // create dummy context
}));

vi.mock('../hooks/UseAuth.tsx', () => ({
    useAuth: vi.fn(),
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>, // simple passthrough mock
}));

// Import mocked hooks so we can control return values
import { useSpotifyContext } from '../context/SpotifyContext.tsx';
import { useAuth } from '../hooks/UseAuth.tsx';

describe('App component', () => {
    /* it('renders main app layout when fully authenticated', () => {
        (useSpotifyContext as any).mockReturnValue({
            sdk: {},
            isAuthenticated: true,
            isLoading: false,
            authError: null,
        });
        (useAuth as any).mockReturnValue({
            user: { uid: 'firebase-user-id' },
        });

        render(<App />);

        const layout = screen.getByRole('main', { hidden: true }) || screen.getByText(/./, { selector: '.app-layout' });
        expect(layout).toBeTruthy();

        expect(document.querySelector('.app-layout')).toBeInTheDocument();
    });
*/

    it('shows loading state when Spotify SDK is loading', () => {
        (useSpotifyContext as any).mockReturnValue({
            sdk: null,
            isAuthenticated: false,
            isLoading: true,
            authError: null,
        });
        (useAuth as any).mockReturnValue({
            user: null,
        });

        render(<App />);

        expect(screen.getByText(/Initializing Spotify Session.../i)).toBeInTheDocument();
    });

    it('shows error message on auth error', () => {
        (useSpotifyContext as any).mockReturnValue({
            sdk: null,
            isAuthenticated: false,
            isLoading: false,
            authError: { message: 'Test Spotify auth error' },
        });
        (useAuth as any).mockReturnValue({
            user: null,
        });

        render(<App />);

        expect(screen.getByText(/Error initializing Spotify: Test Spotify auth error/i)).toBeInTheDocument();
    });

    it('shows SDK initialization failure if no sdk and no auth', () => {
        (useSpotifyContext as any).mockReturnValue({
            sdk: null,
            isAuthenticated: false,
            isLoading: false,
            authError: null,
        });
        (useAuth as any).mockReturnValue({
            user: null,
        });

        render(<App />);

        expect(screen.getByText(/Failed to initialize Spotify SDK instance./i)).toBeInTheDocument();
    });
});