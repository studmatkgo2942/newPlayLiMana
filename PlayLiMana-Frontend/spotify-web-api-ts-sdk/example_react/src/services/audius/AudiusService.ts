import { getAudiusTrackId } from "../../utils/audius.util.ts";


export interface AudiusUser {
    userId?: number
    email?: string
    name?: string
    handle: string
    verified?: boolean
    profilePicture?: {
        "150x150"?: string
        "480x480"?: string
        "1000x1000"?: string
    } | null
    apiKey?: string | null
    sub?: number
    iat?: string
    // Additional fields from public API
    id?: string
    bio?: string
    location?: string
    coverPhoto?: {
        "640x"?: string
        "2000x"?: string
    }
    followerCount?: number
    followeeCount?: number
    trackCount?: number
    playlistCount?: number
    albumCount?: number
    repostCount?: number
    isVerified?: boolean
    isDeactivated?: boolean
    createdAt?: string
    permalink?: string
}

export interface AudiusTrack {
    id: string
    title: string
    permalink?: string
    duration: number
    genre: string
    mood?: string
    releaseDate?: string
    tags?: string
    user: {
        id: string
        handle: string
        name?: string
    }
    artwork?: {
        "150x150"?: string
        "480x480"?: string
        "1000x1000"?: string
    }
    playCount: number
    favoriteCount: number
    repostCount: number
    commentCount?: number
    downloadable?: boolean
    streamable?: boolean
    hasCurrentUserReposted?: boolean
    hasCurrentUserSaved?: boolean
    streamUrl?: string
}

export interface AudiusPlaylist {
    id: string
    playlistName: string
    description?: string
    mood?: string
    tags?: string
    genre?: string
    artwork?: {
        "150x150"?: string
        "480x480"?: string
        "1000x1000"?: string
    }
    user: {
        id: string
        handle: string
        name?: string
    }
    trackCount: number
    totalPlayTime: number
    favoriteCount: number
    repostCount: number
    hasCurrentUserReposted?: boolean
    hasCurrentUserSaved?: boolean
    isAlbum: boolean
    isPrivate?: boolean
    createdAt?: string
    updatedAt?: string
    tracks?: AudiusTrack[]
    externalUrl?: string
    permalink?: string
}

export interface AudiusSearchResults {
    tracks: AudiusTrack[]
    playlists: AudiusPlaylist[]
    users: AudiusUser[]
}

export class AudiusService {
    private baseUrl = "https://discoveryprovider.audius.co"
    private audiusWebUrl = "https://audius.co"
    private apiKey = "PlayLiMana" // Use app name as API key for public requests
    private jwt: string | null = null
    private userProfile: AudiusUser | null = null
    private readonly appName = "PlayLiMana"
    private readonly clientId = import.meta.env.VITE_AUDIUS_CLIENT_ID
    private readonly clientSecret = import.meta.env.VITE_AUDIUS_CLIENT_SECRET
    private readonly redirectUri = import.meta.env.VITE_AUDIUS_REDIRECT_URI

    constructor() {
        // Initialize with any stored JWT
        this.jwt = localStorage.getItem("audius_jwt")
        const storedUser = localStorage.getItem("audius_user")
        if (storedUser) {
            try {
                this.userProfile = JSON.parse(storedUser)

                if ((this.userProfile as any).data) {
                    this.userProfile = this.mapUser((this.userProfile as any).data)
                }
            } catch (e) {
                console.error("Failed to parse stored user:", e)
                localStorage.removeItem("audius_user")
            }
        }
        console.log("AudiusService: Initializing with config:", {
            baseUrl: this.baseUrl,
            appName: this.appName,
            clientId: this.clientId ? "Set" : "Not set",
            clientSecret: this.clientSecret ? "Set" : "Not set",
            redirectUri: this.redirectUri,
        })
    }

    setJWT(jwt: string | null) {
        this.jwt = jwt
        if (jwt) {
            localStorage.setItem("audius_jwt", jwt)
        } else {
            localStorage.removeItem("audius_jwt")
            localStorage.removeItem("audius_user")
        }
    }

