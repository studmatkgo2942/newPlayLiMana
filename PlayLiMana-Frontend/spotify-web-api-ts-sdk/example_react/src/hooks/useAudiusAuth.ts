import { useState, useEffect } from "react"
import { AudiusService, type AudiusUser } from "../services/audius/AudiusService"

export interface AudiusAuthHookReturn {
    audiusService: AudiusService
    isAuthenticated: boolean
    user: AudiusUser | null
    isLoading: boolean
    error: string | null
    login: () => void
    logout: () => void
}

export function useAudiusAuth(apiKey: string): AudiusAuthHookReturn {
    const [audiusService] = useState(() => new AudiusService(apiKey))
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [user, setUser] = useState<AudiusUser | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Initialize authentication state
    useEffect(() => {
        const initAuth = async () => {
            setIsLoading(true)
            try {
                if (audiusService.isAuthenticated()) {
                    const currentUser = await audiusService.getCurrentUser()
                    if (currentUser) {
                        setUser(currentUser)
                        setIsAuthenticated(true)
                    } else {
                        audiusService.clearAccessToken()
                    }
                }
            } catch (err) {
                console.error("Auth initialization failed:", err)
                setError("Failed to initialize authentication")
                audiusService.clearAccessToken()
            } finally {
                setIsLoading(false)
            }
        }

        initAuth()
    }, [audiusService])

    // Handle OAuth callback
    useEffect(() => {
        const handleCallback = async () => {
            const urlParams = new URLSearchParams(window.location.search)
            const code = urlParams.get("code")
            const errorParam = urlParams.get("error")

            if (errorParam) {
                setError(`Authentication error: ${errorParam}`)
                setIsLoading(false)
                return
            }

            if (code && window.location.pathname === "/callback/audius") {
                setIsLoading(true)
                try {
                    const redirectUri = `${window.location.origin}/callback/audius`
                    const token = await audiusService.exchangeCodeForToken(code, redirectUri)

                    if (token) {
                        const userData = await audiusService.getCurrentUser()
                        if (userData) {
                            setUser(userData)
                            setIsAuthenticated(true)
                            setError(null)
                            // Clean up URL and redirect
                            window.history.replaceState({}, document.title, "/profile")
                        }
                    }
                } catch (err) {
                    console.error("OAuth callback failed:", err)
                    setError("Authentication failed")
                } finally {
                    setIsLoading(false)
                }
            }
        }

        handleCallback()
    }, [audiusService])

    const login = () => {
        const redirectUri = `${window.location.origin}/callback/audius`
        const authUrl = audiusService.getAuthUrl(redirectUri)
        window.location.href = authUrl
    }

    const logout = () => {
        audiusService.clearAccessToken()
        setIsAuthenticated(false)
        setUser(null)
        setError(null)
    }

    return {
        audiusService,
        isAuthenticated,
        user,
        isLoading,
        error,
        login,
        logout,
    }
}
