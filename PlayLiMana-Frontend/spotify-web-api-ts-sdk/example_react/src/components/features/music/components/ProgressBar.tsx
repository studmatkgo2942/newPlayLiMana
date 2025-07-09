import type React from "react"

// Helper Function to Format Time (Milliseconds to M:SS)
const formatTime = (ms: number): string => {
    if (isNaN(ms) || ms < 0) return "0:00"
    const totalSeconds = Math.floor(ms / 1000)
    const minutes = Math.floor(totalSeconds / 60)
    const seconds = totalSeconds % 60
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`
}

interface ProgressBarProps {
    currentTime: number
    duration: number
    progressPercent: number
    onProgressBarClick?: (event: React.MouseEvent<HTMLDivElement>) => Promise<void>
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
                                                            currentTime,
                                                            duration,
                                                            progressPercent,
                                                            onProgressBarClick,
                                                        }) => {
    if (duration <= 0) return null

    return (
        <div className="progress-bar-container">
            <span className="progress-time current">{formatTime(currentTime)}</span>
            <div className="progress-bar-wrapper">
                <div
                    className="progress-bar-background clickable-progress"
                    onClick={onProgressBarClick}
                    title="Click to seek"
                    style={{ cursor: onProgressBarClick ? "pointer" : "default" }}
                >
                    <div className="progress-bar-foreground" style={{ width: `${progressPercent}%` }} />
                </div>
            </div>
            <span className="progress-time duration">{formatTime(duration)}</span>
        </div>
    )
}