    setUserProfile(user: AudiusUser | null) {
        this.userProfile = user
        if (user) {
            localStorage.setItem("audius_user", JSON.stringify(user))
        } else {
            localStorage.removeItem("audius_user")
        }
    }

    clearAuth() {
        this.jwt = null
        this.userProfile = null
        localStorage.removeItem("audius_jwt")
        localStorage.removeItem("audius_user")
        localStorage.removeItem("audius_oauth_state")
    }

    async isAuthenticated(): Promise<boolean> {
        return !!this.jwt && !!this.userProfile
    }

    async getCurrentUser(): Promise<AudiusUser | null> {
        return this.userProfile
    }

    async login(scope = "read"): Promise<void> {
        const authUrl = this.getAuthUrl(scope as "read" | "write")
        console.log("Redirecting to Audius OAuth:", authUrl)
        window.location.href = authUrl
    }


    private buildStreamUrl(trackId: string, format: "mp3" | "hls" = "mp3"): string {
        return `${this.baseUrl}/v1/tracks/${trackId}/stream`
            + `?app_name=${encodeURIComponent(this.appName)}`
            + `&format=${format}`;          // <-- the bit that fixes browser playback
    }


    logout(): void {
        this.clearAuth()
    }

    // OAuth methods following Audius documentation
    getAuthUrl(scope: "read" | "write" = "read"): string {
        const state = Math.random().toString(36).substring(2, 15)
        localStorage.setItem("audius_oauth_state", state)

        const authUrl = new URL("https://audius.co/oauth/auth")
        authUrl.searchParams.append("scope", scope)
        authUrl.searchParams.append("app_name", this.appName)
        authUrl.searchParams.append("redirect_uri", `${window.location.origin}/callback/audius`)
        authUrl.searchParams.append("state", state)
        authUrl.searchParams.append("response_mode", "fragment")

        return authUrl.toString()
    }

