import type React from "react"
import {useRef, useEffect, useState} from "react"
import {createPortal} from "react-dom"
import styles from "./SongOptionsPopup.module.css"

interface SongOptionsPopupProps {
    isOpen: boolean
    onClose: () => void
    onPlayNext: () => void
    onAddToQueue: () => void
    onAddToPlaylist: () => void
    buttonRef: React.RefObject<HTMLButtonElement>
}

export const SongOptionsPopup: React.FC<SongOptionsPopupProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      onPlayNext,
                                                                      onAddToQueue,
                                                                      onAddToPlaylist,
                                                                      buttonRef,
                                                                  }) => {
    const popupRef = useRef<HTMLDivElement>(null)
    const [position, setPosition] = useState({top: 0, left: 0})

    useEffect(() => {
        if (isOpen && buttonRef.current) {
            const buttonRect = buttonRef.current.getBoundingClientRect()
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft

            setPosition({
                top: buttonRect.top + scrollTop - 8, // 8px above the button
                left: buttonRect.right + scrollLeft - 140, // Align right edge with button
            })
        }
    }, [isOpen, buttonRef])

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                popupRef.current &&
                !popupRef.current.contains(event.target as Node) &&
                buttonRef.current &&
                !buttonRef.current.contains(event.target as Node)
            ) {
                onClose()
            }
        }

        const handleScroll = () => {
            if (isOpen) {
                onClose() // Close popup when scrolling
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
            window.addEventListener("scroll", handleScroll, true)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            window.removeEventListener("scroll", handleScroll, true)
        }
    }, [isOpen, onClose, buttonRef])

    if (!isOpen) return null

    const popupContent = (
        <div
            ref={popupRef}
            className={styles.popup}
            style={{
                position: "absolute",
                top: `${position.top}px`,
                left: `${position.left}px`,
            }}
        >
            <button
                className={styles.popupOption}
                onClick={(e) => {
                    e.stopPropagation() // Prevent event from bubbling up
                    onPlayNext()
                    onClose()
                }}
            >
                Play Next
            </button>
            <button
                className={styles.popupOption}
                onClick={(e) => {
                    e.stopPropagation() // Prevent event from bubbling up
                    onAddToQueue()
                    onClose()
                }}
            >
                Add to Queue
            </button>
            <button
                className={styles.popupOption}
                onClick={(e) => {
                    e.stopPropagation()
                    onAddToPlaylist()
                    onClose()
                }}
            >
                Add to Playlist
            </button>
        </div>
    )

    // Render popup at document body level using portal
    return typeof document !== "undefined" ? createPortal(popupContent, document.body) : null
}