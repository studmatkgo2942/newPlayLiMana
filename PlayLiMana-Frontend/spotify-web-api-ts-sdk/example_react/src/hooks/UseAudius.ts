import { useState, useEffect, useCallback } from "react"
import { AudiusService } from "../services/audius/AudiusService"
import type { AudiusUser } from "../services/audius/AudiusService"

export interface AudiusAuthHookReturn {
    audiusService: AudiusService | null
    isAuthenticated: boolean
    isLoading: boolean
    authError: Error | null
    user: AudiusUser | null
    login: (redirectUri?: string) => void
    logout: () => void
    handleAuthCallback: (code: string, redirectUri: string) => Promise<void>
    canAccessPrivateContent: boolean
}

export function useAudius(apiKey: string): AudiusAuthHookReturn {
    const [audiusService, setAudiusService] = useState<AudiusService | null>(null)
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false)
    const [isLoading, setIsLoading] = useState<boolean>(true)
    const [authError, setAuthError] = useState<Error | null>(null)
    const [user, setUser] = useState<AudiusUser | null>(null)

    // Initialize Audius Service
    useEffect(() => {
        const initializeAudius = async () => {
            try {
                console.log("Initializing Audius Service...")

                const service = new AudiusService(apiKey)
                setAudiusService(service)

                // Check if user is authenticated
                if (service.isAuthenticated()) {
                    try {
                        const currentUser = await service.getCurrentUser()
                        if (currentUser) {
                            setUser(currentUser)
                            setIsAuthenticated(true)
                            console.log("Restored authenticated Audius user:", currentUser.handle)
                        } else {
                            // Token might be invalid, clear it
                            service.clearAccessToken()
                        }
                    } catch (error) {
                        console.warn("Failed to get current user, clearing token")
                        service.clearAccessToken()
                    }
                }

                console.log("Audius Service initialized successfully")
            } catch (error) {
                console.error("Failed to initialize Audius Service:", error)
                setAuthError(error instanceof Error ? error : new Error("Failed to initialize Audius Service"))
            } finally {
                setIsLoading(false)
            }
        }

        if (apiKey) {
            initializeAudius()
        } else {
            setIsLoading(false)
            setAuthError(new Error("Audius API key not provided"))
        }
    }, [apiKey])

    const login = useCallback(
        (redirectUri?: string) => {
            if (!audiusService) {
                console.error("Audius Service not initialized")
                return
            }

            try {
                const uri = redirectUri || `${window.location.origin}/callback/audius`
                const authUrl = audiusService.getAuthUrl(uri)
                console.log("Redirecting to Audius OAuth:", authUrl)
                window.location.href = authUrl
            } catch (error) {
                console.error("Failed to initiate Audius login:", error)
                setAuthError(error instanceof Error ? error : new Error("Login failed"))
            }
        },
        [audiusService],
    )

    const handleAuthCallback = useCallback(
        async (code: string, redirectUri: string) => {
            if (!audiusService) {
                throw new Error("Audius Service not initialized")
            }

            try {
                setIsLoading(true)
                setAuthError(null)

                console.log("Processing Audius auth callback...")

                // Exchange code for access token
                await audiusService.exchangeCodeForToken(code, redirectUri)

                // Get user profile
                const currentUser = await audiusService.getCurrentUser()
                if (currentUser) {
                    setUser(currentUser)
                    setIsAuthenticated(true)
                    console.log("Audius authentication successful:", currentUser.handle)
                } else {
                    throw new Error("Failed to get user profile after authentication")
                }
            } catch (error) {
                console.error("Audius auth callback failed:", error)
                setAuthError(error instanceof Error ? error : new Error("Authentication failed"))
                audiusService.clearAccessToken()
            } finally {
                setIsLoading(false)
            }
        },
        [audiusService],
    )

    const logout = useCallback(() => {
        if (audiusService) {
            audiusService.clearAccessToken()
        }
        setUser(null)
        setIsAuthenticated(false)
        setAuthError(null)
        console.log("Logged out from Audius")
    }, [audiusService])

    const canAccessPrivateContent = isAuthenticated && !!user

    return {
        audiusService,
        isAuthenticated,
        isLoading,
        authError,
        user,
        login,
        logout,
        handleAuthCallback,
        canAccessPrivateContent,
    }
}