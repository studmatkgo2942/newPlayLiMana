"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAudiusContext } from "../../context/AudiusContext"

const AudiusCallbackHandler: React.FC = () => {
    const navigate = useNavigate()
    const { audiusService, refreshUser } = useAudiusContext()
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
    const [message, setMessage] = useState("")

    useEffect(() => {
        const handleCallback = async () => {
            try {
                // Get the fragment from URL
                const fragment = window.location.hash.substring(1)
                const params = new URLSearchParams(fragment)

                const token = params.get("token")
                const state = params.get("state")
                const storedState = localStorage.getItem("audius_oauth_state")

                console.log("Audius callback - Token:", token, "State:", state, "Stored State:", storedState)

                if (!token) {
                    throw new Error("No token received from Audius")
                }

                if (state !== storedState) {
                    throw new Error("Invalid state parameter")
                }

                if (!audiusService) {
                    throw new Error("Audius service not available")
                }

                // Verify the token and get user profile
                const userProfile = await audiusService.verifyToken(token)

                if (!userProfile) {
                    throw new Error("Failed to verify token")
                }

                console.log("Audius authentication successful:", userProfile)

                // Refresh the context
                await refreshUser()

                setStatus("success")
                setMessage("Successfully connected to Audius!")

                // Clean up
                localStorage.removeItem("audius_oauth_state")

                // Redirect to profile page after a short delay
                setTimeout(() => {
                    navigate("/profile")
                }, 2000)
            } catch (error) {
                console.error("Audius callback error:", error)
                setStatus("error")
                setMessage(error instanceof Error ? error.message : "Authentication failed")

                // Redirect to profile page after error
                setTimeout(() => {
                    navigate("/profile")
                }, 3000)
            }
        }

        handleCallback()
    }, [audiusService, navigate, refreshUser])

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
                {status === "loading" && (
                    <>
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold mb-2">Connecting to Audius...</h2>
                        <p className="text-gray-600">Please wait while we complete the authentication.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="text-green-500 text-5xl mb-4">✓</div>
                        <h2 className="text-xl font-semibold mb-2 text-green-600">Success!</h2>
                        <p className="text-gray-600 mb-4">{message}</p>
                        <p className="text-sm text-gray-500">Redirecting to your profile...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="text-red-500 text-5xl mb-4">✗</div>
                        <h2 className="text-xl font-semibold mb-2 text-red-600">Authentication Failed</h2>
                        <p className="text-gray-600 mb-4">{message}</p>
                        <p className="text-sm text-gray-500">Redirecting back to profile...</p>
                    </>
                )}
            </div>
        </div>
    )
}

export default AudiusCallbackHandler
