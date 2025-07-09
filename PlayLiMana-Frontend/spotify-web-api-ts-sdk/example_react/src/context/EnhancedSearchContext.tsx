import type React from "react"
import type { ReactNode } from "react"
import { createContext, useContext, useState, type Dispatch, type SetStateAction, useEffect, useCallback } from "react"

import type { SearchResultDisplayItem } from "../components/types/search.ts"
import type { Artist, Track, SimplifiedAlbum } from "@spotify/web-api-ts-sdk"
import { useSpotifyContext } from "./SpotifyContext"
import { useAudiusContext } from "./AudiusContext"

type SearchSource = "spotify" | "audius" | "both"

interface EnhancedSearchContextState {
    searchTerm: string
    setSearchTerm: Dispatch<SetStateAction<string>>
    searchSource: SearchSource
    setSearchSource: Dispatch<SetStateAction<SearchSource>>
    currentResults: SearchResultDisplayItem[]
    isLoading: boolean
    error: string | null
    setError: Dispatch<SetStateAction<string | null>>
}

const EnhancedSearchContext = createContext<EnhancedSearchContextState | undefined>(undefined)

function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value)
        }, delay)
        return () => {
            clearTimeout(handler)
        }
    }, [value, delay])
    return debouncedValue
}

const DEBOUNCE_DELAY = 500

