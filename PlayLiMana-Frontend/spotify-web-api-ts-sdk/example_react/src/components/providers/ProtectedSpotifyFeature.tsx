import type React from "react"
import { useSpotifyContext } from "../../context/SpotifyContext"
import { useAuth } from "../../hooks/UseAuth.tsx"
import {useSpotifyAuthPrompt} from "../../hooks/UseSpotifyAuthPrompt.tsx";
import {SpotifyAuthModal} from "../ui/modals/SpotifyAuthModal.tsx";



interface ProtectedSpotifyFeatureProps {
    children: React.ReactNode
    featureName: string
    fallback?: React.ReactNode
}

export const ProtectedSpotifyFeature: React.FC<ProtectedSpotifyFeatureProps> = ({
                                                                                    children,
                                                                                    featureName,
                                                                                    fallback,
                                                                                }) => {
    const { isAuthenticated: isSpotifyAuthenticated } = useSpotifyContext()
    const { user: firebaseUser } = useAuth()
    const { isModalOpen, currentFeature, promptForSpotifyAuth, handleConfirmAuth, handleCloseModal } =
        useSpotifyAuthPrompt()

    const isFirebaseAuthenticated = !!firebaseUser

    if (!isFirebaseAuthenticated) {
        return (
            fallback || (
                <div className="feature-blocked">
                    <p className="blocked-message">Please log in to access this feature.</p>
                </div>
            )
        )
    }

    if (!isSpotifyAuthenticated) {
        return (
            <>
                <div className="feature-blocked">
                    {fallback || (
                        <div className="spotify-connect-prompt">
                            <p className="blocked-message">Connect your Spotify account to use {featureName}.</p>
                            <button onClick={() => promptForSpotifyAuth(featureName)} className="btn btn-primary">
                                Connect Spotify
                            </button>
                        </div>
                    )}
                </div>

                <SpotifyAuthModal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    onConfirm={handleConfirmAuth}
                    feature={currentFeature}
                />
            </>
        )
    }

    return <>{children}</>
}