    async exchangeCodeForToken(code: string, state: string): Promise<string> {
        const storedState = localStorage.getItem("audius_oauth_state")
        if (state !== storedState) {
            throw new Error("Invalid state parameter")
        }

        const response = await fetch("https://audius.co/oauth/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                client_id: this.clientId,
                client_secret: this.clientSecret,
                grant_type: "authorization_code",
                code,
                redirect_uri: this.redirectUri,
            }),
        })

        if (!response.ok) {
            throw new Error(`Token exchange failed: ${response.statusText}`)
        }

        const data = await response.json()
        const token = data.access_token

        // Store the token
        this.setJWT(token)
        localStorage.removeItem("audius_oauth_state")

        return token
    }

    async verifyToken(jwt: string): Promise<AudiusUser | null> {
        try {
            const response = await fetch(`${this.baseUrl}/v1/users/verify_token?token=${jwt}`)

            if (!response.ok) {
                throw new Error(`Token verification failed: ${response.status}`)
            }

            const userProfile = await response.json()


            // Store the JWT and user profile
            this.setJWT(jwt)
            this.setUserProfile(userProfile)

            return userProfile
        } catch (error) {
            console.error("Token verification failed:", error)
            return null
        }
    }

    // Simple request method based on the old working version
    private async makeRequest(endpoint: string, params: Record<string, string> = {}, requiresAuth = false): Promise<any> {
        try {
            const url = new URL(`${this.baseUrl}${endpoint}`)

            // Add app_name parameter (required by Audius API)
            url.searchParams.append("app_name", this.appName)

            // Add API key if available
            if (this.apiKey) {
                url.searchParams.append("api_key", this.apiKey)
            }

            // Add other parameters
            Object.entries(params).forEach(([key, value]) => {
                if (value) {
                    // Only add non-empty values
                    url.searchParams.append(key, value)
                }
            })

            const headers: Record<string, string> = {
                Accept: "application/json",
                "User-Agent": "PlayLiMana/1.0",
            }

            // Only add Authorization if required and token exists
            if (requiresAuth && this.jwt) {
                headers["Authorization"] = `Bearer ${this.jwt}`
            }

            console.log(`Making Audius API request to: ${url.toString()}`)

            const response = await fetch(url.toString(), {
                method: "GET",
                headers,
                mode: "cors",
                credentials: "omit",
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error(`Audius API error response: ${response.status} ${response.statusText}`, errorText)

                if (response.status === 401 && requiresAuth) {
                    throw new Error("Authentication required. Please connect your Audius account.")
                }
                throw new Error(`Audius API error: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            console.log(`Audius API response:`, data)
            return data
        } catch (error) {
            if (error instanceof TypeError && error.message.includes("fetch")) {
                console.error("Network error - check CORS or connectivity:", error)
                throw new Error("Network error: Unable to connect to Audius API")
            }
            throw error
        }
    }

    // PUBLIC API METHODS - Using the correct working endpoints
    async searchTracks(query: string, limit = 20): Promise<AudiusTrack[]> {
        try {
            console.log(`Searching Audius tracks for: "${query}"`)

            // Use the working endpoint: /v1/tracks/search with 'query' parameter
            const response = await this.makeRequest("/v1/tracks/search", {
                query: query,
                limit: limit.toString(),
            })

            if (!response?.data) {
                console.log("No tracks found in Audius search")
                return []
            }

            const tracks = response.data.map((track: any) => this.mapTrack(track))
            console.log(`Found ${tracks.length} tracks on Audius`)
            return tracks
        } catch (error) {
            console.error("Error searching Audius tracks:", error)
            return []
        }
    }

    async searchPlaylists(query: string, limit = 20): Promise<AudiusPlaylist[]> {
        try {
            console.log(`Searching Audius playlists for: "${query}"`)

            // Use the working endpoint: /v1/playlists/search with 'query' parameter
            const response = await this.makeRequest("/v1/playlists/search", {
                query: query,
                limit: limit.toString(),
            })

            if (!response?.data) {
                console.log("No playlists found in Audius search")
                return []
            }

            const playlists = response.data.map((playlist: any) => this.mapPlaylist(playlist))
            console.log(`Found ${playlists.length} playlists on Audius`)
            return playlists
        } catch (error) {
            console.error("Error searching Audius playlists:", error)
            return []
        }
    }

    async searchUsers(query: string, limit = 20): Promise<AudiusUser[]> {
        try {
            console.log(`Searching Audius users for: "${query}"`)

            // Use the working endpoint: /v1/users/search with 'query' parameter
            const response = await this.makeRequest("/v1/users/search", {
                query: query,
                limit: limit.toString(),
            })

            if (!response?.data) {
                console.log("No users found in Audius search")
                return []
            }

            const users = response.data.map((user: any) => this.mapUser(user))
            console.log(`Found ${users.length} users on Audius`)
            return users
        } catch (error) {
            console.error("Error searching Audius users:", error)
            return []
        }
    }

    async searchAll(query: string, limit = 10): Promise<AudiusSearchResults> {
        try {
            const [tracks, playlists, users] = await Promise.all([
                this.searchTracks(query, limit),
                this.searchPlaylists(query, limit),
                this.searchUsers(query, limit),
            ])

            return { tracks, playlists, users }
        } catch (error) {
            console.error("Error in Audius search all:", error)
            return { tracks: [], playlists: [], users: [] }
        }
    }

    async getTrendingTracks(limit = 20): Promise<AudiusTrack[]> {
        try {
            console.log("Getting trending tracks from Audius")

            const response = await this.makeRequest("/v1/tracks/trending", {
                limit: limit.toString(),
            })

            if (!response?.data) {
                console.log("No trending tracks found")
                return []
            }

            return response.data.map((track: any) => this.mapTrack(track))
        } catch (error) {
            console.error("Error getting trending tracks:", error)
            return []
        }
    }

    async getUserPublicPlaylists(userId: string): Promise<AudiusPlaylist[]> {
        try {
            console.log(`Getting public playlists for user: ${userId}`)

            const response = await this.makeRequest(`/v1/users/${userId}/playlists`)

            if (!response?.data) {
                console.log("No public playlists found for user")
                return []
            }

            return response.data.map((playlist: any) => this.mapPlaylist(playlist))
        } catch (error) {
            console.error("Error getting user public playlists:", error)
            return []
        }
    }

    // AUTHENTICATED API METHODS (Require user login)
    async getUserPlaylists(): Promise<AudiusPlaylist[]> {
        if (!this.userProfile) {
            throw new Error("Authentication required for this operation")
        }
        try {
            // Use the public API with the authenticated user's ID
            const currentUser = await this.getCurrentUser();   // <- await the promise
            const userId =
                currentUser?.userId?.toString() ||               // numeric userId
                currentUser?.id ||                               // string id
                currentUser?.sub;
            if (!userId) {
                throw new Error("User ID not available")
            }

            const response = await this.makeRequest(`/v1/users/${userId}/playlists`)

            if (!response?.data) {
                console.log("No playlists found for user")
                return []
            }

            return response.data.map((playlist: any) => this.mapPlaylist(playlist))
        } catch (error) {
            console.error("Error getting user playlists:", error)
            return []
        }
    }

    // Add this method after the getUserPlaylists method (around line 280):
    async getUserFavorites(): Promise<AudiusTrack[]> {
        if (!this.userProfile) {
            throw new Error("Authentication required for this operation")
        }
        try {
            // Use the public API with the authenticated user's ID
            const currentUser = await this.getCurrentUser();   // <- await the promise
            const userId =
                currentUser?.userId?.toString() ||               // numeric userId
                currentUser?.id ||                               // string id
                currentUser?.sub;
            if (!userId) {
                throw new Error("User ID not available")
            }

            const response = await this.makeRequest(`/v1/users/${userId}/favorites`)

            if (!response?.data) {
                console.log("No favorites found for user")
                return []
            }

            return response.data.map((track: any) => this.mapTrack(track))
        } catch (error) {
            console.error("Error getting user favorites:", error)
            return []
        }
    }

    async getUser(userId: string): Promise<AudiusUser | null> {
        try {
            const response = await this.makeRequest(`/v1/users/${userId}`)
            if (!response?.data) {
                return null
            }
            return this.mapUser(response.data)
        } catch (error) {
            console.error(`Failed to get user ${userId}:`, error)
            return null
        }
    }

    async getUserTracks(userId: string, limit = 50): Promise<AudiusTrack[]> {
        try {
            const response = await this.makeRequest(`/v1/users/${userId}/tracks`, {
                limit: limit.toString(),
            })

            if (!response?.data) {
                return []
            }

            return response.data.map((track: any) => this.mapTrack(track))
        } catch (error) {
            console.error(`Failed to get tracks for user ${userId}:`, error)
            return []
        }
    }

    async getPlaylist(playlistId: string): Promise<AudiusPlaylist | null> {
        try {
            const response = await this.makeRequest(`/v1/playlists/${playlistId}`);

            // The API returns { data: [ ... ] } – extract first element
            const raw = Array.isArray(response?.data) ? response.data[0] : response?.data;
            if (!raw) return null;

            return this.mapPlaylist(raw);
        } catch (error) {
            console.error(`Failed to get playlist ${playlistId}:`, error);
            return null;
        }
    }

    async getPlaylistTracks(playlistId: string): Promise<AudiusTrack[]> {
        try {
            const response = await this.makeRequest(`/v1/playlists/${playlistId}/tracks`)

            if (!response?.data) {
                return []
            }

            return response.data.map((track: any) => this.mapTrack(track))
        } catch (error) {
            console.error(`Failed to get tracks for playlist ${playlistId}:`, error)
            return []
        }
    }

    async getTrackStreamUrl(trackId: string): Promise<string | null> {
        return this.buildStreamUrl(trackId, "mp3");
    }

    public getStreamUrlFromPermalink(link?: string | null): string | null {
        const id = getAudiusTrackId(link);
        /* ask discovery-provider to give us an MP3 instead of the default HLS */
        return id
            ? `${this.baseUrl}/v1/tracks/${id}/stream
        ?app_name=${encodeURIComponent(this.appName)}
        &api_key=${this.apiKey}
        &format=mp3`.replace(/\s+/g, "")   // strip the newline spaces
            : null;
    }

    // UTILITY METHODS
    getStreamUrl(trackId: string): string {
        return this.buildStreamUrl(trackId, "mp3");
    }

    // Add this method to test basic connectivity
    async testConnection(): Promise<boolean> {
        try {
            console.log("Testing Audius API connection...")

            // Try the simplest possible request - get trending tracks
            const response = await this.makeRequest("/v1/tracks/trending", {
                limit: "1",
            })

            console.log("Audius API connection test successful:", !!response?.data)
            return !!response?.data
        } catch (error) {
            console.error("Audius API connection test failed:", error)
            return false
        }
    }

    // MAPPING METHODS
    private mapTrack(track: any): AudiusTrack {
        return {
            id: track.id || track.track_id,
            title: track.title,
            user: {
                id: track.user?.id || track.user_id,
                handle: track.user?.handle || track.user_handle,
                name: track.user?.name || track.user_name,
            },
            duration: track.duration,
            genre: track.genre,
            mood: track.mood,
            releaseDate: track.release_date || track.created_at,
            playCount: track.play_count || 0,
            favoriteCount: track.favorite_count || 0,
            repostCount: track.repost_count || 0,
            artwork: track.artwork || track.cover_art,
            streamUrl: this.getStreamUrl(track.id || track.track_id),
            permalink: track.permalink,
        }
    }

    private mapPlaylist(playlist: any): AudiusPlaylist {
        // Use permalink if available, otherwise construct URL
        const externalUrl = playlist.permalink
            ? `${this.audiusWebUrl}${playlist.permalink}`
            : `${this.audiusWebUrl}/${playlist.user?.handle || playlist.user_handle}/playlist/${(playlist.playlist_name || playlist.name).toLowerCase().replace(/\s+/g, "-")}-${playlist.id || playlist.playlist_id}`

        return {
            id: playlist.id || playlist.playlist_id,
            playlistName: playlist.playlist_name || playlist.name,
            description: playlist.description,
            user: {
                id: playlist.user?.id || playlist.user_id,
                handle: playlist.user?.handle || playlist.user_handle,
                name: playlist.user?.name || playlist.user_name,
            },
            trackCount: playlist.track_count || 0,
            totalPlayTime: playlist.total_play_time || 0,
            isAlbum: playlist.is_album || false,
            isPrivate: playlist.is_private || false,
            artwork: playlist.artwork || playlist.cover_art,
            permalink: playlist.permalink,
            externalUrl: externalUrl,
            favoriteCount: playlist.favorite_count || 0,
            repostCount: playlist.repost_count || 0,
            hasCurrentUserReposted: playlist.has_current_user_reposted || false,
            hasCurrentUserSaved: playlist.has_current_user_saved || false,
            createdAt: playlist.created_at,
            updatedAt: playlist.updated_at,
        }
    }

    private mapUser(user: any): AudiusUser {
        return {
            id: user.id || user.user_id,
            handle: user.handle,
            name: user.name,
            bio: user.bio,
            location: user.location,
            followerCount: user.follower_count || 0,
            followeeCount: user.followee_count || 0,
            trackCount: user.track_count || 0,
            playlistCount: user.playlist_count || 0,
            isVerified: user.is_verified || false,
            profilePicture: user.profile_picture,
            permalink: user.permalink,
            userId: user.user_id,
            email: user.email,
            verified: user.verified || user.is_verified || false,
            apiKey: user.api_key,
            sub: user.sub,
            iat: user.iat,
            albumCount: user.album_count || 0,
            repostCount: user.repost_count || 0,
            isDeactivated: user.is_deactivated || false,
            createdAt: user.created_at,
        }
    }
}

export default AudiusService
