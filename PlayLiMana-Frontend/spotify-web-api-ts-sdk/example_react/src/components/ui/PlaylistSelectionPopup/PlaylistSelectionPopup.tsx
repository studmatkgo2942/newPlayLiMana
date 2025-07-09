import type React from "react"
import { useState, useEffect, useRef } from "react"
import { createPortal } from "react-dom"

import type { Playlist } from "../../../models/playlist"
import styles from "./PlaylistSelectionPopup.module.css"
import {addSongToPlaylist, getPlaylists} from "../../../services/playlist/playlistApi.ts";

interface Song {
    songId?: string
    title: string
    artists: string
    album?: string
    coverUrl?: string
    playtime?: number
    linksForWebPlayer: string[]
    uri?: string
}

interface PlaylistSelectionPopupProps {
    isOpen: boolean
    onClose: () => void
    song: Song | null
    onSuccess?: (playlistName: string) => void
}

export const PlaylistSelectionPopup: React.FC<PlaylistSelectionPopupProps> = ({ isOpen, onClose, song, onSuccess }) => {
    const [playlists, setPlaylists] = useState<Playlist[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [addingToPlaylist, setAddingToPlaylist] = useState<number | null>(null)
    const popupRef = useRef<HTMLDivElement>(null)

    // Fetch user's playlists when popup opens
    useEffect(() => {
        if (isOpen) {
            fetchPlaylists()
        }
    }, [isOpen])

    // Handle click outside to close
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

    const fetchPlaylists = async () => {
        setLoading(true)
        setError(null)

        try {
            const data = await getPlaylists()
            setPlaylists(data)
        } catch (err) {
            console.error("Error fetching playlists:", err)
            setError("Failed to load playlists")
        } finally {
            setLoading(false)
        }
    }

    const addSongToPlaylistHandler = async (playlistId: number, playlistName: string) => {
        if (!song) return

        setAddingToPlaylist(playlistId)
        setError(null)

        try {
            // Convert song data to match your SongDTO structure
            // Using the same format as your convertSpotifyTrackToSongDTO function
            const currentDate = new Date().toISOString().split("T")[0]

            const songDTO = {
                songId: -1, // Will be assigned by backend
                title: song.title.trim().substring(0, 200),
                artists: song.artists ? [song.artists] : ["Unknown Artist"],
                album: song.album ?? "Unknown Album",
                genres: [],
                playtime: song.playtime ?? 0,
                releaseDate: null, // Not available from search results
                linksForWebPlayer: song.linksForWebPlayer || [],
                coverUrl: song.coverUrl ?? null,
                positionInPlaylist: 1, // Will be adjusted by backend
                addDate: currentDate,
            }

            await addSongToPlaylist(playlistId, songDTO)

            // Success!
            onSuccess?.(playlistName)
            onClose()
        } catch (err) {
            console.error("Error adding song to playlist:", err)
            setError(err instanceof Error ? err.message : "Failed to add song to playlist")
        } finally {
            setAddingToPlaylist(null)
        }
    }

    if (!isOpen) return null

    const popupContent = (
        <div className={styles.overlay}>
            <div ref={popupRef} className={styles.popup}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Add to Playlist</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ×
                    </button>
                </div>

                {song && (
                    <div className={styles.songInfo}>
                        <img src={song.coverUrl || "/placeholder.svg?height=40&width=40"} alt="" className={styles.songImage} />
                        <div className={styles.songDetails}>
                            <span className={styles.songTitle}>{song.title}</span>
                            <span className={styles.songArtist}>{song.artists}</span>
                        </div>
                    </div>
                )}

                <div className={styles.content}>
                    {loading ? (
                        <div className={styles.loading}>Loading playlists...</div>
                    ) : error ? (
                        <div className={styles.error}>
                            <p>{error}</p>
                            <button className={styles.retryButton} onClick={fetchPlaylists}>
                                Try Again
                            </button>
                        </div>
                    ) : playlists.length === 0 ? (
                        <div className={styles.empty}>
                            <p>No playlists found</p>
                            <p>Create a playlist first to add songs to it</p>
                        </div>
                    ) : (
                        <div className={styles.playlistList}>
                            {playlists.map((playlist) => (
                                <button
                                    key={playlist.playlistId}
                                    className={styles.playlistItem}
                                    onClick={() => addSongToPlaylistHandler(playlist.playlistId, playlist.playlistName)}
                                    disabled={addingToPlaylist === playlist.playlistId}
                                >
                                    <img
                                        src={playlist.coverUrl || "/placeholder.svg?height=48&width=48"}
                                        alt=""
                                        className={styles.playlistImage}
                                    />
                                    <div className={styles.playlistInfo}>
                                        <span className={styles.playlistName}>{playlist.playlistName}</span>
                                        <span className={styles.playlistStats}>
                      {playlist.numberOfSongs} {playlist.numberOfSongs === 1 ? "song" : "songs"}
                    </span>
                                    </div>
                                    {addingToPlaylist === playlist.playlistId && <div className={styles.spinner}>⟳</div>}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )

    return typeof document !== "undefined" ? createPortal(popupContent, document.body) : null
}
