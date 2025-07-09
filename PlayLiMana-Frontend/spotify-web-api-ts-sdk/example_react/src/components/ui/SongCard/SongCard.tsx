import React, { useState, useRef } from "react"
import { CoverImage } from "../CoverImage/CoverImage"
import type { Song } from "../../../models/song"
import { formatDuration } from "../../../utils/format.util"
import styles from "./song-card.module.css"
import { useSpotifyContext } from "../../../context/SpotifyContext.tsx"
import { usePlayback } from "../../../context/PlaybackContext.tsx"
import { SongOptionsPopup } from "./SongOptionsPopup"
import { getSpotifyTrackId } from "../../../utils/spotify.util"
import { useAudiusContext } from "../../../context/AudiusContext"


type SongCardProps = {
    songs: Song[]
}

export const SongCard: React.FC<SongCardProps> = ({ songs }) => {
    const { sdk } = useSpotifyContext()
    const { deviceId, playCustomAudio, stopCustomAudio } = usePlayback()
    const { audiusService } = useAudiusContext()

    const playSelectedSong = async (song: Song) => {
        const links = song.linksForWebPlayer ?? []
        if (!links.length) return

        // 1. Prebuilt Audius MP3 stream
        const prebuiltStream = links.find(
            (l) => l.includes("/stream") && l.includes("format=mp3")
        )
        if (prebuiltStream) {
            stopCustomAudio()
            playCustomAudio(prebuiltStream, {
                title: song.title,
                imageUrl: song.coverUrl,
                source: "audius",
            })
            return
        }

        // 2. Spotify URI
        const firstLink = links[0]
        const spId = getSpotifyTrackId(firstLink)
        if (spId) {
            await sdk?.player.startResumePlayback(deviceId, undefined, [`spotify:track:${spId}`])
            return
        }

        // 3. Audius permalink
        const streamUrl = audiusService?.getStreamUrlFromPermalink(firstLink)
        if (!streamUrl) return

        stopCustomAudio()
        playCustomAudio(streamUrl, {
            title: song.title,
            imageUrl: song.coverUrl,
            source: "audius",
        })
    }

    const addSongToQueue = async (link?: string) => {
        const trackId = getSpotifyTrackId(link)
        if (!trackId || !sdk) return
        await sdk.player.addItemToPlaybackQueue(`spotify:track:${trackId}`, deviceId)
    }

    const playNext = async (link?: string) => {
        const trackId = getSpotifyTrackId(link)
        if (!trackId || !sdk) return
        await sdk.player.addItemToPlaybackQueue(`spotify:track:${trackId}`, deviceId)
    }

    const [openPopupId, setOpenPopupId] = useState<string | null>(null)
    const optionsButtonRefs = useRef<{ [key: string]: React.RefObject<HTMLButtonElement> }>({})

    return (
        <div className={styles.songList}>
            {songs.map((song) => {
                const firstLink = song.linksForWebPlayer?.[0]
                const isSpotify = firstLink?.startsWith("spotify:track:")

                return (
                    <div
                        className={styles.songCard}
                        key={song.songId}
                        onClick={() => playSelectedSong(song)}
                    >
                        <div className={styles.cover}>
                            <CoverImage src={song.coverUrl} type="song" alt={song.title} className={styles.cover} />
                        </div>
                        <div className={styles.songInfo}>
                            <div className={styles.upperRow}>
                                <p className={styles.songTitle}>{song.title}</p>
                                {isSpotify && (
                                    <div className={styles.optionsContainer}>
                                        <button
                                            ref={
                                                (optionsButtonRefs.current[song.songId] =
                                                    optionsButtonRefs.current[song.songId] || React.createRef())
                                            }
                                            className={styles.optionsButton}
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setOpenPopupId(openPopupId === song.songId ? null : song.songId)
                                            }}
                                        >
                                            ⋮
                                        </button>

                                        <SongOptionsPopup
                                            isOpen={openPopupId === song.songId}
                                            onClose={() => setOpenPopupId(null)}
                                            onPlayNext={() => playNext(firstLink)}
                                            onAddToQueue={() => addSongToQueue(firstLink)}
                                            onAddToPlaylist={() => {
                                                console.log("Add to Playlist clicked for", song.title)
                                            }}
                                            buttonRef={optionsButtonRefs.current[song.songId]}
                                        />
                                    </div>
                                )}
                            </div>
                            <div className={styles.bottomRow}>
                                <p className={styles.songArtist}>{song.artists}</p>
                                <div className={styles.playtime}>{formatDuration(song.playtime)}</div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default SongCard
