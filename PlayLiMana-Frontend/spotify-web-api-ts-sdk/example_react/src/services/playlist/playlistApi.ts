// Complete Playlist API Service - All playlist operations in one place
import type { Playlist } from "../../models/playlist"
import { mapPlaylistDTOToPlaylist } from "../../utils/format.util"
import {PlaylistedTrack, Track} from "@spotify/web-api-ts-sdk";
import { getAuth } from "firebase/auth"
import { AudiusPlaylist, AudiusTrack } from "../audius/AudiusService"

const API_URL = "/api/v1/playlists"

async function getHeaders(): Promise<Record<string, string>> {
  const user = getAuth().currentUser
  if (!user) {
    throw new Error("User not authenticated")
  }
  const idToken = await user.getIdToken(/* forceRefresh = */ false)
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${idToken}`,
  }
}

const sanitizePlaylistName = (n: string) =>
    (n?.trim() || "Imported Playlist").substring(0, 100)

const sanitizeDescription = (d: string) =>
    (d?.trim() || "").substring(0, 250)

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

export const createPlaylist = async (playlist: Playlist): Promise<Playlist> => {
  try {
    console.log("[playlistApi] trying to create playlist: " + playlist.playlistName);
    const headers = await getHeaders()
    const response = await fetch(API_URL, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(playlist),
    })

    const data = await handleFetchResponse(response)
    return mapPlaylistDTOToPlaylist(data)
  } catch (error) {
    console.error("Error creating playlist:", error)
    throw error
  }
}

export const editPlaylist = async (playlist: Playlist): Promise<Playlist> => {
  try {
    console.log("[playlistApi] trying to edit playlist: " + playlist.playlistName);
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}/${playlist.playlistId}`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify(playlist),
    })

    const data = await handleFetchResponse(response)
    return mapPlaylistDTOToPlaylist(data)
  } catch (error) {
    console.error("Error editing playlist:", error)
    throw error
  }
}

export const deletePlaylist = async (playlistId: number): Promise<number> => {
  try {
    console.log("[playlistApi] trying to delete playlist with ID: " + playlistId);
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}/${playlistId}/delete`, {
      method: "DELETE",
      headers: headers,
    })

    if (!response.ok) {
      // Falls Fehler, versuche JSON zu lesen (für Fehlerdetails)
      const errorData = await response.json().catch(() => null);
      const errorMessage = errorData?.message || response.statusText;
      throw new Error(`HTTP ${response.status}: ${errorMessage}`);
    }
    
    const data = await handleFetchResponse(response);
    return data.deletedPlaylistId;
  } catch (error) {
    console.error("Error deleting playlist:", error);
    throw error;
  }
}

export const copyPlaylist = async (playlistId: number): Promise<Playlist> => {
  try {
    console.log("[playlistApi] trying to copy playlist with ID: " + playlistId);
    const headers = await getHeaders();
    const response = await fetch(`${API_URL}/${playlistId}/copy`, {
      method: "POST",
      headers: headers,
    });

    const data = await handleFetchResponse(response);
    return mapPlaylistDTOToPlaylist(data);
  } catch (error) {
    console.error("Error copying playlist:", error);
    throw error;
  }
};


export const getPlaylists = async (): Promise<Playlist[]> => {
  try {
    console.log("[playlistApi] trying to get library");
    const headers = await getHeaders()
    const response = await fetch(API_URL, {
      method: "GET",
      headers: headers,
    })
    const data = await handleFetchResponse(response)
    console.log("[playlistApi] got library data. Now mapping...");
    return Array.isArray(data) ? data.map(mapPlaylistDTOToPlaylist) : []
  } catch (error) {
    console.error("Error fetching playlists:", error)
    throw error
  }
}

export const getPlaylistById = async (playlistId: number): Promise<Playlist> => {
  try {
    console.log("[playlistApi] trying to get playlist with ID: " + playlistId);
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}/${playlistId}`, {
      method: "GET",
      headers: headers,
    })

    const data = await handleFetchResponse(response)
    return mapPlaylistDTOToPlaylist(data)
  } catch (error) {
    console.error("Error fetching playlist:", error)
    throw error
  }
}

// ===== MISSING FUNCTIONS THAT WERE DELETED =====

// Fetch all playlists (was missing)
export const fetchPlaylists = async (): Promise<Playlist[]> => {
  return getPlaylists() // Use the existing getPlaylists function
}

// Fetch playlist by ID (was missing)
export const fetchPlaylistById = async (playlistId: number): Promise<Playlist> => {
  return getPlaylistById(playlistId) // Use the existing getPlaylistById function
}

