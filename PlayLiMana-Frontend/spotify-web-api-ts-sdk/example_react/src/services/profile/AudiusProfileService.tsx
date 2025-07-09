import type React from "react"
import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/UseAuth"
import { useAudiusContext } from "../../context/AudiusContext"
import AudiusAuthButton from "../../components/features/auth/AudiusAuthButton"
import { FirebaseUserAccountService } from "../UserAccountService"

const AudiusIcon = () => (
    <svg fill="none" height="32" viewBox="0 0 1024 1024" width="32" xmlns="http://www.w3.org/2000/svg">
        <path
            d="m565.381 127.013c-17.861-31.0313-26.811-46.5471-38.476-51.7452-10.189-4.5484-21.814-4.5484-32.004-.0197-11.684 5.1982-20.634 20.6942-38.554 51.7059l-277.256 480.004c-17.901 31.012-26.87 46.508-25.533 59.228 1.161 11.105 6.964 21.186 15.992 27.763 10.327 7.522 28.228 7.541 64.008 7.561l99.573.059c13.238 0 19.867 0 25.788-1.91 5.252-1.693 10.071-4.489 14.182-8.171 4.623-4.175 7.947-9.904 14.576-21.384l101.854-176.344c.59-1.024 1.24-1.989 1.928-2.875 10.366-13.33 31.552-12.365 40.344 2.895l120.502 209.226c1.082 1.871 1.869 3.801 2.4 5.73 4.17 14.965-6.924 30.914-23.565 30.894l-199.578-.138c-13.238 0-19.867 0-25.788 1.91-5.252 1.693-10.071 4.489-14.182 8.171-4.623 4.175-7.947 9.904-14.576 21.384l-49.845 86.282c-17.901 31.011-26.87 46.507-25.533 59.227 1.161 11.105 6.964 21.187 15.992 27.763 10.327 7.522 28.228 7.541 64.008 7.561l550.048.355c35.781.019 53.661.039 64.008-7.483 9.026-6.556 14.856-16.638 16.016-27.723 1.33-12.72-7.6-28.236-25.458-59.267z"
            fill="#000"
        />
    </svg>
)

const AudiusProfileService: React.FC = () => {
    const { user: firebaseUser } = useAuth()
    const { isAuthenticated, user, logout, isLoading, error, refreshUser } = useAudiusContext()
    const [forceUpdate, setForceUpdate] = useState(0)
    const [isSavingToken, setIsSavingToken] = useState(false)
    const [tokenSaved, setTokenSaved] = useState(false)
    const [isRemoving, setIsRemoving] = useState(false)

    const userAccountService = new FirebaseUserAccountService()

    const saveAudiusToken = async () => {
        if (!firebaseUser || !user) {
            console.log("No Firebase user or Audius user found for token saving")
            return
        }

        // Access nested user data properly
        const userData = user.data || user
        const userId = userData.userId?.toString() || userData.id?.toString()

        if (!userId) {
            console.log("No user ID found for Audius user")
            return
        }

        const jwt = localStorage.getItem("audius_jwt")
        if (!jwt) {
            console.log("No Audius JWT found in localStorage")
            return
        }

        try {
            setIsSavingToken(true)
            console.log("Saving Audius token for user:", userId)

            await userAccountService.saveServiceToken("Audius", userId, jwt)

            console.log("Audius token saved successfully")
            setTokenSaved(true)
            setTimeout(() => setTokenSaved(false), 3000)
        } catch (error) {
            console.error("Error saving Audius token:", error)
        } finally {
            setIsSavingToken(false)
        }
    }

    const handleDisconnect = async () => {
        if (!window.confirm("Are you sure you want to disconnect your Audius account?")) {
            return
        }

        try {
            setIsRemoving(true)

            // Remove from backend first
            await userAccountService.removeServiceToken("Audius")
            console.log("Audius token removed from backend")

            // Then logout from Audius
            logout()
            setTokenSaved(false)

            console.log("Audius account disconnected successfully")
        } catch (error) {
            console.error("Error disconnecting Audius:", error)
            // Still logout from frontend even if backend removal fails
            logout()
            setTokenSaved(false)
        } finally {
            setIsRemoving(false)
        }
    }

    // Force re-render when authentication state changes and refresh user data
    useEffect(() => {
        console.log("AudiusProfileService: Auth state changed", { isAuthenticated, user })
        setForceUpdate((prev) => prev + 1)

        // If just authenticated and no user data, try to refresh
        if (isAuthenticated && !user && refreshUser) {
            console.log("AudiusProfileService: Refreshing user data after authentication")
            refreshUser()
        }

        // Save token when user becomes authenticated
        if (isAuthenticated && user && !tokenSaved && !isSavingToken) {
            console.log("AudiusProfileService: Attempting to save token")
            saveAudiusToken()
        }
    }, [isAuthenticated, user, refreshUser])

    if (isLoading) {
        return (
            <tr>
                <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="mr-3">
                            <AudiusIcon />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Audius</span>
                    </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500 mr-2"></div>
                        <span className="text-sm text-gray-500">Loading...</span>
                    </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">—</td>
                <td className="px-4 py-4 whitespace-nowrap">
                    <button disabled className="px-3 py-1 bg-gray-300 text-gray-500 rounded text-sm cursor-not-allowed">
                        Loading...
                    </button>
                </td>
            </tr>
        )
    }

    if (error) {
        return (
            <tr>
                <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="mr-3">
                            <AudiusIcon />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Audius</span>
                    </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-red-600">Connection Error</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">—</td>
                <td className="px-4 py-4 whitespace-nowrap">
                    <AudiusAuthButton />
                </td>
            </tr>
        )
    }

    if (!isAuthenticated) {
        return (
            <tr>
                <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                        <div className="mr-3">
                            <AudiusIcon />
                        </div>
                        <span className="text-sm font-medium text-gray-900">Audius</span>
                    </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-500">Not connected</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">—</td>
                <td className="px-4 py-4 whitespace-nowrap">
                    <AudiusAuthButton />
                </td>
            </tr>
        )
    }

    // Get user data properly
    const userData = user.data || user
    const userId = userData.userId?.toString() || userData.id?.toString()
    const userEmail = userData.email || ""

    return (
        <tr>
            <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="mr-3">
                        <AudiusIcon />
                    </div>
                    <span className="text-sm font-medium text-gray-900">Audius</span>
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                    {userId || "Unknown ID"}
                    {isSavingToken && <div className="text-xs text-blue-600 mt-1">Saving token...</div>}
                    {tokenSaved && <div className="text-xs text-green-600 mt-1">✓ Token saved</div>}
                    {isRemoving && <div className="text-xs text-orange-600 mt-1">Removing connection...</div>}
                </div>
            </td>
            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{userEmail || "—"}</td>
            <td className="px-4 py-4 whitespace-nowrap">
                <button
                    onClick={handleDisconnect}
                    disabled={isRemoving}
                    className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isRemoving ? "Disconnecting..." : "Disconnect"}
                </button>
            </td>
        </tr>
    )
}

export default AudiusProfileService
