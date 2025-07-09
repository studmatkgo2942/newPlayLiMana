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
        pauseCustomAudio,
        resumeCustomAudio,
        /* NEW ↓ */
        queueNext,
        queuePrev,
        clearQueue
    } = usePlayback();
    const { sdk } = useSpotifyContext()

    const IsLikelySDKParsingError = useCallback((error: unknown): boolean => {
        return (
            error instanceof SyntaxError && (error.message.includes("JSON") || error.message.includes("Unexpected token"))
        )
    }, [])

    const HandlePlayPause = useCallback(async () => {
        /* ── 1)  Audius / custom-audio branch ─────────────────────────────── */
        if (customTrackInfo) {
            if (isCustomAudioPlaying || !customAudioRef.current?.paused) {
                pauseCustomAudio();           // ⏸ pause the <audio> element
            } else {
                await resumeCustomAudio();    // ► resume it (and update state)
            }
            return;
        }

        /* ── 2)  Spotify branch ───────────────────────────────────────────── */
        if (!sdk || !isPlayerReady || !deviceId) {
            console.warn("Player/SDK not ready for play/pause");
            return;
        }
        pauseCustomAudio();
        clearQueue();

        const isPaused = currentState?.paused ?? true;
        try {
            if (isPaused) {
                await sdk.player.startResumePlayback(deviceId);   // ► play
            } else {
                await sdk.player.pausePlayback(deviceId);         // ⏸ pause
            }
        } catch (err) {
            if (!IsLikelySDKParsingError(err)) {
                console.error("Error toggling play/pause:", err);
            }
        }
    }, [
        /* deps */
        sdk,
        isPlayerReady,
        deviceId,
        currentState?.paused,
        isCustomAudioPlaying,
        customTrackInfo,
        customAudioRef,
        pauseCustomAudio,
        resumeCustomAudio,
        IsLikelySDKParsingError,
    ]);



    const HandleNext = useCallback(async () => {
            /* ▶ Audius queue */
        if (customTrackInfo) {      // does nothing when already at end
            queueNext();
            return;
        }

        if (!sdk || !isPlayerReady || !deviceId) {
            console.warn("Player/SDK not ready for next.")
            return
        }
        pauseCustomAudio();
        clearQueue();

        try {
            await sdk.player.skipToNext(deviceId)
        } catch (err) {
            if (!IsLikelySDKParsingError(err)) {
                console.error("Error skipping to next:", err)
            }
        }
    }, [sdk, isPlayerReady, deviceId, queueNext, customTrackInfo, IsLikelySDKParsingError]);

    const HandlePrevious = useCallback(async () => {

        if (customTrackInfo) {
            queuePrev(); // does nothing when at index 0
            return;
        }

        if (!sdk || !isPlayerReady || !deviceId) {
            console.warn("Player/SDK not ready for previous.")
            return
        }
        pauseCustomAudio();
        clearQueue();

        try {
            await sdk.player.skipToPrevious(deviceId)
        } catch (err) {
            if (!IsLikelySDKParsingError(err)) {
                console.error("Error skipping to previous:", err)
            }
        }
    }, [sdk, isPlayerReady, deviceId, queuePrev, customTrackInfo, IsLikelySDKParsingError]);

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
                await sdk.player.seekToPosition(seekPosition, deviceId)
            } catch (err) {
                if (!IsLikelySDKParsingError(err)) {
                    console.error("Error seeking:", err)
                }
            }
        }
    }, [currentState, sdk, isPlayerReady, deviceId, customAudioRef, isCustomAudioPlaying, customTrackInfo, IsLikelySDKParsingError])

    // Determine controls enabled state
    const isCustomAudioActive = !!customTrackInfo;
    const isSpotifyActive = currentState?.track_window?.current_track && !isCustomAudioActive;
    const controlsEnabled = isCustomAudioActive || (isSpotifyActive && isPlayerReady && !!currentState);

    return {
        HandlePlayPause,
        HandleNext,
        HandlePrevious,
        HandleVolumeChange,
        HandleProgressBarClick,
        controlsEnabled,
    }
}