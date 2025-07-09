import type React from "react"
import { useState, useEffect, useRef, useCallback } from "react"
import { useParams } from "react-router-dom"

// Context and SDK Hooks
import { useSpotifyContext } from "../../context/SpotifyContext"
import { useEnhancedSearch } from "../../context/EnhancedSearchContext"
import { usePlayback } from "../../context/PlaybackContext"
import { useSpotifyAuthPrompt } from "../../hooks/UseSpotifyAuthPrompt"

// UI Components
import { SpotifyAuthModal } from "../../components/ui/modals/SpotifyAuthModal"
import { PlaylistSelectionPopup } from "../../components/ui/PlaylistSelectionPopup/PlaylistSelectionPopup"

// Search Components
import { ArtistsSection, SongsSection, AlbumsSection } from "../../components/search/SearchSections/SearchSections"
import { LoadingState, ErrorState, SearchPrompt, NoResults } from "../../components/search/SearchStates/SearchStates"

// Types
import {
    GroupedResults,
    SearchResultDisplayItem,
    SelectedTrackInfo,
    SongForPlaylist
} from "../../components/types/search"

import "./SearchPage.css"

const SearchPage: React.FC = () => {
    const { query } = useParams<{ query: string }>()

    // Context hooks
    const { sdk, isAuthenticated: isSpotifyAuthenticated } = useSpotifyContext()
    const { deviceId, isPlayerReady, isPremium, playCustomAudio, stopCustomAudio, clearQueue } = usePlayback()
    const {
        searchTerm,
        setSearchTerm,
        currentResults,
        isLoading,
        error: searchError,
        setError: setSearchError,
        searchSource,
    } = useEnhancedSearch()
    const { isModalOpen, currentFeature, promptForSpotifyAuth, handleConfirmAuth, handleCloseModal } =
        useSpotifyAuthPrompt()

    // Local state
    const [selectedTrackForPreview, setSelectedTrackForPreview] = useState<SelectedTrackInfo | null>(null)
    const [selectedSongForPlaylist, setSelectedSongForPlaylist] = useState<SongForPlaylist | null>(null)
    const [showSuccessMessage, setShowSuccessMessage] = useState<string | null>(null)

    // Song options state
    const [openPopupId, setOpenPopupId] = useState<string | null>(null)
    const optionsButtonRefs = useRef<{ [key: string]: React.RefObject<HTMLButtonElement> }>({})

    // SDK parsing error check
    const IsLikelySDKParsingError = useCallback((error: unknown): boolean => {
        return (
            error instanceof SyntaxError && (error.message.includes("JSON") || error.message.includes("Unexpected token"))
        )
    }, [])

    // Update search term when URL parameter changes
    useEffect(() => {
        if (query && query !== searchTerm) {
            const decodedQuery = decodeURIComponent(query)
            console.log("SearchPage: Setting search term from URL:", decodedQuery)
            setSearchTerm(decodedQuery)
        }
    }, [query, searchTerm, setSearchTerm])

    // Group results by type
    const groupedResults: GroupedResults = {
        artists: currentResults.filter((result) => result.type === "Artist"),
        tracks: currentResults.filter((result) => result.type === "Track"),
        albums: currentResults.filter((result) => result.type === "Album"),
    }

    // Utility functions
    const getTrackIdFromUri = (uri: string): string => {
        return uri.split(":")[2] || uri
    }

    const getSearchSourceText = () => {
        switch (searchSource) {
            case "spotify":
                return "Spotify"
            case "audius":
                return "Audius"
            case "both":
                return "Spotify & Audius"
            default:
                return "music platforms"
        }
    }

    const getAvailableResults = () => {
        const spotifyResults = currentResults.filter((r) => r.source === "spotify")
        const audiusResults = currentResults.filter((r) => r.source === "audius")
        return {
            spotify: spotifyResults.length,
            audius: audiusResults.length,
            total: currentResults.length,
        }
    }

    // Song options functions
    const addSongToQueue = async (trackId: string) => {
        try {
            await sdk?.player.addItemToPlaybackQueue("spotify:track:" + trackId, deviceId)
            console.log("Added song to queue:", trackId)
        } catch (error) {
            if (IsLikelySDKParsingError(error)) {
                console.log("SDK parsing error (likely successful operation):", error)
                // Don't show error to user as operation likely succeeded
                return
            }
            console.error("Error adding song to queue:", error)
            setSearchError("Failed to add song to queue")
        }
    }

    const playNext = async (trackId: string) => {
        try {
            await sdk?.player.addItemToPlaybackQueue("spotify:track:" + trackId, deviceId)
            console.log("Added song to play next:", trackId)
        } catch (error) {
            if (IsLikelySDKParsingError(error)) {
                console.log("SDK parsing error (likely successful operation):", error)
                // Don't show error to user as operation likely succeeded
                return
            }
            console.error("Error playing next:", error)
            setSearchError("Failed to add song to play next")
        }
    }

    const addToPlaylist = (track: SearchResultDisplayItem) => {
        // Convert SearchResultDisplayItem to the format expected by PlaylistSelectionPopup
        const songData: SongForPlaylist = {
            songId: track.uri ? getTrackIdFromUri(track.uri) : track.id,
            title: track.title.split(" - ")[0],
            artists: track.title.split(" - ")[1] || "Unknown Artist",
            album: "", // Not available in search results
            coverUrl: track.imageUrl,
            playtime: 0, // Not available in search results
            linksForWebPlayer: track.uri ? [track.uri.replace("spotify:track:", "https://open.spotify.com/track/")] : [],
            uri: track.uri,
        }
        setSelectedSongForPlaylist(songData)
    }

    const handlePlaylistSuccess = (playlistName: string) => {
        setShowSuccessMessage(`Added to "${playlistName}"`)
        setTimeout(() => setShowSuccessMessage(null), 3000)
    }

    // Click handlers
    const handleTrackClick = async (item: SearchResultDisplayItem) => {
        setSearchError(null)
        console.log(
            `Item Clicked: Title='${item.title}', Type='${item.type}', Source='${item.source}', URI='${item.uri}', PreviewURL='${item.previewUrl}'`,
        )

        // For Spotify tracks with full playback capability
        if (
            item.source === "spotify" &&
            sdk &&
            item.type === "Track" &&
            isPremium === true &&
            isPlayerReady &&
            deviceId &&
            item.uri &&
            isSpotifyAuthenticated
        ) {
            console.log(`Attempting FULL Spotify playback... Type: ${item.type}`)
            try {
                // Stop custom audio first to ensure clean transition
                stopCustomAudio()

                await sdk.player.startResumePlayback(deviceId, undefined, [item.uri])
                console.log("Full Spotify playback request sent for:", item.title)
                return
            } catch (err: any) {
                if (IsLikelySDKParsingError(err)) {
                    console.log("SDK parsing error during playback (likely successful):", err)
                    return
                }
                console.error("Failed to start Spotify SDK playback:", err)
                setSearchError(`Spotify Playback failed: ${err.message || "Unknown Error"}`)
            }
        }

        // For Spotify albums with full playback capability
        if (
            item.source === "spotify" &&
            sdk &&
            item.type === "Album" &&
            isPremium === true &&
            isPlayerReady &&
            deviceId &&
            item.uri &&
            isSpotifyAuthenticated
        ) {
            console.log(`Attempting FULL Spotify album playback... Type: ${item.type}`)
            try {
                // Stop custom audio first to ensure clean transition
                stopCustomAudio()

                await sdk.player.startResumePlayback(deviceId, item.uri)
                console.log("Full Spotify album playback request sent for:", item.title)
                return
            } catch (err: any) {
                if (IsLikelySDKParsingError(err)) {
                    console.log("SDK parsing error during album playback (likely successful):", err)
                    return
                }
                console.error("Failed to start Spotify SDK album playback:", err)
                setSearchError(`Spotify Album Playback failed: ${err.message || "Unknown Error"}`)
            }
        }

        // For Audius tracks or Spotify previews - use the MusicController
        if (item.type === "Track" && item.previewUrl) {
            console.log(`Playing preview through MusicController... URL: ${item.previewUrl}`)
            // Use the custom audio playback method
            clearQueue();
            playCustomAudio(item.previewUrl, {
                title: item.title,
                imageUrl: item.imageUrl,
                source: item.source,
            })
            return
        }

        // Fallback to external link
        if (item.externalUrl) {
            console.log(`Opening external URL for ${item.type}: ${item.externalUrl}`)
            window.open(item.externalUrl, "_blank", "noopener,noreferrer")
            return
        }

        console.log(`Clicked ${item.type} ('${item.title}') - No playback options available`)
    }

    const handleOptionsClick = (trackId: string) => {
        setOpenPopupId(openPopupId === trackId ? null : trackId)
    }

    const handleCloseOptions = () => {
        setOpenPopupId(null)
    }

    const handleSpotifyConnect = () => {
        promptForSpotifyAuth("enhanced search results")
    }

    // Get result counts
    const resultCounts = getAvailableResults()

    // Render helpers
    const renderMainContent = () => {
        const hasQuery = query && query.trim() !== ""
        const hasResults = currentResults.length > 0

        if (isLoading) {
            return <LoadingState isLoading={isLoading} searchSource={searchSource} />
        }

        if (searchError) {
            return <ErrorState error={searchError} isLoading={isLoading} />
        }

        return (
            <div className="search-results-area">
                <SearchPrompt hasQuery={hasQuery} searchSource={searchSource} />
                <NoResults hasQuery={hasQuery} hasResults={hasResults} query={query || ""} searchSource={searchSource} />
                {hasQuery && hasResults && (
                    <div className="search-results-sections">
                        <ArtistsSection artists={groupedResults.artists} onArtistClick={handleTrackClick} />
                        <SongsSection
                            tracks={groupedResults.tracks}
                            isPremium={isPremium}
                            isPlayerReady={isPlayerReady}
                            deviceId={deviceId}
                            openPopupId={openPopupId}
                            optionsButtonRefs={optionsButtonRefs.current}
                            onTrackClick={handleTrackClick}
                            onOptionsClick={handleOptionsClick}
                            onCloseOptions={handleCloseOptions}
                            onPlayNext={playNext}
                            onAddToQueue={addSongToQueue}
                            onAddToPlaylist={addToPlaylist}
                            getTrackIdFromUri={getTrackIdFromUri}
                        />
                        <AlbumsSection
                            albums={groupedResults.albums}
                            isPremium={isPremium}
                            isPlayerReady={isPlayerReady}
                            deviceId={deviceId}
                            onAlbumClick={handleTrackClick}
                        />
                    </div>
                )}
            </div>
        )
    }

    const renderSuccessMessage = () => {
        if (!showSuccessMessage) return null
        return <div className="success-message">{showSuccessMessage}</div>
    }

    const renderPlaylistSelectionPopup = () => {
        return (
            <PlaylistSelectionPopup
                isOpen={!!selectedSongForPlaylist}
                onClose={() => setSelectedSongForPlaylist(null)}
                song={selectedSongForPlaylist}
                onSuccess={handlePlaylistSuccess}
            />
        )
    }

    return (
        <>
            <div className="search-page-container">
                <div className="search-page-header">
                    <h1 className="search-page-title">
                        {query ? `Search results for "${decodeURIComponent(query)}"` : "Search"}
                    </h1>
                    {query && (
                        <div className="search-source-info">
                            <p>
                                Searching {getSearchSourceText()} • {resultCounts.total} results
                                {searchSource === "both" && (
                                    <span>
                                        {" "}
                                        ({resultCounts.spotify} Spotify, {resultCounts.audius} Audius)
                                    </span>
                                )}
                            </p>
                            {/* Show Spotify connection button ONLY in header area when searching Spotify */}
                            {searchSource === "spotify" && !isSpotifyAuthenticated && (
                                <div className="spotify-connect-prompt header-connect">
                                    <button onClick={handleSpotifyConnect} className="spotify-connect-button">
                                        Connect Spotify for full access
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {renderMainContent()}
                {renderSuccessMessage()}
                {renderPlaylistSelectionPopup()}
            </div>

            {/* Spotify Auth Modal */}
            <SpotifyAuthModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmAuth}
                feature={currentFeature}
            />
        </>
    )
}

export default SearchPage