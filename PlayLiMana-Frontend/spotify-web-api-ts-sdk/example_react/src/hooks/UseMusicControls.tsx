import { useCallback } from "react"
import { usePlayback } from "../context/PlaybackContext"
import { useSpotifyContext } from "../context/SpotifyContext"

export const UseMusicControls = () => {
    const {
        currentState,
        isPlayerReady,
        deviceId,
        player,
        customAudioRef,
        isCustomAudioPlaying,
        customTrackInfo,
    } = usePlayback()
    const { sdk } = useSpotifyContext()

    const IsLikelySDKParsingError = useCallback((error: unknown): boolean => {
        return (
            error instanceof SyntaxError && (error.message.includes("JSON") || error.message.includes("Unexpected token"))
        )
    }, [])

    const HandlePlayPause = useCallback(async () => {
        // Control the service that is actually playing or was last playing
        console.log("CustomTrackInfo: " + JSON.stringify(customTrackInfo))
        const isCustomAudioActive = customTrackInfo?.source === "audius"
        const isSpotifyActive = currentState?.track_window?.current_track && !isCustomAudioActive

        // Handle custom audio play/pause
        if (isCustomAudioActive) {
            const isPaused = currentState?.paused ?? true
            if (isPaused) {
                await customAudioRef.current.play()
            } else {
                customAudioRef.current.pause()
            }
            return
        }

        // Handle Spotify play/pause
        if (isSpotifyActive && sdk && isPlayerReady && deviceId) {
            const isPaused = currentState?.paused ?? true
            try {
                if (isPaused) {
                    await sdk.player.startResumePlayback(deviceId)
                } else {
                    await sdk.player.pausePlayback(deviceId)
                }
            } catch (err) {
                if (!IsLikelySDKParsingError(err)) {
                    console.error("Error toggling play/pause:", err)
                }
            }
            return
        }

        console.warn("No active playback service available for play/pause")
    }, [sdk, isPlayerReady, deviceId, currentState?.paused, customAudioRef, isCustomAudioPlaying, customTrackInfo, IsLikelySDKParsingError])

    const HandleNext = useCallback(async () => {
        // Don't allow next/previous if we have custom track info (whether playing or not)
        if (customTrackInfo) {
            console.warn("Next/Previous not available for custom audio services")
            return
        }

        if (!sdk || !isPlayerReady || !deviceId) {
            console.warn("Player/SDK not ready for next.")
            return
        }

        try {
            await sdk.player.skipToNext(deviceId)
        } catch (err) {
            if (!IsLikelySDKParsingError(err)) {
                console.error("Error skipping to next:", err)
            }
        }
    }, [sdk, isPlayerReady, deviceId, isCustomAudioPlaying, customTrackInfo, IsLikelySDKParsingError])

    const HandlePrevious = useCallback(async () => {
        // Don't allow next/previous if we have custom track info (whether playing or not)
        if (customTrackInfo) {
            console.warn("Next/Previous not available for custom audio services")
            return
        }

        if (!sdk || !isPlayerReady || !deviceId) {
            console.warn("Player/SDK not ready for previous.")
            return
        }

        try {
            await sdk.player.skipToPrevious(deviceId)
        } catch (err) {
            if (!IsLikelySDKParsingError(err)) {
                console.error("Error skipping to previous:", err)
            }
        }
    }, [sdk, isPlayerReady, deviceId, isCustomAudioPlaying, customTrackInfo, IsLikelySDKParsingError])

    const HandleVolumeChange = useCallback(
        async (newVolume: number) => {
            const isCustomAudioActive = isCustomAudioPlaying && customTrackInfo && customAudioRef?.current

            // Handle custom audio volume
            if (isCustomAudioActive) {
                customAudioRef.current.volume = newVolume
                return
            }

            // Handle Spotify volume
            if (player && isPlayerReady) {
                try {
                    await player.setVolume(newVolume)
                } catch (err) {
                    if (!IsLikelySDKParsingError(err)) {
                        console.error("Error setting volume:", err)
                    }
                }
            }
        },
        [player, isPlayerReady, customAudioRef, isCustomAudioPlaying, customTrackInfo, IsLikelySDKParsingError],
    )

    const HandleProgressBarClick = useCallback(async (event: React.MouseEvent<HTMLDivElement>) => {
        const duration = currentState?.duration ?? 0
        if (!duration || duration <= 0) return

        const progressBar = event.currentTarget
        const rect = progressBar.getBoundingClientRect()
        const clickX = event.clientX - rect.left
        const progressBarWidth = rect.width
        const clickPercent = clickX / progressBarWidth

        const seekPosition = Math.floor(Math.max(0, Math.min(clickPercent * duration, duration)))

        if (isNaN(seekPosition) || seekPosition < 0) {
            console.error("Invalid seek position calculated:", seekPosition)
            return
        }

        const isCustomAudioActive = isCustomAudioPlaying && customTrackInfo && customAudioRef?.current

        // Handle custom audio seeking
        if (isCustomAudioActive) {
            const seekSeconds = seekPosition / 1000
            customAudioRef.current.currentTime = seekSeconds
            return
        }

        // Handle Spotify seeking
        if (!isCustomAudioActive && sdk && isPlayerReady && deviceId) {
            try {
                await sdk.player.seekToPosition(deviceId, seekPosition)
            } catch (err) {
                if (!IsLikelySDKParsingError(err)) {
                    console.error("Error seeking:", err)
                }
            }
        }
    }, [currentState, sdk, isPlayerReady, deviceId, customAudioRef, isCustomAudioPlaying, customTrackInfo, IsLikelySDKParsingError])

    // Determine controls enabled state
    const isCustomAudioActive = isCustomAudioPlaying && customTrackInfo && customAudioRef?.current
    const isSpotifyActive = currentState?.track_window?.current_track && !isCustomAudioActive
    const controlsEnabled = (isCustomAudioActive && !!currentState) || (isSpotifyActive && isPlayerReady && !!currentState)

    return {
        HandlePlayPause,
        HandleNext,
        HandlePrevious,
        HandleVolumeChange,
        HandleProgressBarClick,
        controlsEnabled,
    }
}