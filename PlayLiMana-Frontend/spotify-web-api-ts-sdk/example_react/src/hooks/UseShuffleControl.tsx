import { useCallback } from "react"
import { usePlayback } from "../context/PlaybackContext"
import { useSpotifyContext } from "../context/SpotifyContext"

export const UseShuffleControl = () => {
    const { currentState, isPlayerReady, deviceId, customTrackInfo, isCustomAudioPlaying } = usePlayback()
    const { sdk } = useSpotifyContext()

    const AddSimilarTracksToQueue = useCallback(
        async (currentTrack: any) => {
            if (!sdk || !deviceId) return

            try {
                const artistId = currentTrack.album.artists[0]?.id
                if (!artistId) return

                const artistAlbums = await sdk.artists.albums(artistId, "single", undefined, 10)

                if (artistAlbums.items?.length > 0) {
                    const tracksToAdd = artistAlbums.items
                        .map((track) => track.uri)
                        .filter((uri) => uri !== currentTrack.uri)
                        .slice(0, 10)

                    for (const uri of tracksToAdd) {
                        try {
                            const trackOfAlbum = await sdk.albums.tracks(uri.split(":")[2])
                            await sdk.player.addItemToPlaybackQueue(trackOfAlbum.items[0].uri, deviceId)
                        } catch (queueError) {
                            console.warn(`Failed to add track ${uri} to queue:`, queueError)
                        }
                    }
                }
            } catch (error) {
                console.error("Error adding similar tracks:", error)
            }
        },
        [sdk, deviceId],
    )

    const HandleToggleShuffle = useCallback(async () => {
        const isCustomAudioActive = isCustomAudioPlaying && customTrackInfo

        if (isCustomAudioActive) {
            console.warn("Shuffle not available for custom audio")
            return
        }

        if (!sdk || !isPlayerReady || !deviceId) {
            console.warn("Shuffle Toggle: Requirements not met.")
            return
        }

        const currentShuffleState = currentState?.shuffle ?? false
        const newState = !currentShuffleState

        try {
            await sdk.player.togglePlaybackShuffle(newState, deviceId)

            // Add similar tracks when turning shuffle ON
            if (newState && currentState?.track_window?.current_track) {
                await AddSimilarTracksToQueue(currentState.track_window.current_track)
            }

            // Let the context handle state updates via the player_state_changed event
            console.log("Shuffle toggle completed, waiting for context to update via player events")
        } catch (error) {
            if (!(error instanceof SyntaxError && error.message.includes("JSON"))) {
                console.error("Error toggling shuffle:", error)
            } else {
                // Handle expected SDK parsing error - the command likely succeeded
                console.warn("Ignoring expected SyntaxError after shuffle toggle")
            }
        }
    }, [sdk, isPlayerReady, deviceId, currentState, AddSimilarTracksToQueue, isCustomAudioPlaying, customTrackInfo])

    return { HandleToggleShuffle }
}