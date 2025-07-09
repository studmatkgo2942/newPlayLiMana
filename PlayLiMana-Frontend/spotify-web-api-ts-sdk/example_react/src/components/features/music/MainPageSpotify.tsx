// --- React and Hook Imports ---
import type React from "react"
import {useState, useEffect} from "react"

// --- Context and SDK Hooks ---
import {usePlayback} from "../../../context/PlaybackContext.tsx"
import {useSearch} from "../../../context/SearchContext.tsx"

// --- CSS Import ---
import "./MainPageSpotify.css"
import {useSpotifyContext} from "../../../context/SpotifyContext.tsx"

// --- Type Definitions ---
export interface SearchResultDisplayItem {
    id: string
    title: string
    type: "Artist" | "Album" | "Track"
    imageUrl?: string
    externalUrl?: string
    previewUrl?: string
    uri?: string
}

export interface SelectedTrackInfo {
    url: string
    title: string
    imageUrl?: string
}

const MainPageSpotify: React.FC = () => {
    console.log("%c--- MainPageSpotify Render Start ---", "color: navy; font-weight: bold;")

    // --- Local State ---
    const [localHookError, setLocalHookError] = useState<string | null>(null)

    // --- Context Hooks (with error handling) ---
    const {sdk} = useSpotifyContext()
    const playbackInfo = usePlayback()
    const searchCtx = useSearch()

    try {
        console.log("MainPageSpotify: Context Hooks Called", {
            sdk: !!sdk,
            playbackInfo: !!playbackInfo,
            searchCtx: !!searchCtx,
        })
        if (localHookError) setLocalHookError(null)
    } catch (err: any) {
        console.error("!!! ERROR calling context hooks in MainPageSpotify:", err)
        if (!localHookError) {
            useEffect(() => {
                setLocalHookError(`Failed context: ${err.message}`)
            }, [err.message])
        }
    }

    // --- Destructure context values safely ---
    const {deviceId, isPlayerReady, isPremium} = playbackInfo

    const {searchTerm} = searchCtx

    // --- Log State Before Return ---
    console.log("MainPageSpotify: State before final return:", {
        searchTerm,
        deviceId,
        isPlayerReady,
        isPremium,
    })

    // --- Render Fallback if Hooks Failed or Context not ready ---
    if (!sdk || !playbackInfo || !searchCtx || localHookError) {
        return (
            <div className="main-page-container">
                <h1 className="page-title">Spotify Search</h1>
                <div className="error-message">{localHookError || "Error: Loading application context..."}</div>
            </div>
        )
    }

    // --- Main JSX Rendering ---
    return (
        <div className="main-page-container">
            <h1 className="page-title">Welcome to PlayLiMana</h1>

            <div className="welcome-content">
                {searchTerm.trim() === "" ? (
                    <div className="welcome-message">
                        <p>Use the search bar above to find your favorite music on Spotify.</p>
                        <p>Search results will appear as suggestions below the search bar.</p>
                    </div>
                ) : (
                    <div className="search-active-message">
                        <p>
                            Searching for: <strong>"{searchTerm}"</strong>
                        </p>
                        <p>Results are displayed in the dropdown above.</p>
                    </div>
                )}
            </div>
        </div>)

}

export default MainPageSpotify
