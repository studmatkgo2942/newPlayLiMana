import { useCallback } from "react"
import { usePlayback } from "../context/PlaybackContext"
import { useSpotifyContext } from "../context/SpotifyContext"

export const UseRepeatControl = () => {
    const { currentState, isPlayerReady, deviceId, customTrackInfo, isCustomAudioPlaying } = usePlayback()
    const { sdk } = useSpotifyContext()

    const HandleCycleRepeatMode = useCallback(async () => {
        const isCustomAudioActive = isCustomAudioPlaying && customTrackInfo

        if (isCustomAudioActive) {
            console.warn("Repeat not available for custom audio")
            return
        }

        if (!sdk || !isPlayerReady || !deviceId) {
            console.warn("Player not ready for repeat toggle.")
            return
        }

        const currentRepeatState = currentState?.repeat_mode ?? 0
        let nextState: "off" | "context" | "track"

        switch (currentRepeatState) {
            case 0: // off -> context
                nextState = "context"
                break
            case 1: // context -> track
                nextState = "track"
                break
            default: // track -> off
                nextState = "off"
        }

        try {
            await sdk.player.setRepeatMode(nextState)

            // Handle special case for track repeat
            if (nextState === "track") {
                const queue = await sdk.player.getUsersQueue()
                const currentTrack = currentState?.track_window?.current_track

                while (queue.queue.length > 0 && queue.currently_playing?.name !== currentTrack?.name) {
                    await sdk.player.skipToNext(deviceId)
                }
            }

            // Let the context handle state updates via the player_state_changed event
            console.log("Repeat mode change completed, waiting for context to update via player events")
        } catch (err) {
            console.error("Error setting repeat mode:", err)
        }
    }, [sdk, isPlayerReady, deviceId, currentState, isCustomAudioPlaying, customTrackInfo])

    return { HandleCycleRepeatMode }
}