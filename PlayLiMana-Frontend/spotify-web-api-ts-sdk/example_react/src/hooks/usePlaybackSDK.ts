// Example: Inside a new hook (usePlaybackSDK.ts) or your main App component/context

import { useState, useEffect, useCallback } from 'react';

function usePlaybackSDK() {
    const [player, setPlayer] = useState<Spotify.Player | undefined>(undefined);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const regularSdk = useSpotifySdk(); // Get the SDK instance used for API calls/tokens

    useEffect(() => {
        // Ensure the SDK script is loaded
        if (!window.Spotify) {
            console.error("Spotify SDK script not loaded!");
            return;
        }

        // This function is called when the SDK script is loaded and ready
        window.onSpotifyWebPlaybackSDKReady = () => {
            console.log("Spotify Web Playback SDK is ready.");

            const setupPlayer = async () => {
                if (!regularSdk) {
                    console.error("Regular SDK not ready for token.");
                    return;
                }
                // Critical: Get an access token with the required scopes (including streaming)
                // Your useSpotify/SDK needs a reliable way to provide this.
                const tokenInfo = await regularSdk.getAccessToken();

                if (!tokenInfo?.access_token) {
                    console.error("No access token available for Playback SDK.");
                    // Handle error, maybe prompt user to re-login
                    return;
                }
                const accessToken = tokenInfo.access_token;

                const spotifyPlayer = new window.Spotify.Player({
                    name: 'My React Spotify App', // Name shown in Spotify Connect
                    getOAuthToken: cb => {
                        // This function MUST provide a valid token
                        // It might be called by the SDK periodically
                        console.log("Playback SDK requesting token...");
                        // You might need logic here to check if the token is expired
                        // and refresh it using your regular SDK/backend if necessary.
                        // For now, we provide the token we fetched earlier.
                        cb(accessToken);
                    },
                    volume: 0.5 // Initial volume
                });

                // --- Player Event Listeners ---
                spotifyPlayer.addListener('ready', ({ device_id }: { device_id: string }) => {
                    console.log('Playback SDK Ready with Device ID', device_id);
                    setDeviceId(device_id);
                    setIsPlayerReady(true);
                });

                spotifyPlayer.addListener('not_ready', ({ device_id }: { device_id: string }) => {
                    console.log('Device ID has gone offline', device_id);
                    setDeviceId(null);
                    setIsPlayerReady(false);
                });

                spotifyPlayer.addListener('initialization_error', ({ message }: {message: string}) => {
                    console.error('Failed to initialize player:', message);
                    setIsPlayerReady(false);
                });

                spotifyPlayer.addListener('authentication_error', ({ message }: {message: string}) => {
                    console.error('Failed to authenticate player:', message);
                    setIsPlayerReady(false);
                    // Might need to logout/re-authenticate user
                });

                spotifyPlayer.addListener('account_error', ({ message }: {message: string}) => {
                    console.error('Account error (e.g., not Premium):', message);
                    setIsPlayerReady(false);
                    // Inform the user they need Premium
                });

                spotifyPlayer.addListener('player_state_changed', (state) => {
                    if (!state) {
                        console.warn("Player state changed to null (e.g., player closed?)");
                        return;
                    }
                    console.log("Player state changed:", state);
                    // You can use this state to update your UI (current track, play/pause status etc.)
                    // Example: setCurrentPlaybackState(state);
                });


                // --- Connect the Player ---
                spotifyPlayer.connect().then(success => {
                    if (success) {
                        console.log('The Web Playback SDK successfully connected to Spotify!');
                        setPlayer(spotifyPlayer); // Store the player instance
                    } else {
                        console.error('The Web Playback SDK failed to connect to Spotify.');
                    }
                });
            };

            setupPlayer();
        };

        // Cleanup function (important!)
        return () => {
            console.log("Cleaning up player...");
            if (player) {
                player.disconnect();
            }
            // It's generally recommended to assign null or undefined to window.onSpotifyWebPlaybackSDKReady
            // but be careful if multiple parts of your app might rely on it.
            // window.onSpotifyWebPlaybackSDKReady = null; // Or undefined
        };
    }, [regularSdk, player]); // Effect dependencies

    // Return the player instance and its status
    return { player, isPlayerReady, deviceId };
}

// You would likely provide 'player', 'isPlayerReady', and 'deviceId' via Context