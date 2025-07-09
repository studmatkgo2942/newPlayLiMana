import type React from "react"
import { useAudiusContext } from "../../../context/AudiusContext"

interface AudiusAuthButtonProps {
    size?: "sm" | "md" | "lg"
    variant?: "primary" | "outline"
    className?: string
}

const AudiusAuthButton: React.FC<AudiusAuthButtonProps> = ({ size = "md", variant = "primary", className = "" }) => {
    const { isAuthenticated, login, logout, isLoading } = useAudiusContext()

    const sizeClasses = {
        sm: "px-3 py-1 text-sm",
        md: "px-4 py-2 text-base",
        lg: "px-6 py-3 text-lg",
    }

    const variantClasses = {
        primary: "bg-purple-600 text-white hover:bg-purple-700",
        outline: "border border-purple-600 text-purple-600 hover:bg-purple-50",
    }

    const handleClick = () => {
        if (isAuthenticated) {
            logout()
        } else {
            login()
        }
    }

    return (
        <button
            onClick={handleClick}
            disabled={isLoading}
            className={`
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        rounded font-medium transition-colors duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
        >
            {isLoading ? (
                <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    <span>Loading...</span>
                </div>
            ) : isAuthenticated ? (
                "Disconnect Audius"
            ) : (
                "Connect with Audius"
            )}
        </button>
    )
}

export default AudiusAuthButton
