// src/components/AudioPlayer.tsx
import React, { useState, useEffect, useRef } from 'react';

// Import the type for props


// Import CSS for the player
import './AudioPlayer.css';
import {SelectedTrackInfo} from "../../../pages/SearchPage/SearchPage.tsx";

interface AudioPlayerProps {
    trackInfo: SelectedTrackInfo;
    onClose: () => void; // Function to call when closing the player
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ trackInfo, onClose }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [volume, setVolume] = useState<number>(0.7);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Effect to load the new track URL
    useEffect(() => {
        setIsPlaying(false); // Stop playback when track changes
        setIsReady(false);
        if (audioRef.current && trackInfo.url) {
            console.log("AudioPlayer: Loading new track -", trackInfo.title);
            audioRef.current.src = trackInfo.url;
            // Set the initial volume for the new track source
            audioRef.current.volume = volume;
        }
    }, [trackInfo.url, trackInfo.title]);

    // Effect to handle play/pause based on isPlaying state
    useEffect(() => {
        if (isReady && audioRef.current) {
            if (isPlaying) {
                audioRef.current.play().catch(e => console.error("Audio play failed:", e));
            } else {
                audioRef.current.pause();
            }
        }
    }, [isPlaying, isReady]); // Depend on isPlaying and isReady

    // Effect to set volume when audio element is ready and volume state changes
    useEffect(() => {
        if (audioRef.current) {
            console.log("AudioPlayer: Setting audio element volume to", volume);
            audioRef.current.volume = volume;
        }
    }, [volume]);


    const togglePlayPause = () => {
        if (!isReady) return; // Don't allow toggle if not ready
        setIsPlaying(!isPlaying);
    };

    const handleCanPlay = () => {
        console.log("AudioPlayer: Track ready to play -", trackInfo.title);
        setIsReady(true);
        setIsPlaying(true); // Start playing as soon as it's ready
    };

    const handleEnded = () => {
        console.log("AudioPlayer: Preview ended -", trackInfo.title);
        setIsPlaying(false); // Reset play state when preview finishes
    };

    // --- Volume Change Handler ---
    const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(event.target.value);
        setVolume(newVolume);
        // Update audio element volume directly as well
        if (audioRef.current) {
            audioRef.current.volume = newVolume;
        }
    };


    return (
        <div className="audio-player-container">
            {/* Hidden HTML5 Audio Element */}
            <audio
                ref={audioRef}
                onCanPlay={handleCanPlay} // Use onCanPlay or onCanPlayThrough
                onEnded={handleEnded}
                onError={(e) => console.error("Audio Error:", e)}
                preload="auto" // Preload audio metadata/data
            />

            {/* Player UI */}
            <div className="player-content">
                {/* Album Art */}
                {trackInfo.imageUrl ? (
                    <img src={trackInfo.imageUrl} alt={trackInfo.title} className="player-image" />
                ) : (
                    <div className="player-image-placeholder">?</div>
                )}

                {/* Track Title */}
                <div className="player-info">
                    <p className="player-title" title={trackInfo.title}>{trackInfo.title}</p>
                    <p className="player-preview-notice">30s Preview</p>
                </div>

                {/* Play/Pause Button */}
                <button
                    onClick={togglePlayPause}
                    className="player-button"
                    disabled={!isReady} // Disable button until audio is ready
                    title={isPlaying ? "Pause" : "Play"}
                    aria-label={isPlaying ? "Pause preview" : "Play preview"}
                >
                    {/* Simple Play/Pause Icons (replace with SVG icons for better look) */}
                    {isPlaying ? '❚❚' : '▶'}
                </button>

                {/* --- Volume Slider --- */}
                <div className="volume-control">
                    {/* Optional: Speaker Icon */}
                    <span className="volume-icon">🔊</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={handleVolumeChange}
                        className="volume-slider"
                        aria-label="Volume"
                        title={`Volume: ${Math.round(volume * 100)}%`}
                    />
                </div>
                {/* --- End Volume Slider --- */}


                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="player-close-button"
                    title="Close player"
                    aria-label="Close player"
                >
                    &times; {/* Simple 'X' icon */}
                </button>
            </div>

        </div>
    );
};

export default AudioPlayer;