import type React from "react"
import {useState, useEffect, useCallback} from "react"
import {Link, useNavigate} from "react-router-dom"


import "./NavBar.css"
import {useSpotifyContext} from "../../../context/SpotifyContext.tsx";
import {useSearch} from "../../../context/SearchContext.tsx";
import {useAuth} from "../../../hooks/UseAuth.tsx";
import {useSpotifyAuthPrompt} from "../../../hooks/UseSpotifyAuthPrompt.tsx";
import {SpotifyAuthModal} from "../modals/SpotifyAuthModal.tsx";
import {useTheme} from "../../../context/ThemeContext.tsx";


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
                        <img src={profileImageUrl || "/placeholder.svg"} alt="Profile" className="profile-image"/>
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

const NavBar: React.FC = () => {
    const {sdk, isAuthenticated: isSpotifyAuthenticated} = useSpotifyContext()
    const {user: firebaseUser, logout: firebaseLogout} = useAuth()
    const [userProfile, setUserProfile] = useState<any>(null)
    const [loadingProfile, setLoadingProfile] = useState<boolean>(false)
    const [localSearchTerm, setLocalSearchTerm] = useState<string>("")

    const navigate = useNavigate()
    const {searchTerm, setSearchTerm} = useSearch()
    const {isModalOpen, currentFeature, promptForSpotifyAuth, handleConfirmAuth, handleCloseModal} =
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

    // Modified search function to check for Spotify auth
    const handleSearchAction = useCallback(
        (searchValue: string) => {
            if (!isFirebaseAuthenticated) {
                navigate("/auth")
                return
            }

            if (!isSpotifyAuthenticated) {
                promptForSpotifyAuth("music search")
                return
            }

            if (searchValue.trim()) {
                setSearchTerm(searchValue.trim())
                navigate(`/search/${encodeURIComponent(searchValue.trim())}`)
            }
        },
        [isFirebaseAuthenticated, isSpotifyAuthenticated, setSearchTerm, navigate, promptForSpotifyAuth],
    )

    // Debounce effect - only trigger if both auths are present
    useEffect(() => {
        if (localSearchTerm.trim() && isFirebaseAuthenticated && isSpotifyAuthenticated) {
            const timeoutId = setTimeout(() => {
                handleSearchAction(localSearchTerm)
            }, 500)

            return () => clearTimeout(timeoutId)
        }
    }, [localSearchTerm, isFirebaseAuthenticated, isSpotifyAuthenticated, handleSearchAction])

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

    const profileImageUrl = userProfile?.images?.[0]?.url
    const displayName = userProfile?.display_name ?? firebaseUser?.displayName
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
                    {(isFirebaseAuthenticated) && (
                        <div className="navbar-links">
                            <Link to="/library" className="navbar-link">
                                Library
                            </Link>
                            <Link to="/settings" className="navbar-link">
                                Settings
                            </Link>
                        </div>
                    )}

                </div>

                {/* Center Section: Search Bar */}
                <div className="navbar-center">
                    <form onSubmit={handleSearchSubmit} className="search-form">
                        <input
                            type="search"
                            placeholder={
                                !isFirebaseAuthenticated
                                    ? "Please log in to search"
                                    : !isSpotifyAuthenticated
                                        ? "Connect Spotify to search music"
                                        : "What do you want to listen to?"
                            }
                            className="navbar-search-input"
                            value={localSearchTerm}
                            onChange={handleSearchChange}
                            onKeyDown={handleSearchKeyDown}
                            disabled={!isFirebaseAuthenticated}
                            title={
                                !isFirebaseAuthenticated
                                    ? "Please log in to search"
                                    : !isSpotifyAuthenticated
                                        ? "Connect Spotify to search music"
                                        : "Search Spotify"
                            }
                        />
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
                    <ThemeToggleButton/>
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

export default NavBar


const ThemeToggleButton: React.FC = () => {
    const {theme, toggleTheme} = useTheme();
    let className = "theme-toggle-button-" + theme
    return (
        <button
            onClick={toggleTheme}
            className={className}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
            {theme === 'dark' ? '🌞' : '🌙'}
        </button>
    )
}
