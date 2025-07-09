import type React from "react"
import {SongOptionsPopup} from "../../ui/SongCard/SongOptionsPopup"
import {SearchResultDisplayItem} from "../../types/search"
import "./SongItem.css"

interface SongItemProps {
    track: SearchResultDisplayItem
    isPremium: boolean | null
    isPlayerReady: boolean
    deviceId: string | null
    openPopupId: string | null
    optionsButtonRef: React.RefObject<HTMLButtonElement>
    onTrackClick: (track: SearchResultDisplayItem) => void
    onOptionsClick: (trackId: string) => void
    onCloseOptions: () => void
    onPlayNext: (trackId: string) => void
    onAddToQueue: (trackId: string) => void
    onAddToPlaylist: (track: SearchResultDisplayItem) => void
    getTrackIdFromUri: (uri: string) => string
}

export const SongItem: React.FC<SongItemProps> = ({
                                                      track,
                                                      isPremium,
                                                      isPlayerReady,
                                                      deviceId,
                                                      openPopupId,
                                                      optionsButtonRef,
                                                      onTrackClick,
                                                      onOptionsClick,
                                                      onCloseOptions,
                                                      onPlayNext,
                                                      onAddToQueue,
                                                      onAddToPlaylist,
                                                      getTrackIdFromUri,
                                                  }) => {
    const canPreview = !!track.previewUrl
    const canPlayFull = track.source === "spotify" && isPremium === true && isPlayerReady && !!deviceId && !!track.uri
    const hasExternalLink = !!track.externalUrl
    const isClickable = canPlayFull || canPreview || hasExternalLink

    let itemHoverTitle = track.title
    if (canPlayFull) {
        itemHoverTitle = `Click to play ${track.title}`
    } else if (canPreview) {
        itemHoverTitle = `Click to preview ${track.title}`
    } else if (hasExternalLink) {
        itemHoverTitle = `View ${track.title} on ${track.source || "Spotify"}`
    }

    return (
        <div className="song-item-wrapper">
            <div
                className={`song-item ${isClickable ? "clickable" : ""}`}
                onClick={isClickable ? () => onTrackClick(track) : undefined}
                title={itemHoverTitle}
            >
                {track.imageUrl ? (
                    <img src={track.imageUrl || "/placeholder.svg"} alt="" className="song-image"/>
                ) : (
                    <div className="song-image-placeholder">♪</div>
                )}
                <div className="song-info">
                    <span className="song-title">{track.title.split(" - ")[0]}</span>
                    <span className="song-artist">
                        {track.title.split(" - ")[1]}{track.source ? ` • ${track.source}` : ""}
                    </span>
                </div>

                {/* Options Button - Show for Spotify tracks with URI */}
                {track.uri && track.source === "spotify" && (
                    <button
                        ref={optionsButtonRef}
                        className="song-options-button"
                        onClick={(e) => {
                            e.stopPropagation()
                            onOptionsClick(track.id)
                        }}
                        title="More options"
                    >
                        ⋮
                    </button>
                )}
            </div>

            {/* Song Options Popup - Only for Spotify tracks */}
            {track.uri && track.source === "spotify" && (
                <SongOptionsPopup
                    isOpen={openPopupId === track.id}
                    onClose={onCloseOptions}
                    onPlayNext={() => {
                        const trackId = getTrackIdFromUri(track.uri!)
                        onPlayNext(trackId)
                    }}
                    onAddToQueue={() => {
                        const trackId = getTrackIdFromUri(track.uri!)
                        onAddToQueue(trackId)
                    }}
                    onAddToPlaylist={() => onAddToPlaylist(track)}
                    buttonRef={optionsButtonRef}
                />
            )}
        </div>
    )
}