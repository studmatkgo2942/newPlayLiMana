import type React from "react"

interface VolumeControlProps {
    initialVolume: number
    controlsEnabled: boolean
    onVolumeChange: (newVolume: number) => Promise<void>
}

export const VolumeControl: React.FC<VolumeControlProps> = ({
                                                                initialVolume,
                                                                controlsEnabled,
                                                                onVolumeChange,
                                                            }) => {
    const handleVolumeChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = Number.parseFloat(event.target.value)
        await onVolumeChange(newVolume)
    }

    return (
        <div className="volume-control-mc">
            <span className="volume-icon-mc">🔊</span>
            <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={initialVolume}
                onChange={handleVolumeChange}
                className="volume-slider-mc"
                disabled={!controlsEnabled}
                aria-label="Volume"
                title={`Volume: ${Math.round(initialVolume * 100)}%`}
            />
        </div>
    )
}