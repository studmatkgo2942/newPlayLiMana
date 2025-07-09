import React from "react"
import {ArtistCard} from "../ArtistCard/ArtistCard"
import {SongItem} from "../SongItem/SongItem"
import {AlbumCard} from "../AlbumCard/AlbumCard"
import {SearchResultDisplayItem} from "../../types/search"
import "./SearchSections.css"

interface ArtistsSectionProps {
    artists: SearchResultDisplayItem[]
    onArtistClick: (artist: SearchResultDisplayItem) => void
}

export const ArtistsSection: React.FC<ArtistsSectionProps> = ({artists, onArtistClick}) => {
    if (artists.length === 0) return null

    return (
        <section className="search-section">
            <h2 className="search-section-title">Artists</h2>
            <div className="artists-grid">
                {artists.map((artist) => (
                    <ArtistCard key={`artist-${artist.id}`} artist={artist} onArtistClick={onArtistClick}/>
                ))}
            </div>
        </section>
    )
}

interface SongsSectionProps {
    tracks: SearchResultDisplayItem[]
    isPremium: boolean | null
    isPlayerReady: boolean
    deviceId: string | null
    openPopupId: string | null
    optionsButtonRefs: { [key: string]: React.RefObject<HTMLButtonElement> }
    onTrackClick: (track: SearchResultDisplayItem) => void
    onOptionsClick: (trackId: string) => void
    onCloseOptions: () => void
    onPlayNext: (trackId: string) => void
    onAddToQueue: (trackId: string) => void
    onAddToPlaylist: (track: SearchResultDisplayItem) => void
    getTrackIdFromUri: (uri: string) => string
}

export const SongsSection: React.FC<SongsSectionProps> = ({
                                                              tracks,
                                                              isPremium,
                                                              isPlayerReady,
                                                              deviceId,
                                                              openPopupId,
                                                              optionsButtonRefs,
                                                              onTrackClick,
                                                              onOptionsClick,
                                                              onCloseOptions,
                                                              onPlayNext,
                                                              onAddToQueue,
                                                              onAddToPlaylist,
                                                              getTrackIdFromUri,
                                                          }) => {
    if (tracks.length === 0) return null

    return (
        <section className="search-section">
            <h2 className="search-section-title">Songs</h2>
            <div className="songs-list">
                {tracks.slice(0, 12).map((track) => (
                    <SongItem
                        key={`track-${track.id}`}
                        track={track}
                        isPremium={isPremium}
                        isPlayerReady={isPlayerReady}
                        deviceId={deviceId}
                        openPopupId={openPopupId}
                        optionsButtonRef={optionsButtonRefs[track.id] || React.createRef()}
                        onTrackClick={onTrackClick}
                        onOptionsClick={onOptionsClick}
                        onCloseOptions={onCloseOptions}
                        onPlayNext={onPlayNext}
                        onAddToQueue={onAddToQueue}
                        onAddToPlaylist={onAddToPlaylist}
                        getTrackIdFromUri={getTrackIdFromUri}
                    />
                ))}
            </div>
        </section>
    )
}

interface AlbumsSectionProps {
    albums: SearchResultDisplayItem[]
    isPremium: boolean | null
    isPlayerReady: boolean
    deviceId: string | null
    onAlbumClick: (album: SearchResultDisplayItem) => void
}

export const AlbumsSection: React.FC<AlbumsSectionProps> = ({
                                                                albums,
                                                                isPremium,
                                                                isPlayerReady,
                                                                deviceId,
                                                                onAlbumClick,
                                                            }) => {
    if (albums.length === 0) return null

    return (
        <section className="search-section">
            <h2 className="search-section-title">Albums & Playlists</h2>
            <div className="albums-grid">
                {albums.slice(0, 8).map((album) => (
                    <AlbumCard
                        key={`album-${album.id}`}
                        album={album}
                        isPremium={isPremium}
                        isPlayerReady={isPlayerReady}
                        deviceId={deviceId}
                        onAlbumClick={onAlbumClick}
                    />
                ))}
            </div>
        </section>
    )
}