import { useState, useCallback, useRef } from "react"
import { useNavigate } from "react-router-dom"
import type React from "react"

export const useSpotifyAuthPrompt = () => {
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [currentFeature, setCurrentFeature] = useState<string>("")
    const [popupPosition, setPopupPosition] = useState<"top" | "bottom" | "left" | "right" | "auto">("auto")
    const triggerRef = useRef<HTMLElement>(null)
    const navigate = useNavigate()

    const promptForSpotifyAuth = useCallback(
        (
            featureName: string,
            triggerElement?: React.RefObject<HTMLElement>,
            position: "top" | "bottom" | "left" | "right" | "auto" = "auto",
        ) => {
            setCurrentFeature(featureName)
            setPopupPosition(position)

            if (triggerElement?.current) {
                triggerRef.current = triggerElement.current
            }

            setIsModalOpen(true)
        },
        [],
    )

    const handleConfirmAuth = useCallback(() => {
        setIsModalOpen(false)
        // Navigate to your Spotify auth page
        navigate("/auth/spotify")
    }, [navigate])

    const handleCloseModal = useCallback(() => {
        setIsModalOpen(false)
        setCurrentFeature("")
    }, [])

    return {
        isModalOpen,
        currentFeature,
        triggerRef,
        popupPosition,
        promptForSpotifyAuth,
        handleConfirmAuth,
        handleCloseModal,
    }
}
