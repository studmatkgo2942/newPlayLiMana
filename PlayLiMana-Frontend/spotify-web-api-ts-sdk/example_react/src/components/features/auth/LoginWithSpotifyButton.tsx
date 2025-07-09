// src/components/LoginWithSpotifyButton.tsx
import React from 'react';
import {useSpotifyContext} from "../../../context/SpotifyContext.tsx";

// Import the context hook to get the SDK instance


// Define props - allowing optional className for styling overrides
interface LoginWithSpotifyButtonProps {
    className?: string;
}

const LoginWithSpotifyButton: React.FC<LoginWithSpotifyButtonProps> = ({ className }) => {
    // Get the SDK instance and auth status from context
    const { sdk, isAuthenticated } = useSpotifyContext();

    const handleLogin = () => {
        console.log("Login Button: handleLogin triggered.");
        console.log("Login Button: SDK instance:", sdk);

        // Check if sdk exists AND has the authenticate method
        if (sdk && typeof sdk.authenticate === 'function') {
            console.log("Login Button: Calling sdk.authenticate()...");
            // Initiate the Spotify OAuth flow
            sdk.authenticate().catch(err => console.error("Login Button: Auth initiation failed:", err));
        } else {
            console.error("Login Button: Cannot login - SDK instance or authenticate method is missing/invalid.", sdk);
            // Optionally alert the user
            alert("Error initiating Spotify login. Please try refreshing the page.");
        }
    };

    // Button should generally be disabled if the user is already authenticated
    // or if the SDK hasn't loaded yet (though App should handle the loading state)
    const isDisabled = !sdk || typeof sdk.authenticate !== 'function' || isAuthenticated;

    return (
        <button
            onClick={handleLogin}
            // Use a base class plus any className passed via props
            className={`login-button-spotify ${className ?? ''}`}
            disabled={isDisabled}
            title={isDisabled ? (isAuthenticated ? "Already logged in" : "Login unavailable") : "Log in with Spotify"}
        >
            Log In with Spotify
        </button>
    );
};

export default LoginWithSpotifyButton;