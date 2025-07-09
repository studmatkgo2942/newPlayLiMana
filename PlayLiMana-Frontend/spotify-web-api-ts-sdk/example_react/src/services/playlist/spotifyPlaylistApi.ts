// API service for importing Spotify playlists to Quarkus backend
import type {Playlist} from "../../models/playlist"
import {mapPlaylistDTOToPlaylist} from "../../utils/format.util"

// Use the same API URL pattern as your existing playlist API
const API_URL = "api/v1/playlists/create"

// Function to get proper authorization headers
const getHeaders = () => {
    const token = localStorage.getItem("authToken") || localStorage.getItem("jwt") || localStorage.getItem("token")

    if (token && token !== "dummy-token") {
        return {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        }
    }

    return {
        "Content-Type": "application/json",
        "X-Import-Source": "spotify",
    }
}

export interface SpotifyTrack {
    id: string
    name: string
    artists: string[]
    album: string
    duration_ms: number
    preview_url: string | null
    external_urls: { spotify?: string; [key: string]: string | undefined }
    uri: string
    release_date?: string | null
    genres?: string[]
    images?: string
}

export interface SpotifyPlaylistImport {
    spotifyId: string
    name: string
    description: string
    isPublic: boolean
    tracks: SpotifyTrack[]
    totalTracks: number
    images: Array<{ url: string; height?: number; width?: number }>
}

export interface PlaylistDTO {
    playlistId: number
    playlistName: string
    description: string
    visibility: "PUBLIC" | "PRIVATE" | "SHARED"
    sorting: "CUSTOM" | "ALPHABETICAL" | "DATE_ADDED" | "DURATION"
    songs: SongDTO[]
    numberOfSongs: number
    playtime: number
    coverUrl: string | null
}

export interface SongDTO {
    songId: number
    title: string
    artists: string[]
    album: string
    genres: string[]
    playtime: number
    releaseDate: string | null
    linksForWebPlayer: string[]
    coverUrl: string | null
    positionInPlaylist: number
    addDate: string
}

export interface PlaylistImportResponseDTO {
    importedPlaylists: PlaylistDTO[]
    successCount: number
    failureCount: number
    errors?: string[]
}

