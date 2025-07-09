// src/App.tsx
// --- Corrected SDK Type Import ---
// Replace '@spotify/web-api-ts-sdk' with your actual installed package name if different
import { BrowserRouter as Router } from "react-router-dom"
import "./App.css"

// Import your other hooks and components (adjust paths as needed)
import { PlaybackProvider } from "./context/PlaybackContext.tsx"
import { AppLayout } from "./AppLayout.tsx"
import { AuthProvider } from "./hooks/UseAuth.tsx"
import { AuthAndSdkProvider } from "./components/providers/AuthAndSdkProvider.tsx"
import { AudiusProvider } from "./context/AudiusContext.tsx"

// Context Definition
// Define required scopes array (ensure Scopes are imported or use strings)
const SPOTIFY_SCOPES: string[] = [
    "ugc-image-upload",
    "user-read-private",
    "user-read-email",
    "playlist-read-private",
    "playlist-modify-public",
    "playlist-modify-private",
    "user-read-playback-state",
    "user-modify-playback-state",
    "user-read-currently-playing",
    "streaming",
    "app-remote-control",
]

const CLIENT_ID: string = import.meta.env.VITE_SPOTIFY_CLIENT_ID
// Make sure this environment variable name is correct for your redirect URI
const REDIRECT_URI: string = import.meta.env.VITE_SPOTIFY_REDIRECT_URI

// --- Root App Component ---
// Sets up Router and the top-level context provider
function App() {
    return (
        <Router>
            {/* Router must be outside the AuthAndSdkProvider */}
            <AuthProvider>
                <AuthAndSdkProvider clientId={CLIENT_ID} redirectUri={REDIRECT_URI} scopes={SPOTIFY_SCOPES}>
                    <AudiusProvider>
                        <PlaybackProvider>
                            <AppLayout />
                        </PlaybackProvider>
                    </AudiusProvider>
                </AuthAndSdkProvider>
            </AuthProvider>
        </Router>
    )
}

// Default export for App component
export default App
