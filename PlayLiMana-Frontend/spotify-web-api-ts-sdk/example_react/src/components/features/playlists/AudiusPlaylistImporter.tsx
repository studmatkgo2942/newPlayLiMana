import type React from "react"
import { useState, useEffect } from "react"
import { useAudiusContext } from "../../../context/AudiusContext"
import type { AudiusPlaylist, AudiusTrack } from "../../../services/audius/AudiusService"
import "./AudiusPlaylistImporter.css"

interface AudiusPlaylistImporterProps {
    onImportComplete?: (importedPlaylists: any[]) => void
    onClose?: () => void
}

const AudiusPlaylistImporter: React.FC<AudiusPlaylistImporterProps> = ({ onImportComplete, onClose }) => {
    const { audiusService, isAuthenticated, user } = useAudiusContext()
    const [userPlaylists, setUserPlaylists] = useState<AudiusPlaylist[]>([])
    const [selectedPlaylists, setSelectedPlaylists] = useState<Set<string>>(new Set())
    const [loading, setLoading] = useState(false)
    const [importing, setImporting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [importProgress, setImportProgress] = useState<{ current: number; total: number } | null>(null)

    // Load user's Audius playlists
    useEffect(() => {
        if (isAuthenticated && audiusService && user) {
            loadUserPlaylists()
        }
    }, [isAuthenticated, audiusService, user])

    const loadUserPlaylists = async () => {
        if (!audiusService || !user) return

        setLoading(true)
        setError(null)

        try {
            console.log("Loading user playlists from Audius...")

            // Try to get user playlists - this will require authentication
            const playlists = await audiusService.getUserPlaylists()
            setUserPlaylists(playlists)
            console.log(`Loaded ${playlists.length} user playlists`)

            // Also try to get user favorites as a special "playlist"
            try {
                const favorites = await audiusService.getUserFavorites()
                if (favorites.length > 0) {
                    const favoritesPlaylist: AudiusPlaylist = {
                        id: "user-favorites",
                        playlistName: "My Favorites",
                        description: "Your liked tracks on Audius",
                        user: user,
                        trackCount: favorites.length,
                        totalPlayTime: favorites.reduce((total, track) => total + track.duration, 0),
                        isAlbum: false,
                        isPrivate: false,
                        tracks: favorites,
                        externalUrl: `https://audius.co/${user.handle}/favorites`,
                    }
                    setUserPlaylists((prev) => [favoritesPlaylist, ...prev])
                }
            } catch (favError) {
                console.warn("Could not load user favorites:", favError)
            }
        } catch (err: any) {
            console.error("Failed to load user playlists:", err)
            if (err.message.includes("Authentication required")) {
                setError("Please connect your Audius account to access your playlists")
            } else {
                setError(err.message || "Failed to load playlists")
            }
        } finally {
            setLoading(false)
        }
    }

    const togglePlaylistSelection = (playlistId: string) => {
        const newSelection = new Set(selectedPlaylists)
        if (newSelection.has(playlistId)) {
            newSelection.delete(playlistId)
        } else {
            newSelection.add(playlistId)
        }
        setSelectedPlaylists(newSelection)
    }

    const selectAllPlaylists = () => {
        if (selectedPlaylists.size === userPlaylists.length) {
            setSelectedPlaylists(new Set())
        } else {
            setSelectedPlaylists(new Set(userPlaylists.map((p) => p.id)))
        }
    }

    const convertAudiusPlaylistToSpotify = async (audiusPlaylist: AudiusPlaylist): Promise<any> => {
        if (!audiusService) throw new Error("Audius service not available")

        // Get tracks for the playlist
        const tracks = await audiusService.getPlaylistTracks(audiusPlaylist.id)

        // Convert Audius tracks to a format compatible with your playlist system
        const convertedTracks = tracks.map((track: AudiusTrack) => ({
            songId: `audius-${track.id}`,
            title: track.title,
            artists: track.user.name,
            album: "Unknown Album", // Audius doesn't have album concept
            coverUrl: track.artwork?.["480x480"] || track.artwork?.["150x150"] || "/placeholder.svg",
            playtime: track.duration * 1000, // Convert to milliseconds
            linksForWebPlayer: [`https://audius.co/${track.user.handle}/${track.title.toLowerCase().replace(/\s+/g, "-")}`],
            releaseDate: track.releaseDate || new Date().toISOString(),
            addedAt: new Date().toISOString(),
            // Add Audius-specific data
            audiusData: {
                trackId: track.id,
                streamUrl: track.streamUrl,
                source: "audius",
                userHandle: track.user.handle,
                playCount: track.playCount,
                favoriteCount: track.favoriteCount,
            },
        }))

        return {
            playlistId: Date.now(), // Generate a temporary ID
            playlistName: audiusPlaylist.playlistName,
            description: audiusPlaylist.description || `Imported from Audius (@${audiusPlaylist.user.handle})`,
            coverUrl: audiusPlaylist.artwork?.["480x480"] || audiusPlaylist.artwork?.["150x150"] || "/placeholder.svg",
            visibility: audiusPlaylist.isPrivate ? "Private" : "Public",
            numberOfSongs: convertedTracks.length,
            playtime: convertedTracks.reduce((total, track) => total + track.playtime, 0),
            songs: convertedTracks,
            source: "audius",
            originalAudiusId: audiusPlaylist.id,
            importedAt: new Date().toISOString(),
        }
    }

    const importSelectedPlaylists = async () => {
        if (selectedPlaylists.size === 0) return

        setImporting(true)
        setError(null)
        setImportProgress({ current: 0, total: selectedPlaylists.size })

        try {
            const playlistsToImport = userPlaylists.filter((p) => selectedPlaylists.has(p.id))
            const importedPlaylists = []

            for (let i = 0; i < playlistsToImport.length; i++) {
                const playlist = playlistsToImport[i]
                setImportProgress({ current: i + 1, total: playlistsToImport.length })

                try {
                    console.log(`Importing playlist ${i + 1}/${playlistsToImport.length}: ${playlist.playlistName}`)
                    const convertedPlaylist = await convertAudiusPlaylistToSpotify(playlist)
                    importedPlaylists.push(convertedPlaylist)
                } catch (err) {
                    console.error(`Failed to import playlist ${playlist.playlistName}:`, err)
                    // Continue with other playlists
                }
            }

            console.log(`Successfully imported ${importedPlaylists.length} playlists`)
            onImportComplete?.(importedPlaylists)
            onClose?.()
        } catch (err: any) {
            console.error("Import failed:", err)
            setError(err.message || "Import failed")
        } finally {
            setImporting(false)
            setImportProgress(null)
        }
    }

    if (!isAuthenticated) {
        return (
            <div className="audius-importer">
                <div className="auth-required">
                    <h3>Authentication Required</h3>
                    <p>Please connect your Audius account to import your playlists.</p>
                    <button onClick={onClose} className="close-btn">
                        Close
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="audius-importer">
            <div className="importer-header">
                <h2>Import Playlists from Audius</h2>
                {user && (
                    <div className="user-info">
                        <span>@{user.handle}</span>
                        <span>{userPlaylists.length} playlists available</span>
                    </div>
                )}
                <button onClick={onClose} className="close-btn">
                    ×
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

            {loading && <div className="loading">Loading your Audius playlists...</div>}

            {!loading && userPlaylists.length === 0 && (
                <div className="no-playlists">
                    <p>No playlists found in your Audius account.</p>
                    <button onClick={loadUserPlaylists} className="retry-btn">
                        Retry
                    </button>
                </div>
            )}

            {!loading && userPlaylists.length > 0 && (
                <>
                    <div className="selection-controls">
                        <button onClick={selectAllPlaylists} className="select-all-btn">
                            {selectedPlaylists.size === userPlaylists.length ? "Deselect All" : "Select All"}
                        </button>
                        <span className="selection-count">
              {selectedPlaylists.size} of {userPlaylists.length} selected
            </span>
                    </div>

                    <div className="playlists-list">
                        {userPlaylists.map((playlist) => (
                            <div
                                key={playlist.id}
                                className={`playlist-item ${selectedPlaylists.has(playlist.id) ? "selected" : ""}`}
                                onClick={() => togglePlaylistSelection(playlist.id)}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedPlaylists.has(playlist.id)}
                                    onChange={() => togglePlaylistSelection(playlist.id)}
                                    className="playlist-checkbox"
                                />
                                {playlist.artwork?.["150x150"] ? (
                                    <img
                                        src={playlist.artwork["150x150"] || "/placeholder.svg"}
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
                            </div>
                        ))}
                    </div>

                    <div className="import-controls">
                        {importing && importProgress && (
                            <div className="import-progress">
                                <div className="progress-bar">
                                    <div
                                        className="progress-fill"
                                        style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                                    />
                                </div>
                                <span className="progress-text">
                  Importing {importProgress.current} of {importProgress.total} playlists...
                </span>
                            </div>
                        )}

                        <div className="action-buttons">
                            <button onClick={onClose} className="cancel-btn" disabled={importing}>
                                Cancel
                            </button>
                            <button
                                onClick={importSelectedPlaylists}
                                className="import-btn"
                                disabled={selectedPlaylists.size === 0 || importing}
                            >
                                {importing
                                    ? "Importing..."
                                    : `Import ${selectedPlaylists.size} Playlist${selectedPlaylists.size !== 1 ? "s" : ""}`}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}

export default AudiusPlaylistImporter
