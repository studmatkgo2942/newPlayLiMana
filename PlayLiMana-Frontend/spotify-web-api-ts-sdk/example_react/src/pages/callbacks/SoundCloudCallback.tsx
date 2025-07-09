import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom'; // For getting URL params and navigation

const SoundCloudCallbackHandler: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const clientId = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;

    const redirectUri = import.meta.env.VITE_SOUNDCLOUD_REDIRECT_URI; // Should be 'http://localhost:3000/callback/soundcloud'

    useEffect(() => {
        const exchangeCodeForToken = async () => {
            const searchParams = new URLSearchParams(location.search);
            const code = searchParams.get('code');
            const state = searchParams.get('state');

            const storedState = sessionStorage.getItem('soundcloud_state');
            const codeVerifier = sessionStorage.getItem('soundcloud_code_verifier');

            // Clear them from session storage after retrieval for security
            sessionStorage.removeItem('soundcloud_state');
            sessionStorage.removeItem('soundcloud_code_verifier');

            if (state && storedState && state !== storedState) {
                setError("State mismatch. Possible CSRF attack.");
                setIsLoading(false);
                return;
            }

            if (!code) {
                setError("No authorization code found in URL.");
                setIsLoading(false);
                return;
            }

            if (!codeVerifier) {
                setError("No code_verifier found in session storage. PKCE flow cannot be completed.");
                setIsLoading(false);
                return;
            }

            if (!clientId || !redirectUri) {
                setError("Client ID or Redirect URI is missing from configuration.");
                setIsLoading(false);
                return;
            }

            const tokenUrl = 'https://secure.soundcloud.com/oauth/token';
            const params = new URLSearchParams();
            params.append('grant_type', 'authorization_code');
            params.append('client_id', clientId);
            params.append('code', code);
            params.append('redirect_uri', redirectUri);
            params.append('code_verifier', codeVerifier);

            try {
                const response = await fetch(tokenUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: params,
                });

                const data = await response.json();

                if (!response.ok) {
                    setError(`Error exchanging token: ${data.error_description || data.error || response.statusText}`);
                    setIsLoading(false);
                    return;
                }

                // SUCCESS! You have the tokens.
                console.log('SoundCloud Access Token:', data.access_token);
                console.log('SoundCloud Refresh Token:', data.refresh_token);
                console.log('Expires In:', data.expires_in);

                // TODO: Store these tokens securely (e.g., in context, localStorage, or send to backend)
                // For example:
                // localStorage.setItem('soundcloud_access_token', data.access_token);
                // if (data.refresh_token) {
                //     localStorage.setItem('soundcloud_refresh_token', data.refresh_token);
                // }
                // localStorage.setItem('soundcloud_token_expires_at', (Date.now() + data.expires_in * 1000).toString());


                // Navigate the user to their profile page or wherever appropriate
                navigate('/profile'); // Or your desired page

            } catch (err) {
                console.error("Network or other error during token exchange:", err);
                setError(err instanceof Error ? err.message : "An unknown error occurred.");
                setIsLoading(false);
            }
        };

        exchangeCodeForToken();
    }, [location, navigate, clientId, redirectUri]);

    if (isLoading) {
        return <div>Processing SoundCloud login...</div>;
    }

    if (error) {
        return <div>Error during SoundCloud login: {error}. Please try again.</div>;
    }

    // Should have navigated away by now if successful
    return <div>SoundCloud login processed.</div>;
};

export default SoundCloudCallbackHandler;