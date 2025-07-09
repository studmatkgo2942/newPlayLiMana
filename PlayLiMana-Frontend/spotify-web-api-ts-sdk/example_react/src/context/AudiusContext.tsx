import type React from "react"
import { createContext, useContext, useState, useEffect, useCallback } from "react"
import { AudiusService, type AudiusUser, type AudiusTrack, type AudiusPlaylist } from "../services/audius/AudiusService"

export interface AudiusSearchResult {
    tracks: AudiusTrack[]
    users: AudiusUser[]
    playlists: AudiusPlaylist[]
}

interface AudiusContextType {
    // Service instance
    audiusService: AudiusService | null
    // Authentication state
    isAuthenticated: boolean
    user: AudiusUser | null
    error: string | null
    isLoading: boolean
    // Authentication methods
    login: (scope?: "read" | "write") => void
    logout: () => void
    refreshUser: () => Promise<void>
    // Search methods (public API - no auth required)
    searchAll: (query: string, limit?: number) => Promise<AudiusSearchResult>
    searchTracks: (query: string, limit?: number) => Promise<AudiusTrack[]>
    searchUsers: (query: string, limit?: number) => Promise<AudiusUser[]>
    searchPlaylists: (query: string, limit?: number) => Promise<AudiusPlaylist[]>
    getTrendingTracks: (genre?: string, time?: string, limit?: number) => Promise<AudiusTrack[]>
    // User methods (require auth)
    getCurrentUser: () => Promise<AudiusUser | null>
    getUserPlaylists: () => Promise<AudiusPlaylist[]>
    getUserFavorites: () => Promise<AudiusTrack[]>
    // Public methods
    getUser: (userId: string) => Promise<AudiusUser | null>
    getUserTracks: (userId: string) => Promise<AudiusTrack[]>
    getPlaylist: (playlistId: string) => Promise<AudiusPlaylist | null>
    getPlaylistTracks: (playlistId: string) => Promise<AudiusTrack[]>
    getTrackStreamUrl: (trackId: string) => Promise<string | null>
}

const AudiusContext = createContext<AudiusContextType | undefined>(undefined)

// Provider component
interface AudiusProviderProps {
    children: React.ReactNode
}