// Change song order in playlist
export const changeSongOrder = async (playlistId: number, songId: number, newPosition: number): Promise<any> => {
  try {
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}/${playlistId}/songs/${songId}/position`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify({ position: newPosition }),
    })

    return await handleFetchResponse(response)
  } catch (error) {
    console.error("Error changing song order:", error)
    throw error
  }
}

// Change playlist name
export const changePlaylistName = async (playlistId: number, newName: string): Promise<Playlist> => {
  try {
    console.log("[playlistApi] trying to change name of playlist with ID: " + playlistId);
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}/${playlistId}/name`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify({ name: newName }),
    })

    const data = await handleFetchResponse(response)
    return mapPlaylistDTOToPlaylist(data)
  } catch (error) {
    console.error("Error changing playlist name:", error)
    throw error
  }
}

// Change playlist description
export const changePlaylistDescription = async (playlistId: number, newDescription: string): Promise<Playlist> => {
  try {
    console.log("[playlistApi] trying to change description of playlist with ID: " + playlistId);
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}/${playlistId}/description`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify({ description: newDescription }),
    })

    const data = await handleFetchResponse(response)
    return mapPlaylistDTOToPlaylist(data)
  } catch (error) {
    console.error("Error changing playlist description:", error)
    throw error
  }
}

// Change playlist visibility
export const changePlaylistVisibility = async (playlistId: number, visibility: string): Promise<Playlist> => {
  try {
    console.log("[playlistApi] trying to change visibility of playlist with ID: " + playlistId);
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}/${playlistId}/visibility`, {
      method: "PUT",
      headers: headers,
      body: JSON.stringify({ visibility: visibility.toUpperCase() }),
    })

    const data = await handleFetchResponse(response)
    return mapPlaylistDTOToPlaylist(data)
  } catch (error) {
    console.error("Error changing playlist visibility:", error)
    throw error
  }
}

export const getPublicPlaylists = async (): Promise<Playlist[]> => {
  try {
    console.log("[playlistApi] trying to get all public playlists");
    const response = await fetch(`${API_URL}/public`, {
      method: "GET",
    });

    const data = await handleFetchResponse(response);
    return Array.isArray(data) ? data.map(mapPlaylistDTOToPlaylist) : [];
  } catch (error) {
    console.error("Error fetching public playlists:", error);
    throw error;
  }
}

export const getPublicPlaylistById = async (playlistId: number): Promise<Playlist> => {
  try {
    const response = await fetch(`${API_URL}/public/${playlistId}`, {
      method: "GET",
    });
    const data = await handleFetchResponse(response);
    return mapPlaylistDTOToPlaylist(data)

  } catch (error) {
    console.error("Error fetching public public playlist:", error)
    throw error;
  }


}

// ===== SONG OPERATIONS =====

export const addSongToPlaylist = async (playlistId: number, song: any): Promise<any> => {
  try {
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}/${playlistId}/songs`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(song),
    })

    return await handleFetchResponse(response)
  } catch (error) {
    console.error("Error adding song to playlist:", error)
    throw error
  }
}

export const addSongsToPlaylist = async (playlistId: number, songs: any[]): Promise<any> => {
  try {
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}/${playlistId}/songs/batch`, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ songs }),
    })

    return await handleFetchResponse(response)
  } catch (error) {
    console.error("Error adding songs to playlist:", error)
    throw error
  }
}

export const removeSongFromPlaylist = async (playlistId: number, songId: number): Promise<void> => {
  try {
    const headers = await getHeaders()
    const response = await fetch(`${API_URL}/${playlistId}/songs/${songId}`, {
      method: "DELETE",
      headers: headers,
    })

    await handleFetchResponse(response)
  } catch (error) {
    console.error("Error removing song from playlist:", error)
    throw error
  }
}

// ===== SPOTIFY IMPORT FUNCTIONALITY =====

// DTOs for backend communication
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

// Minimal interface for Spotify playlist data
export interface SpotifyPlaylistData {
  spotifyId: string
  name: string
  description: string
  isPublic: boolean
  images: Array<{ url: string }>
  tracksData: PlaylistedTrack<Track>[] // Raw Spotify API track items
}

export interface AudiusPlaylistData {
  audiusId: string
  name: string
  description: string
  isPrivate: boolean
  artworkUrl: string | null
  tracksData: AudiusTrack[]
}

