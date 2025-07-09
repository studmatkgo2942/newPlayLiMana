import type React from "react"
import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import LoginWithSpotifyButton from "../../features/auth/LoginWithSpotifyButton.tsx"
import styles from "./SpotifyAuthModal.module.css"

interface SpotifyAuthModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    feature?: string
    triggerRef?: React.RefObject<HTMLElement>
    position?: "top" | "bottom" | "left" | "right" | "auto"
    useAsPopup?: boolean // Toggle between popup and modal behavior
}

export const SpotifyAuthModal: React.FC<SpotifyAuthModalProps> = ({
                                                                      isOpen,
                                                                      onClose,
                                                                      onConfirm,
                                                                      feature = "this feature",
                                                                      triggerRef,
                                                                      position = "auto",
                                                                      useAsPopup = true,
                                                                  }) => {
    const popupRef = useRef<HTMLDivElement>(null)

    // Handle click outside to close and prevent background scrolling
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside)
            document.body.style.overflow = "hidden" // Prevent background scrolling
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
            document.body.style.overflow = "unset"
        }
    }, [isOpen, onClose])

    // Close on Escape key
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose()
            }
        }

        if (isOpen) {
            document.addEventListener("keydown", handleEscape)
            return () => document.removeEventListener("keydown", handleEscape)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    const popupContent = (
        <div className={styles.overlay}>
            <div ref={popupRef} className={styles.popup}>
                <div className={styles.header}>
                    <div className={styles.titleSection}>
                        <div className={styles.icon}>♪</div>
                        <h2 className={styles.title}>Connect to Spotify</h2>
                    </div>
                    <button className={styles.closeButton} onClick={onClose} aria-label="Close">
                        ×
                    </button>
                </div>

                <div className={styles.content}>
                    <div className={styles.description}>
                        <p>
                            To use <strong>{feature}</strong>, you need to connect your Spotify account.
                        </p>
                        <p>This allows us to search for music and access your playlists.</p>
                    </div>

                    <div className={styles.actions}>
                        <LoginWithSpotifyButton />
                        <button onClick={onClose} className={styles.secondaryButton}>
                            Maybe Later
                        </button>
                    </div>

                    <p className={styles.footer}>You can always connect your Spotify account later in your profile settings.</p>
                </div>
            </div>
        </div>
    )

    return typeof document !== "undefined" ? createPortal(popupContent, document.body) : null
}
