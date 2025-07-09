// src/context/SpotifyContext.tsx
import React from 'react';
import { SpotifyAuthHookReturn } from '../hooks/UseSpotify.ts'; // Adjust path if useSpotify is elsewhere

// Define the context with an initial undefined value
export const SpotifyContext = React.createContext<SpotifyAuthHookReturn | undefined>(undefined);

// Custom hook for consuming the context
export const useSpotifyContext = (): SpotifyAuthHookReturn => {
    const context = React.useContext(SpotifyContext);
    if (context === undefined) {
        // This error means a component tried to use the context outside the provider
        throw new Error('useSpotifyContext must be used within an AuthAndSdkProvider');
    }
    return context;
};