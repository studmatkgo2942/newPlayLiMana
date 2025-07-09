import React, {ReactNode} from 'react';
import {SpotifyAuthHookReturn, useSpotify} from "../../hooks/UseSpotify.ts";
import { SpotifyContext } from '../../context/SpotifyContext.tsx';


interface AuthAndSdkProviderProps {
    children: ReactNode;
    clientId: string;
    redirectUri: string;
    scopes: string[];
}

export const AuthAndSdkProvider: React.FC<AuthAndSdkProviderProps> = ({
                                                                          children,
                                                                          clientId,
                                                                          redirectUri,
                                                                          scopes
                                                                      }) => {
    // Now useSpotify can safely use useLocation because AuthAndSdkProvider
    // is rendered *inside* <Router> by App.tsx
    const spotifyData: SpotifyAuthHookReturn = useSpotify(clientId, redirectUri, scopes);

    // Provide the hook's return value through context
    // Now SpotifyContext is defined because it was imported above
    return (
        <SpotifyContext.Provider value={spotifyData}>
            {children}
        </SpotifyContext.Provider>
    );
};