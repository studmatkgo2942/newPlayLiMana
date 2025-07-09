import type React from "react"
import {SearchResultDisplayItem} from "../../types/search"
import "./ArtistCard.css"

interface ArtistCardProps {
    artist: SearchResultDisplayItem
    onArtistClick: (artist: SearchResultDisplayItem) => void
}

export const ArtistCard: React.FC<ArtistCardProps> = ({artist, onArtistClick}) => {
    const isClickable = !!artist.externalUrl
    const title = isClickable ? `View ${artist.title} on ${artist.source || "Spotify"}` : artist.title

    return (
        <div
            className={`artist-card ${isClickable ? "clickable" : ""}`}
            onClick={isClickable ? () => onArtistClick(artist) : undefined}
            title={title}
        >
            {artist.imageUrl ? (
                <img src={artist.imageUrl || "/placeholder.svg"} alt="" className="artist-image"/>
            ) : (
                <div className="artist-image-placeholder">♪</div>
            )}
            <div className="artist-info">
                <span className="artist-name">{artist.title}</span>
                <span className="artist-label">Artist{artist.source ? ` • ${artist.source}` : ""}</span>
            </div>
        </div>
    )
}