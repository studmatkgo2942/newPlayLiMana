import { useEffect, useState } from "react"
import type { UserProfile } from "@spotify/web-api-ts-sdk"
import { useSpotifyContext } from "../../context/SpotifyContext.tsx"
import { useAuth } from "../../hooks/UseAuth"
import LoginWithSpotifyButton from "../../components/features/auth/LoginWithSpotifyButton.tsx"
import { FirebaseUserAccountService } from "../UserAccountService"

export function SpotifyProfileService() {
    // Use the context hook that returns the full { sdk, isAuthenticated } object
    const { sdk, isAuthenticated } = useSpotifyContext()
    const { user: firebaseUser } = useAuth()
    const [spotifyUserProfile, setSpotifyUserProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)
    const [isSavingToken, setIsSavingToken] = useState(false)
    const [tokenSaved, setTokenSaved] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)

    const userAccountService = new FirebaseUserAccountService()

    const saveSpotifyToken = async (profile: UserProfile) => {
        if (!firebaseUser || !sdk) {
            console.log("No Firebase user or Spotify SDK found for token saving")
            return
        }

        try {
            setIsSavingToken(true)
            const accessToken = await sdk.getAccessToken()

            if (!accessToken?.access_token) {
                console.log("No Spotify access token found")
                return
            }

            console.log("Saving Spotify token for user:", profile.id)

            await userAccountService.saveServiceToken("Spotify", profile.id, accessToken.access_token)

            console.log("Spotify token saved successfully")
            setTokenSaved(true)
            setTimeout(() => setTokenSaved(false), 3000)
        } catch (error) {
            console.error("Error saving Spotify token:", error)
        } finally {
            setIsSavingToken(false)
        }
    }

    const handleUnlink = async () => {
        if (!sdk || !window.confirm("Are you sure you want to disconnect your Spotify account?")) {
            return
        }

        try {
            setIsRemoving(true)

            // Remove from backend first
            await userAccountService.removeServiceToken("Spotify")
            console.log("Spotify token removed from backend")

            // Then logout from Spotify
            await sdk.logOut()
            setTokenSaved(false)
            setSpotifyUserProfile(null)

            console.log("Spotify account disconnected successfully")
            window.location.reload() // Force refresh for simplicity
        } catch (error) {
            console.error("Error disconnecting Spotify:", error)
            // Still logout from frontend even if backend removal fails
            await sdk.logOut()
            setTokenSaved(false)
            setSpotifyUserProfile(null)
            window.location.reload()
        } finally {
            setIsRemoving(false)
        }
    }

    useEffect(() => {
        // Define the async function inside
        const fetchProfile = async () => {
            setLoading(true) // Set loading at the start of fetch attempt
            console.log("SpotifyProfileService Effect: Running. SDK?", !!sdk, "Auth?", isAuthenticated)
            // Check if logged in, SDK exists, AND sdk.currentUser exists
            if (isAuthenticated && sdk && sdk.currentUser) {
                console.log("SpotifyProfileService: Attempting profile fetch...")
                try {
                    const profile = await sdk.currentUser.profile()
                    console.log("SpotifyProfileService: Profile received:", profile)
                    setSpotifyUserProfile(profile) // Set profile on success

                    // Save token when profile is successfully fetched
                    if (!tokenSaved && !isSavingToken) {
                        await saveSpotifyToken(profile)
                    }
                } catch (err) {
                    console.error("SpotifyProfileService: Error fetching profile:", err)
                    setSpotifyUserProfile(null) // Clear profile on error
                } finally {
                    setLoading(false) // Stop loading after attempt
                }
            } else {
                console.log(
                    "SpotifyProfileService: Skipping profile fetch (Not authenticated, no SDK, or sdk.currentUser not ready).",
                )
                setSpotifyUserProfile(null) // Ensure profile is null if prerequisites not met
                setLoading(false) // Stop loading
            }
        }
        fetchProfile()
    }, [sdk, isAuthenticated, sdk?.currentUser])

    if (loading) {
        return (
            <tr>
                <td className="px-4 py-4 whitespace-nowrap">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                        width={32}
                        height={32}
                        alt="Spotify Icon"
                    />
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500 mr-2"></div>
                        <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">—</td>
                <td className="px-4 py-4 whitespace-nowrap">
                    <button disabled className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-sm cursor-not-allowed">
                        Loading...
                    </button>
                </td>
            </tr>
        )
    }

    return (
        <tr>
            <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                        width={32}
                        height={32}
                        alt="Spotify Icon"
                    />
                    <span className="text-sm font-medium text-gray-900 ml-3">Spotify</span>
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    {spotifyUserProfile?.display_name ?? "Not Linked"}
                    {isSavingToken && <div className="text-xs text-blue-600 mt-1">Saving token...</div>}
                    {tokenSaved && <div className="text-xs text-green-600 mt-1">✓ Token saved</div>}
                    {isRemoving && <div className="text-xs text-orange-600 mt-1">Removing connection...</div>}
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{spotifyUserProfile?.email ?? "—"}</td>
            <td className="px-4 py-4 whitespace-nowrap">
                {/* Conditional rendering based on fetched profile */}
                {isAuthenticated ? (
                    <button
                        onClick={handleUnlink}
                        disabled={isRemoving}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRemoving ? "Disconnecting..." : "Disconnect"}
                    </button>
                ) : (
                    <LoginWithSpotifyButton />
                )}
            </td>
        </tr>
    )
}
