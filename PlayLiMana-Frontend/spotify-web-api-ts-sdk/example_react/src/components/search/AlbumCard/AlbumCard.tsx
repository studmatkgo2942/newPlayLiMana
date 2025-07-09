import type React from "react"
import "./AlbumCard.css"
import { SearchResultDisplayItem } from "../../types/search"

interface AlbumCardProps {
    album: SearchResultDisplayItem
    isPremium: boolean | null
    isPlayerReady: boolean
    deviceId: string | null
    onAlbumClick: (album: SearchResultDisplayItem) => void
}

export const AlbumCard: React.FC<AlbumCardProps> = ({ album, isPremium, isPlayerReady, deviceId, onAlbumClick }) => {
    const canPlayFull = album.source === "spotify" && isPremium === true && isPlayerReady && !!deviceId && !!album.uri
    const hasExternalLink = !!album.externalUrl
    const isClickable = canPlayFull || hasExternalLink

    let itemHoverTitle = album.title
    if (canPlayFull) {
        itemHoverTitle = `Click to play ${album.title}`
    } else if (hasExternalLink) {
        itemHoverTitle = `View ${album.title} on ${album.source || "Spotify"}`
    }

    return (
        <div
            className={`album-card ${isClickable ? "clickable" : ""}`}
            onClick={isClickable ? () => onAlbumClick(album) : undefined}
            title={itemHoverTitle}
        >
            {album.imageUrl ? (
                <img src={album.imageUrl || "/placeholder.svg"} alt="" className="album-image" />
            ) : (
                <div className="album-image-placeholder">♪</div>
            )}
            <div className="album-info">
                <span className="album-title">{album.title}</span>
                <span className="album-label">{album.type}{album.source ? ` • ${album.source}` : ""}</span>
            </div>
        </div>
    )
}