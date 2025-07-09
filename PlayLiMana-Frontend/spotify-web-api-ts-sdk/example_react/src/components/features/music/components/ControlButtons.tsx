import type React from "react"

// Import your SVG components based on your project structure
import LoopOff from "../../../../assets/icons/controls/loopOff.svg?react"
import LoopOffWhite from "../../../../assets/icons/controls/loopOffWhite.svg?react"
import LoopOn from "../../../../assets/icons/controls/loopOn.svg?react"
import LoopOnce from "../../../../assets/icons/controls/loopOnce.svg?react"
import ShuffleOff from "../../../../assets/icons/controls/shuffleOff.svg?react"
import ShuffleOn from "../../../../assets/icons/controls/shuffleOn.svg?react"
import ShuffleOffWhite from "../../../../assets/icons/controls/shuffleOffWhite.svg?react"
import {useTheme} from "../../../../context/ThemeContext.tsx";

interface ControlButtonsProps {
    shuffleState: boolean
    repeatState: number
    isPaused: boolean
    controlsEnabled: boolean
    activeServiceName: string
    onToggleShuffle: () => Promise<void>
    onPrevious: () => Promise<void>
    onPlayPause: () => Promise<void>
    onNext: () => Promise<void>
    onCycleRepeat: () => Promise<void>
    hasNext?: boolean;
    hasPrev?: boolean;
}

export const ControlButtons: React.FC<ControlButtonsProps> = ({
                                                                  shuffleState,
                                                                  repeatState,
                                                                  isPaused,
                                                                  controlsEnabled,
                                                                  activeServiceName,
                                                                  onToggleShuffle,
                                                                  onPrevious,
                                                                  onPlayPause,
                                                                  onNext,
                                                                  onCycleRepeat,
                                                                  hasNext,
                                                                  hasPrev,
                                                              }) => {
    const { theme } = useTheme()
    const isDarkMode = theme === "dark"

    return (
        <div className="controller-buttons">
            <button
                onClick={onToggleShuffle}
                disabled={!controlsEnabled || activeServiceName !== "spotify"}
                className={`controller-button shuffle-button ${shuffleState ? "active" : ""}`}
                aria-label={shuffleState ? "Disable shuffle" : "Enable shuffle"}
                title={
                    activeServiceName !== "spotify"
                        ? "Shuffle not available for previews"
                        : shuffleState
                            ? "Shuffle is ON"
                            : "Shuffle is OFF"
                }
            >
                {shuffleState ? (
                    <ShuffleOn className="control-icon" aria-hidden="true" />
                ) : isDarkMode ? (
                    <ShuffleOffWhite className="control-icon" aria-hidden="true" />
                ) : (
                    <ShuffleOff className="control-icon" aria-hidden="true" />
                )}
            </button>

            <button
                onClick={onPrevious}
                disabled={ !controlsEnabled || (activeServiceName === "audius" ? !hasPrev : activeServiceName !== "spotify")}
                className="controller-button"
                aria-label="Previous track"
                //title={activeServiceName !== "spotify" ? "Previous not available for previews" : "Previous track"}
                title={activeServiceName === "spotify" ? "Previous track" : hasPrev ? "Previous (Audius queue)" : "No previous track" }
            >
                {"<"} Prev
            </button>

            <button
                onClick={onPlayPause}
                disabled={!controlsEnabled}
                className="controller-button play-pause-button"
                aria-label={isPaused ? "Play" : "Pause"}
                title={isPaused ? "Play" : "Pause"}
            >
                {isPaused ? "▶ Play" : "❚❚ Pause"}
            </button>

            <button
                onClick={onNext}
                disabled={!controlsEnabled || (activeServiceName === "audius" ? !hasNext : activeServiceName !== "spotify")}
                className="controller-button"
                aria-label="Next track"
                title={activeServiceName === "spotify" ? "Next track" : hasNext ? "Next (Audius queue)" : "No next track"}
            >
                Next {">"}
            </button>

            <button
                onClick={onCycleRepeat}
                disabled={!controlsEnabled || activeServiceName !== "spotify"}
                className={`controller-button repeat-button ${repeatState !== 0 ? "active" : ""} repeat-state-${repeatState}`}
                aria-label={`Repeat mode: ${repeatState}`}
                title={
                    activeServiceName !== "spotify"
                        ? "Repeat not available for previews"
                        : `Repeat: ${repeatState === 0 ? "OFF" : repeatState === 1 ? "ALL" : "ONCE"}`
                }
            >
                {repeatState === 1 ? (
                    <LoopOn className="control-icon" aria-hidden="true" />
                ) : repeatState === 2 ? (
                    <LoopOnce className="control-icon" aria-hidden="true" />
                ) : isDarkMode ? (
                    <LoopOffWhite className="control-icon" aria-hidden="true" />
                ) : (
                    <LoopOff className="control-icon" aria-hidden="true" />
                )}
            </button>
        </div>
    )
}