import type React from "react"
import { useState, useEffect } from "react"
import { useAudiusContext } from "../../../context/AudiusContext"
import type { AudiusPlaylist, AudiusTrack } from "../../../services/audius/AudiusService"
import "./AudiusPlaylistManager.css"

interface AudiusPlaylistManagerProps {
    onPlaylistSelect?: (playlist: AudiusPlaylist) => void
    onTrackSelect?: (track: AudiusTrack) => void
}

const AudiusPlaylistManager: React.FC<AudiusPlaylistManagerProps> = ({ onPlaylistSelect, onTrackSelect }) => {
    const { audiusService, isAuthenticated, user } = useAudiusContext()
    const [playlists, setPlaylists] = useState<AudiusPlaylist[]>([])
    const [selectedPlaylist, setSelectedPlaylist] = useState<AudiusPlaylist | null>(null)
    const [playlistTracks, setPlaylistTracks] = useState<AudiusTrack[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [newPlaylistName, setNewPlaylistName] = useState("")
    const [newPlaylistDescription, setNewPlaylistDescription] = useState("")
    const [newPlaylistPrivate, setNewPlaylistPrivate] = useState(false)

    // Load user playlists when authenticated
    useEffect(() => {
        if (isAuthenticated && audiusService) {
            loadUserPlaylists()
        }
    }, [isAuthenticated, audiusService])

    const loadUserPlaylists = async () => {
        if (!audiusService) return

        setLoading(true)
        setError(null)

        try {
            const userPlaylists = await audiusService.getUserPlaylists()
            setPlaylists(userPlaylists)
            console.log(`Loaded ${userPlaylists.length} user playlists`)
        } catch (err: any) {
            console.error("Failed to load user playlists:", err)
            setError(err.message || "Failed to load playlists")
        } finally {
            setLoading(false)
        }
    }

    const loadPlaylistTracks = async (playlist: AudiusPlaylist) => {
        if (!audiusService) return

        setLoading(true)
        setError(null)

        try {
            const tracks = await audiusService.getPlaylistTracks(playlist.id)
            setPlaylistTracks(tracks)
            setSelectedPlaylist(playlist)
            console.log(`Loaded ${tracks.length} tracks for playlist: ${playlist.playlistName}`)
        } catch (err: any) {
            console.error("Failed to load playlist tracks:", err)
            setError(err.message || "Failed to load playlist tracks")
        } finally {
            setLoading(false)
        }
    }

    const createPlaylist = async () => {
        if (!audiusService || !newPlaylistName.trim()) return

        setLoading(true)
        setError(null)

        try {
            const newPlaylist = await audiusService.createPlaylist(
                newPlaylistName.trim(),
                newPlaylistDescription.trim() || undefined,
                newPlaylistPrivate,
            )

            if (newPlaylist) {
                setPlaylists((prev) => [newPlaylist, ...prev])
                setNewPlaylistName("")
                setNewPlaylistDescription("")
                setNewPlaylistPrivate(false)
                setShowCreateForm(false)
                console.log("Created new playlist:", newPlaylist.playlistName)
            }
        } catch (err: any) {
            console.error("Failed to create playlist:", err)
            setError(err.message || "Failed to create playlist")
        } finally {
            setLoading(false)
        }
    }

    const deletePlaylist = async (playlist: AudiusPlaylist) => {
        if (!audiusService) return

        if (!window.confirm(`Are you sure you want to delete "${playlist.playlistName}"?`)) {
            return
        }

        setLoading(true)
        setError(null)

        try {
            const success = await audiusService.deletePlaylist(playlist.id)
            if (success) {
                setPlaylists((prev) => prev.filter((p) => p.id !== playlist.id))
                if (selectedPlaylist?.id === playlist.id) {
                    setSelectedPlaylist(null)
                    setPlaylistTracks([])
                }
                console.log("Deleted playlist:", playlist.playlistName)
            }
        } catch (err: any) {
            console.error("Failed to delete playlist:", err)
            setError(err.message || "Failed to delete playlist")
        } finally {
            setLoading(false)
        }
    }

    const handlePlaylistClick = (playlist: AudiusPlaylist) => {
        loadPlaylistTracks(playlist)
        onPlaylistSelect?.(playlist)
    }

    const handleTrackClick = (track: AudiusTrack) => {
        onTrackSelect?.(track)
    }

    if (!isAuthenticated) {
        return (
            <div className="audius-playlist-manager">
                <div className="auth-required">
                    <h3>Authentication Required</h3>
                    <p>Please connect your Audius account to manage your playlists.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="audius-playlist-manager">
            <div className="playlist-header">
                <h2>Your Audius Playlists</h2>
                {user && (
                    <div className="user-info">
                        <span>@{user.handle}</span>
                    </div>
                )}
                <button onClick={() => setShowCreateForm(!showCreateForm)} className="create-playlist-btn" disabled={loading}>
                    {showCreateForm ? "Cancel" : "Create Playlist"}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    {error}
                    <button onClick={() => setError(null)} className="dismiss-error">
                        ×
                    </button>
                </div>
            )}

            {showCreateForm && (
                <div className="create-playlist-form">
                    <h3>Create New Playlist</h3>
                    <input
                        type="text"
                        placeholder="Playlist name"
                        value={newPlaylistName}
                        onChange={(e) => setNewPlaylistName(e.target.value)}
                        className="playlist-name-input"
                    />
                    <textarea
                        placeholder="Description (optional)"
                        value={newPlaylistDescription}
                        onChange={(e) => setNewPlaylistDescription(e.target.value)}
                        className="playlist-description-input"
                        rows={3}
                    />
                    <label className="private-checkbox">
                        <input
                            type="checkbox"
                            checked={newPlaylistPrivate}
                            onChange={(e) => setNewPlaylistPrivate(e.target.checked)}
                        />
                        Make playlist private
                    </label>
                    <div className="form-actions">
                        <button onClick={createPlaylist} disabled={loading || !newPlaylistName.trim()} className="create-btn">
                            {loading ? "Creating..." : "Create"}
                        </button>
                        <button onClick={() => setShowCreateForm(false)} className="cancel-btn">
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className="playlist-content">
                <div className="playlists-section">
                    <h3>Playlists ({playlists.length})</h3>
                    {loading && <div className="loading">Loading playlists...</div>}

                    <div className="playlists-grid">
                        {playlists.map((playlist) => (
                            <div
                                key={playlist.id}
                                className={`playlist-card ${selectedPlaylist?.id === playlist.id ? "selected" : ""}`}
                                onClick={() => handlePlaylistClick(playlist)}
                            >
                                {playlist.artwork?.["480x480"] ? (
                                    <img
                                        src={playlist.artwork["480x480"] || "/placeholder.svg"}
                                        alt={playlist.playlistName}
                                        className="playlist-image"
                                    />
                                ) : (
                                    <div className="playlist-image-placeholder">♪</div>
                                )}
                                <div className="playlist-info">
                                    <h4 className="playlist-name">{playlist.playlistName}</h4>
                                    <p className="playlist-meta">
                                        {playlist.trackCount} tracks
                                        {playlist.isPrivate && " • Private"}
                                    </p>
                                    {playlist.description && <p className="playlist-description">{playlist.description}</p>}
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        deletePlaylist(playlist)
                                    }}
                                    className="delete-playlist-btn"
                                    title="Delete playlist"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {selectedPlaylist && (
                    <div className="tracks-section">
                        <h3>
                            Tracks in "{selectedPlaylist.playlistName}" ({playlistTracks.length})
                        </h3>
                        {loading && <div className="loading">Loading tracks...</div>}

                        <div className="tracks-list">
                            {playlistTracks.map((track, index) => (
                                <div key={track.id} className="track-item" onClick={() => handleTrackClick(track)}>
                                    <div className="track-number">{index + 1}</div>
                                    {track.artwork?.["150x150"] ? (
                                        <img
                                            src={track.artwork["150x150"] || "/placeholder.svg"}
                                            alt={track.title}
                                            className="track-image"
                                        />
                                    ) : (
                                        <div className="track-image-placeholder">♪</div>
                                    )}
                                    <div className="track-info">
                                        <h5 className="track-title">{track.title}</h5>
                                        <p className="track-artist">{track.user.name}</p>
                                    </div>
                                    <div className="track-meta">
                    <span className="track-duration">
                      {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, "0")}
                    </span>
                                        <span className="track-plays">{track.playCount.toLocaleString()} plays</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default AudiusPlaylistManager