export const AudiusProvider: React.FC<AudiusProviderProps> = ({ children }) => {
    const [audiusService] = useState(() => new AudiusService())
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [user, setUser] = useState<AudiusUser | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Refresh user data
    const refreshUser = useCallback(async () => {
        try {
            setIsLoading(true)
            setError(null)

            const isAuth = await audiusService.isAuthenticated()
            console.log("AudiusContext: Checking authentication:", isAuth)

            if (isAuth) {
                const userData = await audiusService.getCurrentUser()
                console.log("AudiusContext: Got user data:", userData)
                setUser(userData)
                setIsAuthenticated(true)
            } else {
                setUser(null)
                setIsAuthenticated(false)
            }
        } catch (err) {
            console.error("AudiusContext: Error refreshing user:", err)
            setError(err instanceof Error ? err.message : "Failed to refresh user data")
            setIsAuthenticated(false)
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }, [audiusService])

    // Initialize authentication state
    useEffect(() => {
        const initAuth = async () => {
            if (await audiusService.isAuthenticated()) {
                const userProfile = await audiusService.getCurrentUser()
                if (userProfile) {
                    setUser(userProfile)
                    setIsAuthenticated(true)
                } else {
                    audiusService.clearAuth()
                }
            }
        }

        initAuth()
    }, [audiusService])

    // Listen for authentication changes (e.g., from callback)
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === "audius_jwt") {
                console.log("AudiusContext: JWT changed, refreshing user")
                refreshUser()
            }
        }

        window.addEventListener("storage", handleStorageChange)
        return () => window.removeEventListener("storage", handleStorageChange)
    }, [refreshUser])

    // Authentication methods
    const login = useCallback(
        (scope: "read" | "write" = "read") => {
            const authUrl = audiusService.getAuthUrl(scope)
            console.log("Redirecting to Audius OAuth:", authUrl)
            window.location.href = authUrl
        },
        [audiusService],
    )

    const logout = useCallback(() => {
        audiusService.clearAuth()
        setIsAuthenticated(false)
        setUser(null)
        setError(null)
    }, [audiusService])

    // API methods with error handling - using the working search methods
    const searchAll = useCallback(
        async (query: string, limit = 10): Promise<AudiusSearchResult> => {
            try {
                setError(null)
                console.log(`AudiusContext: Searching all for "${query}"`)

                const results = await audiusService.searchAll(query, limit)

                // Convert AudiusSearchResults to AudiusSearchResult format
                return {
                    tracks: results.tracks,
                    users: results.users,
                    playlists: results.playlists,
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Search failed"
                console.error("AudiusContext: Search all failed:", errorMessage)
                setError(errorMessage)
                return { tracks: [], users: [], playlists: [] }
            }
        },
        [audiusService],
    )

    const searchTracks = useCallback(
        async (query: string, limit = 10): Promise<AudiusTrack[]> => {
            try {
                setError(null)
                return await audiusService.searchTracks(query, limit)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Track search failed"
                setError(errorMessage)
                return []
            }
        },
        [audiusService],
    )

    const searchUsers = useCallback(
        async (query: string, limit = 10): Promise<AudiusUser[]> => {
            try {
                setError(null)
                return await audiusService.searchUsers(query, limit)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "User search failed"
                setError(errorMessage)
                return []
            }
        },
        [audiusService],
    )

    const searchPlaylists = useCallback(
        async (query: string, limit = 10): Promise<AudiusPlaylist[]> => {
            try {
                setError(null)
                return await audiusService.searchPlaylists(query, limit)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Playlist search failed"
                setError(errorMessage)
                return []
            }
        },
        [audiusService],
    )

    const getTrendingTracks = useCallback(
        async (genre?: string, time?: string, limit = 10): Promise<AudiusTrack[]> => {
            try {
                setError(null)
                return await audiusService.getTrendingTracks(limit)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to get trending tracks"
                setError(errorMessage)
                return []
            }
        },
        [audiusService],
    )

    // Authenticated methods
    const getCurrentUser = useCallback(async (): Promise<AudiusUser | null> => {
        try {
            setError(null)
            return await audiusService.getCurrentUser()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to get current user"
            setError(errorMessage)
            return null
        }
    }, [audiusService])

    const getUserPlaylists = useCallback(async (): Promise<AudiusPlaylist[]> => {
        try {
            setError(null)
            return await audiusService.getUserPlaylists()
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to get user playlists"
            setError(errorMessage)
            return []
        }
    }, [audiusService])

    const getUserFavorites = useCallback(async (): Promise<AudiusTrack[]> => {
        try {
            setError(null)
            // For now, return empty array as favorites endpoint needs special handling
            return []
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to get user favorites"
            setError(errorMessage)
            return []
        }
    }, [audiusService])

    // Public methods
    const getUser = useCallback(
        async (userId: string): Promise<AudiusUser | null> => {
            try {
                setError(null)
                return await audiusService.getUser(userId)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to get user"
                setError(errorMessage)
                return null
            }
        },
        [audiusService],
    )

    const getUserTracks = useCallback(
        async (userId: string): Promise<AudiusTrack[]> => {
            try {
                setError(null)
                return await audiusService.getUserTracks(userId)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to get user tracks"
                setError(errorMessage)
                return []
            }
        },
        [audiusService],
    )

    const getPlaylist = useCallback(
        async (playlistId: string): Promise<AudiusPlaylist | null> => {
            try {
                setError(null)
                return await audiusService.getPlaylist(playlistId)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to get playlist"
                setError(errorMessage)
                return null
            }
        },
        [audiusService],
    )

    const getPlaylistTracks = useCallback(
        async (playlistId: string): Promise<AudiusTrack[]> => {
            try {
                setError(null)
                return await audiusService.getPlaylistTracks(playlistId)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to get playlist tracks"
                setError(errorMessage)
                return []
            }
        },
        [audiusService],
    )

    const getTrackStreamUrl = useCallback(
        async (trackId: string): Promise<string | null> => {
            try {
                setError(null)
                return await audiusService.getTrackStreamUrl(trackId)
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Failed to get stream URL"
                setError(errorMessage)
                return null
            }
        },
        [audiusService],
    )

    const contextValue: AudiusContextType = {
        audiusService,
        isAuthenticated,
        user,
        error,
        isLoading,
        login,
        logout,
        refreshUser,
        searchAll,
        searchTracks,
        searchUsers,
        searchPlaylists,
        getTrendingTracks,
        getCurrentUser,
        getUserPlaylists,
        getUserFavorites,
        getUser,
        getUserTracks,
        getPlaylist,
        getPlaylistTracks,
        getTrackStreamUrl,
    }

    return <AudiusContext.Provider value={contextValue}>{children}</AudiusContext.Provider>
}

// Hook to use the context
export const useAudiusContext = (): AudiusContextType => {
    const context = useContext(AudiusContext)
    if (context === undefined) {
        throw new Error("useAudiusContext must be used within an AudiusProvider")
    }
    return context
}

export default AudiusContext