// Direct conversion from Spotify API track to SongDTO
const convertSpotifyTrackToSongDTO = (spotifyTrack: any, position: number): SongDTO | null => {
  try {
    if (!spotifyTrack || !spotifyTrack.name) {
      console.warn(`Skipping track at position ${position}: Missing name`)
      return null
    }

    const currentDate = new Date().toISOString().split("T")[0]
    const title = spotifyTrack.name.trim().substring(0, 200)

    // Convert artists array from [{name: "Artist"}] to ["Artist"]
    const artists =
      spotifyTrack.artists && Array.isArray(spotifyTrack.artists)
        ? spotifyTrack.artists.map((artist: any) => artist.name).filter((name: string) => name && name.trim())
        : ["Unknown Artist"]

    const album = spotifyTrack.album?.name || "Unknown Album"
    const playtime = Math.round((spotifyTrack.duration_ms || 0) / 1000)

    // Format release date
    let releaseDate: string | null = null
    if (spotifyTrack.album?.release_date) {
      const dateStr = spotifyTrack.album.release_date.trim()
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
    if (spotifyTrack.external_urls?.spotify) {
      linksForWebPlayer.push(spotifyTrack.external_urls.spotify)
    }
    if (spotifyTrack.preview_url) {
      linksForWebPlayer.push(spotifyTrack.preview_url)
    }

    const coverUrl = spotifyTrack.album?.images?.[0]?.url || null

    const songDTO: SongDTO = {
      songId: -1,
      title: title,
      artists: artists,
      album: album,
      genres: [],
      playtime: playtime,
      releaseDate: releaseDate,
      linksForWebPlayer: linksForWebPlayer,
      coverUrl: coverUrl,
      positionInPlaylist: position,
      addDate: currentDate,
    }

    console.log(`✅ Converted track: "${title}" by ${artists.join(", ")} (${playtime}s)`)
    return songDTO
  } catch (error) {
    console.error(`❌ Error converting track at position ${position}:`, error)
    return null
  }
}

// Convert Spotify playlist data to PlaylistDTO
const convertSpotifyPlaylistToDTO = (playlistData: SpotifyPlaylistData): PlaylistDTO => {
  console.log(`🔄 Converting playlist: "${playlistData.name}"`)
  console.log(`📊 Raw tracks data length: ${playlistData.tracksData.length}`)

  const playlistName = playlistData.name.trim().substring(0, 100) || "Imported Playlist"
  const description = playlistData.description.trim().substring(0, 250)

  // Convert tracks directly to SongDTO
  const songs: SongDTO[] = []

  for (let i = 0; i < playlistData.tracksData.length; i++) {
    const trackItem = playlistData.tracksData[i]

    // Skip invalid items
    if (!trackItem?.track) {
      console.warn(`Skipping item ${i + 1}: Not a valid track`)
      continue
    }

    const songDTO = convertSpotifyTrackToSongDTO(trackItem.track, songs.length + 1)
    if (songDTO) {
      songs.push(songDTO)
    }
  }

  const totalPlaytime = songs.reduce((sum, song) => sum + song.playtime, 0)

  const playlistDTO: PlaylistDTO = {
    playlistId: -1,
    playlistName: playlistName,
    description: description,
    visibility: playlistData.isPublic ? "PUBLIC" : "PRIVATE",
    sorting: "CUSTOM",
    songs: songs,
    numberOfSongs: songs.length,
    playtime: totalPlaytime,
    coverUrl: playlistData.images?.[0]?.url || null,
  }

  console.log(`📦 Final playlist: "${playlistDTO.playlistName}" with ${playlistDTO.numberOfSongs} songs`)
  return playlistDTO
}

// Main Spotify import function
export const importSpotifyPlaylists = async (playlistsData: SpotifyPlaylistData[]): Promise<Playlist[]> => {
  try {
    console.log("🚀 Starting Spotify import for", playlistsData.length, "playlists")

    if (!Array.isArray(playlistsData) || playlistsData.length === 0) {
      throw new Error("No playlists provided for import")
    }

    // Convert to PlaylistDTO format
    const playlistDTOs = playlistsData.map(convertSpotifyPlaylistToDTO)

    console.log(
      "📊 Conversion results:",
      playlistDTOs.map((p) => ({
        name: p.playlistName,
        songs: p.numberOfSongs,
        playtime: `${Math.floor(p.playtime / 60)}:${(p.playtime % 60).toString().padStart(2, "0")}`,
      })),
    )

    // Validate playlists
    const invalidPlaylists = playlistDTOs.filter((p) => !p.playlistName || p.playlistName.trim().length === 0)
    if (invalidPlaylists.length > 0) {
      throw new Error("Some playlists have invalid or missing names")
    }

    const headers = await getHeaders()
    const importedPlaylists: Playlist[] = []
    const errors: string[] = []

    // Import each playlist to backend
    for (const playlistDTO of playlistDTOs) {
      try {
        console.log(`📤 Importing: "${playlistDTO.playlistName}" (${playlistDTO.numberOfSongs} songs)`)

        const response = await fetch(API_URL, {
          method: "POST",
          headers: headers,
          body: JSON.stringify(playlistDTO),
        })

        const data = await handleFetchResponse(response)

        if (data) {
          const importedPlaylist = mapPlaylistDTOToPlaylist(data)
          importedPlaylists.push(importedPlaylist)
          console.log(`✅ Successfully imported: "${playlistDTO.playlistName}"`)
        }
      } catch (error) {
        console.error(`❌ Failed to import "${playlistDTO.playlistName}":`, error)
        const errorMessage = error instanceof Error ? error.message : "Unknown error"
        errors.push(`Failed to import "${playlistDTO.playlistName}": ${errorMessage}`)
      }
    }

    if (importedPlaylists.length === 0) {
      throw new Error(`Failed to import any playlists. Errors: ${errors.join(", ")}`)
    }

    console.log(`🎉 Successfully imported ${importedPlaylists.length} out of ${playlistsData.length} playlists`)
    return importedPlaylists
  } catch (error) {
    console.error("❌ Error importing Spotify playlists:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    throw new Error(`Failed to import playlists: ${errorMessage}`)
  }
}

// Check if playlist exists by name
export const checkPlaylistExists = async (playlistName: string): Promise<boolean> => {
  try {
    const playlists = await getPlaylists()
    return playlists.some((playlist) => playlist.playlistName.toLowerCase() === playlistName.toLowerCase())
  } catch (error) {
    console.error("Error checking if playlist exists:", error)
    return false
  }
}

const convertAudiusTrackToSongDTO = (track: AudiusTrack, position: number): SongDTO => {
  const currentDate = new Date().toISOString().split("T")[0]

  /* title / artists ------------------------------------------------------- */
  const title   = (track.title || "Unknown Track").trim().substring(0, 200)
  const artists = [track.user?.name || track.user?.handle || "Unknown"]

  /* album: Audius has none – we fall back to mood/genre ------------------- */
  const album = (track.mood || track.genre || "Audius").substring(0, 200)

  /* release date ---------------------------------------------------------- */
  let releaseDate: string | null = null
  if (track.releaseDate) releaseDate = track.releaseDate.substring(0, 10)

  /* links ----------------------------------------------------------------- */
  const linksForWebPlayer: string[] = []
  if (track.permalink) linksForWebPlayer.push(`https://audius.co${track.permalink}`)
  if (track.streamUrl) linksForWebPlayer.push(track.streamUrl)

  /* cover ----------------------------------------------------------------- */
  const coverUrl =
      track.artwork?.["480x480"] ||
      track.artwork?.["150x150"] ||
      null

  return {
    songId: -1,
    title,
    artists,
    album,
    genres: track.genre ? [track.genre] : [],
    playtime: track.duration, // Audius duration already in seconds
    releaseDate,
    linksForWebPlayer,
    coverUrl,
    positionInPlaylist: position,
    addDate: currentDate,
  }
}


const convertAudiusPlaylistToDTO = (pl: AudiusPlaylistData): PlaylistDTO => {
  const songs: SongDTO[] = pl.tracksData.map(convertAudiusTrackToSongDTO)

  return {
    playlistId: -1,
    playlistName: sanitizePlaylistName(pl.name),
    description : sanitizeDescription(pl.description),
    visibility  : pl.isPrivate ? "PRIVATE" : "PUBLIC",
    sorting     : "CUSTOM",
    songs,
    numberOfSongs: songs.length,
    playtime     : songs.reduce((s, t) => s + t.playtime, 0),
    coverUrl     : pl.artworkUrl,
  }
}

export const importAudiusPlaylists = async (pls: AudiusPlaylistData[]): Promise<Playlist[]> => {
  if (!pls.length) throw new Error("No playlists provided for import")

  const headers   = await getHeaders()
  const imported: Playlist[] = []
  const errors  : string[]   = []

  for (const raw of pls) {
    const dto = convertAudiusPlaylistToDTO(raw)

    try {
      const res  = await fetch(API_URL, {
        method : "POST",
        headers,
        body   : JSON.stringify(dto),
      })
      const json = await handleFetchResponse(res)
      imported.push(mapPlaylistDTOToPlaylist(json))
      console.log(`✅ Imported Audius playlist “${dto.playlistName}”`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      errors.push(`“${dto.playlistName}”: ${msg}`)
      console.error("Audius import failed:", err)
    }
  }

  if (!imported.length)
    throw new Error(`Failed to import playlists. ${errors.join(" | ")}`)

  return imported
}