// Helper function to handle fetch responses
const handleFetchResponse = async (response: Response) => {
    if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`

        try {
            const errorData = await response.json()
            if (errorData.message) {
                errorMessage = errorData.message
            }
        } catch {
            // If we can't parse the error response, use the default message
        }

        throw new Error(errorMessage)
    }

    return response.json()
}

// Helper function to validate and sanitize playlist name
const sanitizePlaylistName = (name: string): string => {
    if (!name || typeof name !== "string") {
        return "Imported Playlist"
    }

    const trimmed = name.trim()
    if (trimmed.length === 0) {
        return "Imported Playlist"
    }

    // Match your backend validation: MAX_LEN_NAME = 100
    return trimmed.substring(0, 100)
}

// Helper function to validate description
const sanitizeDescription = (description: string): string => {
    if (!description || typeof description !== "string") {
        return ""
    }

    // Match your backend validation: MAX_LEN_DESCRIPTION = 250
    return description.trim().substring(0, 250)
}

// Convert Spotify data to your existing PlaylistDTO format
const convertToPlaylistDTO = (playlist: SpotifyPlaylistImport): PlaylistDTO => {
    const currentDate = new Date().toISOString().split("T")[0] // YYYY-MM-DD format

    const playlistName = sanitizePlaylistName(playlist.name)
    const description = sanitizeDescription(playlist.description)

    console.log(`Converting playlist: "${playlist.name}" -> "${playlistName}"`)

    // Convert tracks to SongDTO format
    const songs: SongDTO[] = playlist.tracks.map((track, index) => {
        const playtimeInSeconds = Math.round(track.duration_ms / 1000)

        const title = track.name && typeof track.name === "string" ? track.name.trim().substring(0, 200) : "Unknown Track"
        const album =
            track.album && typeof track.album === "string" ? track.album.trim().substring(0, 200) : "Unknown Album"

        // Format release date to match your backend expectations
        let releaseDate: string | null = null
        if (track.release_date && typeof track.release_date === "string") {
            const dateStr = track.release_date.trim()
            if (dateStr.length === 4) {
                releaseDate = `${dateStr}-01-01`
            } else if (dateStr.length === 7) {
                releaseDate = `${dateStr}-01`
            } else if (dateStr.length >= 10) {
                releaseDate = dateStr.substring(0, 10)
            }
        }

        // Create web player links
        const linksForWebPlayer: string[] = []
        if (track.external_urls?.spotify && typeof track.external_urls.spotify === "string") {
            linksForWebPlayer.push(track.external_urls.spotify)
        }
        if (track.preview_url && typeof track.preview_url === "string") {
            linksForWebPlayer.push(track.preview_url)
        }

        // Get cover image
        let coverUrl: string | null = null
        if (track.images && Array.isArray(track.images) && track.images.length > 0) {
            coverUrl = track.images[0].url
        }

        // Validate artists array
        const artists =
            Array.isArray(track.artists) && track.artists.length > 0
                ? track.artists.filter((artist) => artist && typeof artist === "string").map((artist) => artist.trim())
                : ["Unknown Artist"]

        return {
            songId: -1, // Will be assigned by backend
            title: title,
            artists: artists,
            album: album,
            genres: Array.isArray(track.genres) ? track.genres : [],
            playtime: Math.max(0, playtimeInSeconds),
            releaseDate: releaseDate,
            linksForWebPlayer: linksForWebPlayer,
            coverUrl: coverUrl,
            positionInPlaylist: index + 1,
            addDate: currentDate,
        }
    })

    // Calculate total playtime
    const totalPlaytime = songs.reduce((sum, song) => sum + song.playtime, 0)

    return {
        playlistId: -1, // Will be assigned by backend
        playlistName: playlistName,
        description: description,
        visibility: playlist.isPublic ? "PUBLIC" : "PRIVATE",
        sorting: "CUSTOM", // Default for imported playlists
        songs: songs,
        numberOfSongs: songs.length,
        playtime: totalPlaytime,
        coverUrl: playlist.images && playlist.images.length > 0 ? playlist.images[0].url : null,
    }
}

// POST import Spotify playlists - matches your backend createPlaylist pattern
export const importSpotifyPlaylists = async (playlists: SpotifyPlaylistImport[]): Promise<Playlist[]> => {
    try {
        console.log("Sending playlists to Quarkus backend:", playlists)

        if (!Array.isArray(playlists) || playlists.length === 0) {
            throw new Error("No playlists provided for import")
        }

        // Convert to your backend's expected format
        const playlistDTOs = playlists.map(convertToPlaylistDTO)

        console.log("Converted to PlaylistDTO format:", playlistDTOs)

        // Validate that all playlists have valid names
        const invalidPlaylists = playlistDTOs.filter((p) => !p.playlistName || p.playlistName.trim().length === 0)
        if (invalidPlaylists.length > 0) {
            console.error("Found playlists with invalid names:", invalidPlaylists)
            throw new Error("Some playlists have invalid or missing names")
        }

        const headers = getHeaders()
        console.log("Using headers:", headers)

        // Import each playlist individually using your existing createPlaylist pattern
        const importedPlaylists: Playlist[] = []
        const errors: string[] = []

        for (const playlistDTO of playlistDTOs) {
            try {
                console.log(`Importing playlist: ${playlistDTO.playlistName}`)

                const response = await fetch(API_URL, {
                    method: "POST",
                    headers: headers,
                    body: JSON.stringify(playlistDTO),
                })

                const data = await handleFetchResponse(response)

                if (data) {
                    const importedPlaylist = mapPlaylistDTOToPlaylist(data)
                    importedPlaylists.push(importedPlaylist)
                    console.log(`Successfully imported: ${playlistDTO.playlistName}`)
                }
            } catch (error) {
                console.error(`Failed to import playlist ${playlistDTO.playlistName}:`, error)
                const errorMessage = error instanceof Error ? error.message : "Unknown error"
                errors.push(`Failed to import "${playlistDTO.playlistName}": ${errorMessage}`)
            }
        }

        if (importedPlaylists.length === 0) {
            throw new Error(`Failed to import any playlists. Errors: ${errors.join(", ")}`)
        }

        if (errors.length > 0) {
            console.warn("Some playlists failed to import:", errors)
        }

        console.log(`Successfully imported ${importedPlaylists.length} out of ${playlists.length} playlists`)
        return importedPlaylists
    } catch (error) {
        console.error("Error importing Spotify playlists:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        throw new Error(`Failed to import playlists: ${errorMessage}`)
    }
}

// Check if playlist exists by name (since your backend doesn't have spotifyId field)
export const checkPlaylistExists = async (playlistName: string): Promise<boolean> => {
    try {
        const headers = getHeaders()
        const response = await fetch(API_URL, {
            method: "GET",
            headers: headers,
        })

        const data = await handleFetchResponse(response)

        if (data && Array.isArray(data)) {
            return data.some((playlist: PlaylistDTO) => playlist.playlistName.toLowerCase() === playlistName.toLowerCase())
        }

        return false
    } catch (error) {
        console.error("Error checking if playlist exists:", error)
        return false
    }
}

// Batch import with progress tracking
export const importSpotifyPlaylistsWithProgress = async (
    playlists: SpotifyPlaylistImport[],
    onProgress?: (progress: { completed: number; total: number; currentPlaylist?: string }) => void,
): Promise<Playlist[]> => {
    try {
        console.log("Starting batch import with progress tracking:", playlists.length, "playlists")

        const importedPlaylists: Playlist[] = []
        const errors: string[] = []

        for (let i = 0; i < playlists.length; i++) {
            const playlist = playlists[i]

            if (onProgress) {
                onProgress({
                    completed: i,
                    total: playlists.length,
                    currentPlaylist: playlist.name,
                })
            }

            try {
                const result = await importSpotifyPlaylists([playlist])
                importedPlaylists.push(...result)
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Unknown error"
                errors.push(`Failed to import "${playlist.name}": ${errorMessage}`)
            }
        }

        if (onProgress) {
            onProgress({
                completed: playlists.length,
                total: playlists.length,
            })
        }

        console.log("Batch import completed:", importedPlaylists.length, "successful")
        return importedPlaylists
    } catch (error) {
        console.error("Error in batch import:", error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
        throw new Error(`Failed to import playlists: ${errorMessage}`)
    }
}