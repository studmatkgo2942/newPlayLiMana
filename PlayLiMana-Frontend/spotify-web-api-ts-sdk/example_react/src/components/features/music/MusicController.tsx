import type React from "react"
import {useEffect, useState, useRef} from "react"
import type {SimplifiedArtist} from "@spotify/web-api-ts-sdk"

import {usePlayback} from "../../../context/PlaybackContext"
import {useTheme} from "../../../context/ThemeContext"
import {UseMusicControls} from "../../../hooks/UseMusicControls"
import {UseShuffleControl} from "../../../hooks/UseShuffleControl"
import {UseRepeatControl} from "../../../hooks/UseRepeatControl"
import {UseProgressTracking} from "../../../hooks/UseProgressTracking"


import {TrackInfo} from "./components/TrackInfo"
import {ControlButtons} from "./components/ControlButtons"
import {ProgressBar} from "./components/ProgressBar"
import {VolumeControl} from "./components/VolumeControl"
import {UpNext} from "./components/UpNext"

// Import service logos
import AudiusLogo from "../../../assets/icons/services/Audius.svg?react"

const SPOTIFY_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
const APPLE_MUSIC_LOGO_URL = "https://upload.wikimedia.org/wikipedia/commons/5/59/Apple_Music_Icon.svg"

