import React, {useContext, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {SpotifyContext} from "../../context/SpotifyContext.tsx";


const SpotifyCallbackHandler: React.FC = () => {
    const context = useContext(SpotifyContext);
    const navigate = useNavigate(); // Get navigate function

    useEffect(() => {
        console.log("Callback Handler: Effect running.");
        if (context?.sdk) {
            console.log("Callback Handler: SDK instance found. Attempting authentication...");
            const handleAuth = async () => {
                try {
                    // The presence of 'code' in search params is usually checked here or implied
                    // The authenticate method handles the code exchange
                    const {authenticated} = await context.sdk.authenticate();

                    if (authenticated) {
                        console.log("Callback Handler: Authentication successful!");
                        // SUCCESS! Navigate away from the callback URL.
                        navigate('/'); // Navigate to home page or stored intended destination
                    } else {
                        console.error("Callback Handler: Authentication failed (authenticated=false).");
                        // Handle failure - maybe navigate to an error page or login
                        navigate('/login?error=auth_failed');
                    }
                } catch (error) {
                    console.error("Callback Handler: Error during authentication:", error);
                    // Handle errors during the authenticate call
                    navigate('/login?error=auth_exception');
                }
            };

            handleAuth();

        } else {
            console.log("Callback Handler: Waiting for SDK instance from context...");
            // SDK not ready yet, effect will re-run when context updates
        }
        // Dependency on context.sdk to re-run when the SDK becomes available
    }, [context?.sdk, navigate]);

    // Display a loading message while authentication is in progress
    return <div>Processing authentication...</div>;
};

export default SpotifyCallbackHandler;