export const EnhancedSearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [searchTerm, setSearchTerm] = useState<string>("")
    const [searchSource, setSearchSource] = useState<SearchSource>("audius") // Default to Audius to avoid auto-auth
    const [cachedResults, setCachedResults] = useState<Map<string, SearchResultDisplayItem[]>>(new Map())
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)

    const { sdk: spotifySDK, isAuthenticated: isSpotifyAuthenticated } = useSpotifyContext()
    const { audiusService } = useAudiusContext()

    const performSearch = useCallback(
        async (term: string, source: SearchSource) => {
            const trimmedTerm = term.trim()
            if (!trimmedTerm) {
                setError(null)
                setIsLoading(false)
                return
            }

            const cacheKey = `${trimmedTerm}-${source}`
            if (cachedResults.has(cacheKey)) {
                console.log(`Cache hit for '${trimmedTerm}' with source '${source}'`)
                setError(null)
                setIsLoading(false)
                return
            }

            console.log(`Performing search for '${trimmedTerm}' with source '${source}'`)
            setIsLoading(true)
            setError(null)

            try {
                const combinedResults: SearchResultDisplayItem[] = []

                // Search Spotify only if authenticated OR if source is specifically Spotify
                if ((source === "spotify" || source === "both") && spotifySDK && isSpotifyAuthenticated) {
                    try {
                        const spotifyResponse = await spotifySDK.search(trimmedTerm, ["artist", "track", "album"], undefined, 10)

                        // Add Spotify results
                        spotifyResponse.artists?.items.forEach((artist: Artist) => {
                            combinedResults.push({
                                id: `spotify-artist-${artist.id}`,
                                title: artist.name,
                                type: "Artist",
                                imageUrl: artist.images?.[0]?.url,
                                externalUrl: artist.external_urls?.spotify,
                                uri: artist.uri,
                                source: "spotify",
                            })
                        })

                        spotifyResponse.tracks?.items.forEach((track: Track) => {
                            combinedResults.push({
                                id: `spotify-track-${track.id}`,
                                title: `${track.name} - ${track.artists.map((a) => a.name).join(", ")}`,
                                type: "Track",
                                imageUrl: track.album.images?.[0]?.url,
                                externalUrl: track.external_urls?.spotify,
                                previewUrl: track.preview_url || undefined,
                                uri: track.uri,
                                source: "spotify",
                            })
                        })

                        spotifyResponse.albums?.items.forEach((album: SimplifiedAlbum) => {
                            combinedResults.push({
                                id: `spotify-album-${album.id}`,
                                title: `${album.name} - ${album.artists.map((a) => a.name).join(", ")}`,
                                type: "Album",
                                imageUrl: album.images?.[0]?.url,
                                externalUrl: album.external_urls?.spotify,
                                uri: album.uri,
                                source: "spotify",
                            })
                        })
                    } catch (spotifyError) {
                        console.error("Spotify search failed:", spotifyError)
                    }
                }

                // Search Audius - always available for public content
                if ((source === "audius" || source === "both") && audiusService) {
                    try {
                        const audiusResults = await audiusService.searchAll(trimmedTerm, 10)

                        // Add Audius results
                        audiusResults.users.forEach((user) => {
                            const externalUrl = user.permalink
                                ? `https://audius.co${user.permalink}`
                                : `https://audius.co/${user.handle}`

                            combinedResults.push({
                                id: `audius-user-${user.id}`,
                                title: user.name || user.handle,
                                type: "Artist",
                                imageUrl: user.profilePicture?.["480x480"] || user.profilePicture?.["150x150"],
                                externalUrl: externalUrl,
                                source: "audius",
                            })
                        })

                        audiusResults.tracks.forEach((track) => {
                            const externalUrl = track.permalink
                                ? `https://audius.co${track.permalink}`
                                : `https://audius.co/${track.user.handle}/${track.title.toLowerCase().replace(/\s+/g, "-")}`

                            combinedResults.push({
                                id: `audius-track-${track.id}`,
                                title: `${track.title} - ${track.user.name}`,
                                type: "Track",
                                imageUrl: track.artwork?.["480x480"] || track.artwork?.["150x150"],
                                externalUrl: externalUrl,
                                previewUrl: track.streamUrl,
                                source: "audius",
                            })
                        })

                        audiusResults.playlists.forEach((playlist) => {
                            // Use the externalUrl from the mapped playlist which already handles permalink
                            combinedResults.push({
                                id: `audius-playlist-${playlist.id}`,
                                title: `${playlist.playlistName} - ${playlist.user.name}`,
                                type: "Album",
                                imageUrl: playlist.artwork?.["480x480"] || playlist.artwork?.["150x150"],
                                externalUrl: playlist.externalUrl, // This now uses the permalink properly
                                source: "audius",
                                audiusPlaylistId: playlist.id,
                            })
                        })
                    } catch (audiusError) {
                        console.error("Audius search failed:", audiusError)
                    }
                }

                // Cache results
                setCachedResults((prevCache) => new Map(prevCache).set(cacheKey, combinedResults))

                console.log(`Search completed: ${combinedResults.length} total results`)
            } catch (err: any) {
                console.error("Search failed:", err)
                setError(`Search failed: ${err.message || "Unknown error"}`)
            } finally {
                setIsLoading(false)
            }
        },
        [spotifySDK, audiusService, isSpotifyAuthenticated, setCachedResults],
    )

    const debouncedTerm = useDebounce(searchTerm, DEBOUNCE_DELAY).trim()

    useEffect(() => {
        if (debouncedTerm) {
            performSearch(debouncedTerm, searchSource)
        } else {
            setIsLoading(false)
            setError(null)
        }
    }, [debouncedTerm, searchSource, performSearch])

    const cacheKey = `${searchTerm.trim()}-${searchSource}`
    const currentResults = cachedResults.get(cacheKey) || []

    const value = {
        searchTerm,
        setSearchTerm,
        searchSource,
        setSearchSource,
        currentResults,
        isLoading,
        error,
        setError,
    }

    return <EnhancedSearchContext.Provider value={value}>{children}</EnhancedSearchContext.Provider>
}

export const useEnhancedSearch = (): EnhancedSearchContextState => {
    const context = useContext(EnhancedSearchContext)
    if (context === undefined) {
        throw new Error("useEnhancedSearch must be used within an EnhancedSearchProvider")
    }
    return context
}

// Add source property to SearchResultDisplayItem
declare module "../components/features/music/MainPageSpotify" {
    interface SearchResultDisplayItem {
        source?: "spotify" | "audius"
    }
}