const MusicController: React.FC = () => {
    const [volume, setVolume] = useState<number>(0.7)
    const lastSpotifyTrackRef = useRef<string | null>(null)
    const lastCustomTrackRef = useRef<string | null>(null)

    const {
        currentState,
        isPlayerReady,
        customAudioRef,
        isCustomAudioPlaying,
        customTrackInfo,
        clearCustomTrackInfo,
    } = usePlayback()

    const {theme} = useTheme()
    const {localPositionMs, progressPercent} = UseProgressTracking()
    const {
        HandlePlayPause,
        HandleNext,
        HandlePrevious,
        HandleVolumeChange,
        HandleProgressBarClick,
        controlsEnabled
    } = UseMusicControls()
    const {HandleToggleShuffle} = UseShuffleControl()
    const {HandleCycleRepeatMode} = UseRepeatControl()

    // Clear cache when switching between services
    useEffect(() => {
        const currentSpotifyTrack = currentState?.track_window?.current_track?.uri
        const currentCustomTrack = customTrackInfo ? `${customTrackInfo.source}:${customTrackInfo.title}` : null

        // If a new Spotify track is playing and we have custom track info, clear it
        if (currentSpotifyTrack &&
            currentSpotifyTrack !== lastSpotifyTrackRef.current &&
            customTrackInfo &&
            !isCustomAudioPlaying) {
            console.log("New Spotify track detected, clearing custom track info")
            clearCustomTrackInfo?.()
        }

        // If a new custom track is playing and we had a different custom track, update reference
        if (currentCustomTrack &&
            currentCustomTrack !== lastCustomTrackRef.current &&
            isCustomAudioPlaying) {
            console.log("New custom track detected")
            // The custom track info is already set by the playback context
        }

        // Update references
        lastSpotifyTrackRef.current = currentSpotifyTrack || null
        lastCustomTrackRef.current = currentCustomTrack || null
    }, [currentState?.track_window?.current_track?.uri, customTrackInfo, isCustomAudioPlaying, clearCustomTrackInfo])

    // Effect for Volume Sync with Custom Audio
    useEffect(() => {
        if (customAudioRef?.current) {
            customAudioRef.current.volume = volume
        }
    }, [volume, customAudioRef])

    // Sync volume with device (only for Spotify, not custom audio)
    useEffect(() => {
        const deviceVolume = currentState?.device?.volume_percent
        if (typeof deviceVolume === "number" && !customTrackInfo) {
            const normalizedVolume = deviceVolume / 100
            if (Math.abs(volume - normalizedVolume) > 0.01) {
                setVolume(normalizedVolume)
            }
        }
    }, [currentState?.device?.volume_percent, customTrackInfo, volume])

    // Data Extraction - Fixed to prioritize custom audio info when available
    const isCustomAudioActive = isCustomAudioPlaying && customTrackInfo
    const isSpotifyActive = currentState?.track_window?.current_track && !isCustomAudioActive

    // Use custom track info when available, otherwise use Spotify track info
    const currentTrack = isCustomAudioActive
        ? {
            name: customTrackInfo.title.split(" - ")[0] || customTrackInfo.title,
            album: {images: customTrackInfo.imageUrl ? [{url: customTrackInfo.imageUrl}] : []},
            artists: [{name: customTrackInfo.title.split(" - ")[1] || customTrackInfo.source || "Unknown"}],
            uri: `custom:${Date.now()}`,
            id: `custom-${Date.now()}`,
        }
        : currentState?.track_window?.current_track

    const trackName = currentTrack?.name ?? ""
    const albumImageUrl = currentTrack?.album?.images?.[0]?.url
    const artistName = isCustomAudioActive
        ? customTrackInfo.title.split(" - ")[1] || customTrackInfo.source || "Unknown"
        : (currentTrack?.artists?.map((artist: { name: SimplifiedArtist }) => artist.name).join(", ") ?? "")

    const isPaused = currentState?.paused ?? true
    const nextTrack = isSpotifyActive ? currentState?.track_window?.next_tracks?.[0] : null
    const duration = currentState?.duration ?? 0
    const shuffleState = currentState?.shuffle ?? false
    const repeatState = currentState?.repeat_mode ?? 0

    // Fixed Active Service Logic - prioritize actual playback state
    const activeServiceName = (() => {
        // Simple logic: Show the service that has track info
        if (customTrackInfo) {
            return customTrackInfo.source || "audius"
        }
        // Show Spotify only if there's no custom track info
        if (currentState && currentState.track_window?.current_track) {
            return "spotify"
        }
        return null
    })()

    let activeServiceLogo = null
    let ActiveServiceLogoComponent = null
    if (activeServiceName === "spotify") {
        activeServiceLogo = SPOTIFY_LOGO_URL
    } else if (activeServiceName === "audius") {
        ActiveServiceLogoComponent = AudiusLogo
    } else if (activeServiceName === "apple") {
        activeServiceLogo = APPLE_MUSIC_LOGO_URL
    }

    const OnVolumeChange = async (newVolume: number) => {
        setVolume(newVolume)
        await HandleVolumeChange(newVolume)
    }

    return (
        <div className="music-controller">
            <TrackInfo
                albumImageUrl={albumImageUrl}
                trackName={trackName}
                artistName={artistName}
                activeServiceLogo={activeServiceLogo}
                ActiveServiceLogoComponent={ActiveServiceLogoComponent}
                activeServiceName={activeServiceName || ""}
            />

            <div className="controller-section-center">
                <ControlButtons
                    shuffleState={shuffleState}
                    repeatState={repeatState}
                    isPaused={isPaused}
                    controlsEnabled={controlsEnabled}
                    activeServiceName={activeServiceName || ""}
                    onToggleShuffle={HandleToggleShuffle}
                    onPrevious={HandlePrevious}
                    onPlayPause={HandlePlayPause}
                    onNext={HandleNext}
                    onCycleRepeat={HandleCycleRepeatMode}
                />

                <ProgressBar
                    currentTime={localPositionMs}
                    duration={duration}
                    progressPercent={progressPercent}
                    onProgressBarClick={HandleProgressBarClick}
                />
            </div>

            <div className="controller-section-right">
                <VolumeControl
                    initialVolume={volume}
                    controlsEnabled={controlsEnabled}
                    onVolumeChange={OnVolumeChange}
                />

                <UpNext
                    nextTrack={nextTrack}
                    activeServiceLogo={activeServiceLogo}
                    ActiveServiceLogoComponent={ActiveServiceLogoComponent}
                    activeServiceName={activeServiceName || ""}
                />
            </div>
        </div>
    )
}

export default MusicController