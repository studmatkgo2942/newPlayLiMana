// src/hooks/UseSpotify.ts
import {useEffect, useState, useRef} from 'react';
import {useLocation} from 'react-router-dom';

import {SpotifyApi, SdkOptions, AuthorizationCodeWithPKCEStrategy} from "../../../src";

// Define the hook's return type
export interface SpotifyAuthHookReturn {
    sdk: SpotifyApi | null;
    isAuthenticated: boolean; // Explicitly track auth state
    isLoading: boolean; // Add loading state for initial check
    authError: Error | null; // Add potential error state
}

export function useSpotify(clientId: string, redirectUrl: string, scopes: string[], config?: SdkOptions): SpotifyAuthHookReturn {
    console.log("useSpotify Hook: Execution started.");

    // Use Ref for the SDK instance to keep it stable across renders
    const sdkInstanceRef = useRef<SpotifyApi | null>(null);
    // State for authentication status and loading/error during check
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading until checked
    const [authError, setAuthError] = useState<Error | null>(null);
    const location = useLocation();

    // Use state for scopes for stable dependency
    const [activeScopes] = useState(scopes || []);

    // Create SDK instance only once (or if essential config changes)
    useEffect(() => {
        if (!sdkInstanceRef.current && clientId && redirectUrl) {
            try {
                console.log("useSpotify Hook: Creating SDK instance...");
                const auth = new AuthorizationCodeWithPKCEStrategy(clientId, redirectUrl, activeScopes);
                sdkInstanceRef.current = new SpotifyApi(auth, config);
                console.log("useSpotify Hook: SDK instance created.");
            } catch (e: any) {
                console.error("useSpotify Hook: Failed to create SDK instance", e);
                setAuthError(e instanceof Error ? e : new Error('SDK Creation failed'));
                setIsLoading(false); // Stop loading on creation error
            }
        }
    }, [clientId, redirectUrl, activeScopes, config]); // Dependencies for instance creation


    // Effect to Check Auth State / Handle Callback (runs once sdk instance exists)
    useEffect(() => {
            const currentSdkInstance = sdkInstanceRef.current;
            if (!currentSdkInstance) {
                if (authError) setIsLoading(false);
                return; // Wait for instance
            }

            let isMounted = true;
            const isCallbackPath = location.pathname.includes('/callback/spotify');
            if (!isAuthenticated || isCallbackPath) {
                setIsLoading(true);
            }
            setAuthError(null);


            const checkAuthentication = async () => {
                // Explicitly check the current path from location object
                const isCallbackPath = location.pathname.includes('/callback/spotify');

                // If we are on the callback path, let the handler component do its work.
                // This effect will run again when the handler navigates away.
                if (isCallbackPath) {
                    console.log("useSpotify Hook: On callback path. Skipping token check in this effect run.");
                    if (isMounted) {
                        // Set loading false here; the redirect will trigger a new check shortly
                        setIsLoading(false);
                        console.log("useSpotify Check: Set isLoading false on callback path.");
                    }
                    return; // Exit this effect run; wait for navigation
                }

                // --- Not callback path - Check existing session ---
                console.log("useSpotify Hook: Not callback path, checking token...");
                let authSuccessful = false;
                try {
                    console.log("useSpotify Check: Attempting currentSdkInstance.getAccessToken()");
                    // getAccessToken() checks internal state/cache; it doesn't re-authenticate
                    const token = await currentSdkInstance.getAccessToken();
                    // Avoid logging the actual token for security
                    console.log("useSpotify Check: Result of getAccessToken():", token ? '<token found>' : token);

                    if (token) {
                        console.log("useSpotify Hook: Token found via getAccessToken(). Setting auth true.");
                        authSuccessful = true;
                    } else {
                        console.log("useSpotify Hook: No token found via getAccessToken(). Setting auth false.");
                        authSuccessful = false;
                    }
                } catch (err: any) {
                    // It's normal for getAccessToken to reject if no token exists or it's invalid
                    if (err?.message?.includes('No token available') || err?.message?.includes('Access token revoked') || err?.message?.includes('expired')) {
                        console.log("useSpotify Hook: getAccessToken reported no valid token (expected if not logged in or expired).");
                    } else {
                        // Log unexpected errors
                        console.error("useSpotify Hook: Error during getAccessToken check:", err);
                    }
                    authSuccessful = false; // Ensure it's false on error or no token
                }

                // Update state if component is still mounted
                // This block now only runs for non-callback paths
                if (isMounted) {
                    console.log(`useSpotify Check: About to set isAuthenticated to: ${authSuccessful}`);
                    setIsAuthenticated(authSuccessful);
                    setIsLoading(false); // Set loading false after check completes
                    console.log("useSpotify Check: Setting isLoading to false after token check.");
                }
            };

            checkAuthentication();

            return () => {
                isMounted = false; // Prevent state updates on unmount
            };

            // *** KEY CHANGE: Dependency Array includes location ***
        }, [sdkInstanceRef.current, location] // Re-run when SDK instance is ready OR location changes
    );
// Re-run check if instance were to somehow change

    // Return the stable SDK instance from the ref and the dynamic auth state
    return {sdk: sdkInstanceRef.current, isAuthenticated, isLoading, authError};
}