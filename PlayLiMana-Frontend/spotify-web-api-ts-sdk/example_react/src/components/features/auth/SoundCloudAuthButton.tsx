// Helper function to generate a cryptographically random string
function generateRandomString(length: number): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper function to generate SHA-256 hash and then Base64URL encode it
async function generateCodeChallenge(verifier: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const digest = await window.crypto.subtle.digest('SHA-256', data);

    // Convert ArrayBuffer to string then to Base64
    const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));

    // Convert Base64 to Base64URL
    return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''); // Remove padding
}

const SoundCloudAuthButton = () => {
    const clientId = import.meta.env.VITE_SOUNDCLOUD_CLIENT_ID;
   // const redirectUri = import.meta.env.VITE_SOUNDCLOUD_REDIRECT_URI;

    const handleLogin = async () => {
        console.log("SoundCloud Client ID:", clientId);
        console.log("SoundCloud Redirect URI:");
        if (!clientId) {
            console.error("SoundCloud Client ID or Redirect URI is not configured in .env file.");
            // Optionally, display an error to the user
            return;
        }

        try {
            const state = generateRandomString(32); // Generate a random state string
            const codeVerifier = generateRandomString(128); // Generate a PKCE code verifier (length between 43 and 128 chars)

            // Store the code_verifier and state in sessionStorage
            // The code_verifier will be needed on your redirect page to exchange the code for a token
            // The state will be needed to verify the redirect request
            sessionStorage.setItem('soundcloud_code_verifier', codeVerifier);
            sessionStorage.setItem('soundcloud_state', state);

            const codeChallenge = await generateCodeChallenge(codeVerifier);

            const params = new URLSearchParams({
                client_id: clientId,
               // redirect_uri: redirectUri,
                response_type: 'code',
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
                state: state,
                // You might want to add the 'scope' parameter if needed by SoundCloud for specific permissions
                scope: 'your_desired_scopes'
            });

            const authorizationUrl = `https://secure.soundcloud.com/authorize?${params.toString()}`;

            // Redirect the user to the SoundCloud authorization page
            window.location.href = authorizationUrl;

        } catch (error) {
            console.error("Error during SoundCloud PKCE setup or redirection:", error);
            // Handle errors, e.g., show a notification to the user
        }
    };

    return (
        <button
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
            onClick={handleLogin}
            title="Connect with SoundCloud using Authorization Code Flow with PKCE"
        >
            Connect with SoundCloud
        </button>
    );
};

export default SoundCloudAuthButton;