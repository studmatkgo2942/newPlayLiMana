import type React from "react"
import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { useSpotifyContext } from "../../../context/SpotifyContext"
import { useEnhancedSearch } from "../../../context/EnhancedSearchContext"
import { useAuth } from "../../../hooks/UseAuth"
import { useSpotifyAuthPrompt } from "../../../hooks/UseSpotifyAuthPrompt"
import { SpotifyAuthModal } from "../modals/SpotifyAuthModal"
import { useTheme } from "../../../context/ThemeContext"
import "../NavBar/NavBar.css"

interface AuthStatusSectionProps {
    isFirebaseAuthenticated: boolean
    isSpotifyAuthenticated: boolean
    loadingProfile: boolean
    userProfile: any
    displayName?: string
    profileImageUrl?: string
    initials: string
    onLoginClick: () => void
    onLogout: () => void
}

const RenderAuthStatusSection: React.FC<AuthStatusSectionProps> = ({
                                                                       isFirebaseAuthenticated,
                                                                       loadingProfile,
                                                                       userProfile,
                                                                       displayName,
                                                                       profileImageUrl,
                                                                       initials,
                                                                       onLoginClick,
                                                                       onLogout,
                                                                   }) => {
    if (!isFirebaseAuthenticated) {
        return (
            <button className="navbar-login-button" onClick={onLoginClick}>
                Login / Register
            </button>
        )
    }

    if (loadingProfile) {
        return <div className="profile-loading">Loading...</div>
    }

    if (userProfile || isFirebaseAuthenticated) {
        return (
            <div className="profile-section-container">
                <Link to="/profile" className="profile-section" title={`View profile for ${displayName}`}>
                    <span className="profile-name">{displayName ?? "User"}</span>
                    {profileImageUrl ? (
                        <img src={profileImageUrl || "/placeholder.svg"} alt="Profile" className="profile-image" />
                    ) : (
                        <div className="profile-initials">{initials}</div>
                    )}
                </Link>

                <button className="logout-button" onClick={onLogout} title="Logout">
                    Logout
                </button>
            </div>
        )
    }

    return (
        <div className="profile-section-anon" title="Profile error">
            !
        </div>
    )
}

const SearchSourceDropdown: React.FC = () => {
    const { searchSource, setSearchSource } = useEnhancedSearch()
    const [isOpen, setIsOpen] = useState(false)

    const getSourceLabel = (source: string) => {
        switch (source) {
            case "spotify":
                return "Spotify"
            case "audius":
                return "Audius"
            case "both":
                return "Both"
            default:
                return "Select"
        }
    }

    const getSourceIcon = (source: string) => {
        switch (source) {
            case "spotify":
                return (
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                        alt="Spotify"
                        className="dropdown-source-icon"
                    />
                )
            case "audius":
                return <div className="audius-dropdown-icon"></div>
            case "both":
                return <span className="both-icon">⚡</span>
            default:
                return null
        }
    }

    return (
        <div className="search-source-dropdown">
            <button
                type="button"
                className="search-source-dropdown-trigger"
                onClick={() => setIsOpen(!isOpen)}
                title="Select search source"
            >
                {getSourceIcon(searchSource)}
                <span className="dropdown-arrow">▼</span>
            </button>

            {isOpen && (
                <div className="search-source-dropdown-menu">
                    <button
                        type="button"
                        className={`dropdown-option ${searchSource === "spotify" ? "active" : ""}`}
                        onClick={() => {
                            setSearchSource("spotify")
                            setIsOpen(false)
                        }}
                    >
                        <img
                            src="https://upload.wikimedia.org/wikipedia/commons/8/84/Spotify_icon.svg"
                            alt="Spotify"
                            className="dropdown-source-icon"
                        />
                        Spotify
                    </button>
                    <button
                        type="button"
                        className={`dropdown-option ${searchSource === "audius" ? "active" : ""}`}
                        onClick={() => {
                            setSearchSource("audius")
                            setIsOpen(false)
                        }}
                    >
                        <div className="audius-dropdown-icon"></div>
                        Audius
                    </button>
                    <button
                        type="button"
                        className={`dropdown-option ${searchSource === "both" ? "active" : ""}`}
                        onClick={() => {
                            setSearchSource("both")
                            setIsOpen(false)
                        }}
                    >
                        <span className="both-icon">⚡</span>
                        Both
                    </button>
                </div>
            )}
        </div>
    )
}

