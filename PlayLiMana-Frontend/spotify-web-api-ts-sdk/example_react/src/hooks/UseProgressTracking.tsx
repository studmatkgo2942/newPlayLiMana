import { useEffect, useRef, useState } from "react"
import { usePlayback } from "../context/PlaybackContext"

export const UseProgressTracking = () => {
    const { currentState, isPlayerReady, isCustomAudioPlaying, customTrackInfo } = usePlayback()
    const [localPositionMs, setLocalPositionMs] = useState(0)
    const intervalRef = useRef<NodeJS.Timeout | null>(null)
    const progressMetaRef = useRef({ startTime: 0, startPosition: 0 })

    const currentTrackUri = currentState?.track_window?.current_track?.uri
    const duration = currentState?.duration ?? 0
    const sdkPosition = currentState?.position ?? 0

    // Updated to include custom audio playing state
    const isPlaying = currentState && !currentState.paused && (isPlayerReady || isCustomAudioPlaying)

    useEffect(() => {
        const ClearTimer = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }

        // Sync local position with SDK
        setLocalPositionMs(sdkPosition)

        if (isPlaying) {
            ClearTimer()

            progressMetaRef.current = {
                startTime: performance.now(),
                startPosition: sdkPosition,
            }

            intervalRef.current = setInterval(() => {
                const { startTime, startPosition } = progressMetaRef.current
                const elapsed = performance.now() - startTime
                const newPosition = Math.min(startPosition + elapsed, duration)

                setLocalPositionMs(newPosition)

                if (duration > 0 && newPosition >= duration) {
                    ClearTimer()
                }
            }, 250)
        } else {
            ClearTimer()
        }

        return ClearTimer
    }, [currentState?.paused, sdkPosition, duration, currentTrackUri, isPlayerReady, isPlaying, isCustomAudioPlaying])

    const progressPercent = duration > 0 ? (localPositionMs / duration) * 100 : 0

    return { localPositionMs, progressPercent }
}