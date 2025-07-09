"use client"

// --- AppLayout Component ---
// Renders the UI structure and uses the context provided by AuthAndSdkProvider
import { useSpotifyContext } from "./context/SpotifyContext.tsx"
import { EnhancedSearchProvider } from "./context/EnhancedSearchContext.tsx"
import { ThemeProvider } from "./context/ThemeContext.tsx"
import { Navigate, Route, Routes, useLocation } from "react-router-dom"
import type React from "react"
import EnhancedNavBar from "./components/ui/NavBar/EnhancedNavBar.tsx"
import LandingPage from "./pages/LandingPage/LandingPage.tsx"
import SearchPage from "./pages/SearchPage/SearchPage.tsx"
import MusicController from "./components/features/music/MusicController.tsx"
import AuthPage from "./pages/AuthPage/AuthPage.tsx"
import LibraryPage from "./pages/LibraryPage/LibraryPage.tsx"
import PlaylistDetailPage from "./pages/PlaylistPage/PlaylistPage.tsx"
import PlayLiManaProfileService from "./services/profile/PlayLiManaProfileService.tsx"
import SpotifyCallbackHandler from "./pages/callbacks/SpotifyCallbackHandler.tsx"
import SoundCloudCallbackHandler from "./pages/callbacks/SoundCloudCallback.tsx"
import AudiusCallbackHandler from "./pages/callbacks/AudiusCallbackHandler.tsx"
import { useAuth } from "./hooks/UseAuth.tsx"

export const AppLayout: React.FC = () => {
    // Consume the context value using the imported hook
    const { sdk, isAuthenticated, isLoading, authError } = useSpotifyContext()
    const { user: firebaseUser } = useAuth()
    const location = useLocation()

    // Firebase authentication check (for general app access)
    const isFirebaseAuthenticated = !!firebaseUser
    // Combined authentication check (for features requiring both)
    const isFullyAuthenticated = !!firebaseUser && isAuthenticated

    console.log(
        "AppLayout Render - Spotify Auth:",
        isAuthenticated,
        "Firebase User:",
        !!firebaseUser,
        "Firebase Authenticated:",
        isFirebaseAuthenticated,
        "Fully Authenticated:",
        isFullyAuthenticated,
        "Auth Loading:",
        isLoading,
        "Auth Error:",
        authError,
    )

    // Handle loading and error states from the context provider
    if (isLoading && !location.pathname.includes("/callback/")) {
        return <div className="app-layout loading-state">Initializing Spotify Session...</div>
    }

    if (authError && !location.pathname.includes("/callback/")) {
        return <div className="app-layout error-state">Error initializing Spotify: {authError.message}</div>
    }

    // Hide navigation on callback pages
    const hideNavigation = location.pathname.startsWith("/callback/")

    // Render the application structure
    return (
        <ThemeProvider>
            <EnhancedSearchProvider>
                <div className="app-layout">
                    {!hideNavigation && <EnhancedNavBar />}
                    <main className={`app-content ${!hideNavigation ? "with-nav" : ""}`}>
                        <Routes>
                            {/* Public routes */}
                            <Route path="/auth" element={<AuthPage />} />
                            <Route path="/callback/spotify" element={<SpotifyCallbackHandler />} />
                            <Route path="/callback/soundcloud" element={<SoundCloudCallbackHandler />} />
                            <Route path="/callback/audius" element={<AudiusCallbackHandler />} />

                            {/* Home route - show different content based on auth state */}
                            <Route path="/" element={<LandingPage />} />

                            {/* View playlist - looks different depending on auth state but that's handled internally */}
                            <Route path="/playlist/:id" element={<PlaylistDetailPage />} />
                            <Route path="/playlist/public/:id" element={<PlaylistDetailPage />} />

                            {/* Search route - only requires Firebase auth, Spotify prompt handled internally */}
                            <Route
                                path="/search/:query"
                                element={isFirebaseAuthenticated ? <SearchPage /> : <Navigate to="/auth" replace />}
                            />

                            {/* Protected routes - require Firebase auth */}
                            <Route
                                path="/profile"
                                element={isFirebaseAuthenticated ? <PlayLiManaProfileService /> : <Navigate to="/auth" replace />}
                            />
                            <Route
                                path="/library"
                                element={isFirebaseAuthenticated ? <LibraryPage /> : <Navigate to="/auth" replace />}
                            />

                            {/* Catch-all route */}
                            <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                    </main>
                    {isFirebaseAuthenticated && !hideNavigation && <MusicController />}
                </div>
            </EnhancedSearchProvider>
        </ThemeProvider>
    )
}