const EnhancedNavBar: React.FC = () => {
    const { sdk, isAuthenticated: isSpotifyAuthenticated } = useSpotifyContext()
    const { user: firebaseUser, logout: firebaseLogout } = useAuth()
    const [userProfile, setUserProfile] = useState<any>(null)
    const [loadingProfile, setLoadingProfile] = useState<boolean>(false)
    const [localSearchTerm, setLocalSearchTerm] = useState<string>("")

    const navigate = useNavigate()
    const { searchTerm, setSearchTerm, searchSource } = useEnhancedSearch()
    const { isModalOpen, currentFeature, handleConfirmAuth, handleCloseModal } =
        useSpotifyAuthPrompt()

    // Use Firebase auth state for main authentication
    const isFirebaseAuthenticated = !!firebaseUser

    const handleLoginClick = () => {
        navigate("/auth")
    }

    const handleLogout = async () => {
        try {
            await firebaseLogout()
            navigate("/")
        } catch (error) {
            console.error("Logout failed:", error)
        }
    }

    // Modified search function - no automatic authentication prompts
    const handleSearchAction = (searchValue: string) => {
        if (!isFirebaseAuthenticated) {
            navigate("/auth")
            return
        }

        if (searchValue.trim()) {
            setSearchTerm(searchValue.trim())
            navigate(`/search/${encodeURIComponent(searchValue.trim())}`)
        }
    }

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        setLocalSearchTerm(value)
    }

    const handleSearchSubmit = (event: React.FormEvent) => {
        event.preventDefault()
        handleSearchAction(localSearchTerm)
    }

    const handleSearchKeyDown = (event: React.KeyboardEvent) => {
        if (event.key === "Enter") {
            handleSearchAction(localSearchTerm)
        }
    }

    // Load Spotify profile only if both auths are present
    useEffect(() => {
        const currentUser = sdk?.currentUser
        if (isFirebaseAuthenticated && isSpotifyAuthenticated && currentUser) {
            setLoadingProfile(true)
            currentUser
                .profile()
                .then((profile) => {
                    setUserProfile(profile)
                })
                .catch((err) => {
                    console.error("Profile fetch error:", err)
                    setUserProfile(null)
                })
                .finally(() => {
                    setLoadingProfile(false)
                })
        } else {
            setUserProfile(null)
        }
    }, [sdk, isFirebaseAuthenticated, isSpotifyAuthenticated, sdk?.currentUser])

    // Sync local search term with global search term
    useEffect(() => {
        setLocalSearchTerm(searchTerm)
    }, [searchTerm])

    const getSearchPlaceholder = () => {
        if (!isFirebaseAuthenticated) {
            return "Please log in to search"
        }

        switch (searchSource) {
            case "spotify":
                return "Search Spotify..."
            case "audius":
                return "Search Audius..."
            case "both":
                return "Search Spotify & Audius..."
            default:
                return "Search music..."
        }
    }

    const profileImageUrl = userProfile?.images?.[0]?.url
    const displayName = userProfile?.display_name || firebaseUser?.displayName
    const getInitials = (name?: string): string => {
        if (!name) return "?"
        return name
            .split(" ")
            .map((n) => n[0])
            .filter((_val, index, arr) => index === 0 || index === arr.length - 1)
            .join("")
            .toUpperCase()
    }
    const initials = getInitials(displayName)

    return (
        <>
            <nav className="navbar">
                {/* Left side */}
                <div className="navbar-left">
                    <Link to="/" className="navbar-brand">
                        PlayLiMana
                    </Link>
                    {isFirebaseAuthenticated && (
                        <div className="navbar-links">
                            <Link to="/library" className="navbar-link">
                                Library
                            </Link>
                        </div>
                    )}
                </div>

                {/* Center Section: Search Bar */}
                <div className="navbar-center">
                    <form onSubmit={handleSearchSubmit} className="search-form-with-dropdown">
                        <div className="search-input-container">
                            <input
                                type="search"
                                placeholder={getSearchPlaceholder()}
                                className="navbar-search-input"
                                value={localSearchTerm}
                                onChange={handleSearchChange}
                                onKeyDown={handleSearchKeyDown}
                                disabled={!isFirebaseAuthenticated}
                            />
                            <SearchSourceDropdown />
                        </div>
                    </form>
                </div>

                {/* Right side: User Profile OR Login Button */}
                <div className="navbar-right">
                    <RenderAuthStatusSection
                        isFirebaseAuthenticated={isFirebaseAuthenticated}
                        isSpotifyAuthenticated={isSpotifyAuthenticated}
                        loadingProfile={loadingProfile}
                        userProfile={userProfile}
                        displayName={displayName}
                        profileImageUrl={profileImageUrl}
                        initials={initials}
                        onLoginClick={handleLoginClick}
                        onLogout={handleLogout}
                    />
                    <ThemeToggleButton />
                </div>
            </nav>

            {/* Spotify Auth Modal */}
            <SpotifyAuthModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmAuth}
                feature={currentFeature}
            />
        </>
    )
}

const ThemeToggleButton: React.FC = () => {
    const { theme, toggleTheme } = useTheme()
    const className = "theme-toggle-button-" + theme
    return (
        <button onClick={toggleTheme} className={className} title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}>
            {theme === "dark" ? "🌞" : "🌙"}
        </button>
    )
}

export default EnhancedNavBar
