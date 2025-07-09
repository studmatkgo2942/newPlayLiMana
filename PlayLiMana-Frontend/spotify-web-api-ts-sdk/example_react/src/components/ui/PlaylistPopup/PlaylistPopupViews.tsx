import type React from "react"
import type { RefObject } from "react"
import SpotifyIcon from "../../../assets/icons/services/Spotify.svg"
import SpotifyIconWhite from "../../../assets/icons/services/Spotify_white.svg"
import AudiusIcon from "../../../assets/icons/services/Audius.svg"
import AudiusIconWhite from "../../../assets/icons/services/Audius_white.svg"
import styles from "./playlist-popup.module.css"
import "./playlist-popup-import.css" // Import the new styles
import { PopupState } from "./PlaylistPopup"
import { ThemeProvider, useTheme } from "../../../context/ThemeContext"
import Spinner from "../Spinner/Spinner"

type SpotifyPlaylist = {
    id: string
    name: string
    description: string
    images: Array<{ url: string }>
    tracks: { total: number }
    public: boolean
    owner: { display_name: string }
}

type PlaylistPopupViewsProps = {
    popupPage: number
    errorMessage: string
    isLoading: boolean
    isNameEmpty: boolean
    hasInvalidCharsName: boolean
    hasInvalidCharsDescription: boolean
    playlistName: string
    playlistDescription: string
    visibility: string
    exportToPlayLiMana: boolean
    exportToSpotify: boolean
    exportToAudius: boolean
    spotifyPlaylists: SpotifyPlaylist[]
    selectedSpotifyPlaylists: string[]
    isLoadingSpotifyPlaylists: boolean
    spotifyPlaylistsError: string
    onNameInput: (e: React.ChangeEvent<HTMLInputElement>) => void
    onDescriptionInput: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
    onOkButtonClick: () => void
    closePopup: () => void
    onTryAgainClick: () => void
    goToNewPlaylistPage: () => void
    goToAddPlaylistPage: () => void
    goToChooseServicePage: () => void
    goToImportPlaylistPage: (service: "spotify" | "audius") => void
    onImportSelectedPlaylists: () => void
    onToggleSpotifyPlaylist: (playlistId: string) => void
    focusDescription: (event: React.KeyboardEvent<HTMLInputElement>) => void
    descriptionRef: RefObject<HTMLTextAreaElement>
    playlistNameRef: React.RefObject<HTMLInputElement>
    setVisibility: (val: string) => void
    setExportToPlayLiMana: (val: boolean) => void
    setExportToSpotify: (val: boolean) => void
    setExportToAudius: (val: boolean) => void
    service: "spotify" | "audius"
    setService: React.Dispatch<React.SetStateAction<"spotify" | "audius">>
}

const PlaylistPopupViews: React.FC<PlaylistPopupViewsProps> = ({
    popupPage,
    errorMessage,
    isLoading,
    isNameEmpty,
    hasInvalidCharsName,
    hasInvalidCharsDescription,
    playlistName,
    playlistDescription,
    visibility,
    exportToPlayLiMana,
    exportToSpotify,
    exportToAudius,
    spotifyPlaylists,
    selectedSpotifyPlaylists,
    isLoadingSpotifyPlaylists,
    spotifyPlaylistsError,
    onNameInput,
    onDescriptionInput,
    onOkButtonClick,
    closePopup,
    onTryAgainClick,
    goToNewPlaylistPage,
    goToAddPlaylistPage,
    goToChooseServicePage,
    goToImportPlaylistPage,
    onImportSelectedPlaylists,
    onToggleSpotifyPlaylist,
    focusDescription,
    descriptionRef,
    playlistNameRef,
    setVisibility,
    setExportToPlayLiMana,
    setExportToSpotify,
    service,
    setService,
}) => {
    const { theme } = useTheme();

    if (popupPage === PopupState.ERROR) {
        return (
            <div className={styles.popupOverlay}>
                <div className={styles.popup}>
                    <div className={styles.popupHeader}>
                        <h2 className={styles.errorTitle}>Error</h2>
                    </div>
                    <div className={styles.popupBody}>
                        <p className={styles.errorMessage}>{errorMessage}</p>
                    </div>
                    <div className={styles.popupFooter}>
                        <button className={styles.backButton} onClick={onTryAgainClick}>
                            Try Again
                        </button>
                        <button className={styles.okButton} onClick={closePopup}>
                            Close
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (popupPage === PopupState.ADD_PLAYLIST) {
        return (
            <div className={styles.popupOverlay}>
                <div className={styles.popup}>
                    <div className={styles.popupHeader}>
                        <h2>Add Playlist</h2>
                        <button className={styles.closeButton} onClick={closePopup}>
                            ×
                        </button>
                    </div>
                    <div className={styles.popupBody}>
                        <button className={styles.popupButton} onClick={goToChooseServicePage}>
                            Import Playlist from Service
                        </button>
                        <button className={styles.popupButton} onClick={goToNewPlaylistPage}>
                            Create new Playlist
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    const renderFormBody = () => (
        <div className={`${styles.popupBody}${isLoading ? " disabled" : ""}`}>
            <div className={styles.formGroup}>
                <label htmlFor="playlistName">
                    Playlist Name
                    {(isNameEmpty || hasInvalidCharsName) && (
                        <span className={styles.errorText}>{isNameEmpty ? "is required!" : "contains invalid characters!"}</span>
                    )}
                </label>
                <input
                    type="text"
                    id="playlistName"
                    maxLength={100}
                    placeholder="Enter a name for your playlist"
                    value={playlistName}
                    onChange={(e) => {
                        onNameInput(e)
                    }}
                    disabled={isLoading}
                    className={`${styles.input} ${isNameEmpty || hasInvalidCharsName ? styles.invalid : ""}`}
                    ref={playlistNameRef}
                    onKeyDown={focusDescription}
                    autoFocus
                />
            </div>

            <div className={`${styles.formGroup} scrollbar`}>
                <label htmlFor="playlistDescription">
                    Playlist Description
                    {hasInvalidCharsDescription && <span className={styles.errorText}>contains invalid characters!</span>}
                </label>
                <textarea
                    id="playlistDescription"
                    maxLength={250}
                    placeholder="Enter a description (optional)"
                    value={playlistDescription}
                    onChange={(e) => {
                        onDescriptionInput(e)
                    }}
                    className={`${styles.textarea} ${hasInvalidCharsDescription ? styles.invalid : ""}`}
                    disabled={isLoading}
                    ref={descriptionRef}
                />
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="visibility">Visibility</label>
                <select id="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)} disabled={isLoading}>
                    <option value="Public">Public</option>
                    <option value="Shared">Shared</option>
                    <option value="Private">Private</option>
                </select>
            </div>

            <div className={styles.formGroup}>
                <label htmlFor="export">Export to...</label>
                <div className={styles.checkboxGroup}>
                    <label>
                        <input
                            type="checkbox"
                            checked={exportToPlayLiMana}
                            onChange={(e) => setExportToPlayLiMana(e.target.checked)}
                            disabled={isLoading}
                        />
                        PlayLiMana
                    </label>
                    <label>
                        <input
                            type="checkbox"
                            checked={exportToSpotify}
                            onChange={(e) => setExportToSpotify(e.target.checked)}
                            disabled={isLoading}
                        />
                        <img src={SpotifyIcon || "/placeholder.svg"} alt="Spotify Icon" className={styles.icon} />
                        Spotify
                    </label>
                     <label>
                        <input
                            type="checkbox"
                            checked={exportToAudius}
                            onChange={(e) => setExportToSpotify(e.target.checked)}
                            disabled={isLoading}
                        />
                        <img src={theme === "dark" ? AudiusIconWhite : AudiusIcon || "/placeholder.svg"} alt="Audius Icon" className={styles.icon} />
                        Audius
                    </label>
                </div>
            </div>
        </div>
    )

    if (popupPage === PopupState.CREATE_PLAYLIST || popupPage === PopupState.EDIT_PLAYLIST) {
        const title = popupPage === 2 ? "New Playlist" : "Edit Playlist"
        const cancelButton =
            popupPage === 2 ? (
                <button className={styles.backButton} disabled={isLoading} onClick={goToAddPlaylistPage}>
                    Back
                </button>
            ) : (
                <button className={styles.backButton} disabled={isLoading} onClick={closePopup}>
                    Cancel
                </button>
            )

        return (
            <div className={styles.popupOverlay}>
                <div className={styles.popup}>
                    <div className={styles.popupHeader}>
                        <h2>{title}</h2>
                        <button className={styles.closeButton} onClick={closePopup}>
                            ×
                        </button>
                    </div>
                    {renderFormBody()}
                    <div className={styles.popupFooter}>
                        {cancelButton}
                        <button className={styles.okButton} disabled={isLoading} onClick={onOkButtonClick}>
                            {!isLoading ? "OK" : <Spinner />}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (popupPage === PopupState.CHOOSE_SERVICE) {
        return (
            <div className={styles.popupOverlay}>
                <div className={styles.popup}>
                    <div className={styles.popupHeader}>
                        <h2>Choose a Service</h2>
                        <button className={styles.closeButton} onClick={closePopup}>
                            ×
                        </button>
                    </div>
                    <div className={styles.popupBody}>
                        <button
                            className={styles.popupButton}
                            onClick={() => goToImportPlaylistPage("spotify")}
                        >
                            <img src={SpotifyIconWhite || "/placeholder.svg"} alt="Spotify Icon" className={styles.icon} />
                            Spotify
                        </button>
                        <button
                            className={styles.popupButton}
                            onClick={() => goToImportPlaylistPage("audius")}
                        >
                            <img src={AudiusIconWhite || "/placeholder.svg"} alt="Audius Icon" className={styles.icon} />
                            Audius
                        </button>
                    </div>
                    <div className={styles.popupFooter}>
                        <button className={styles.backButton} onClick={goToAddPlaylistPage}>
                            Back
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (popupPage === PopupState.IMPORT_PLAYLIST) {
        return (
            <div className={styles.popupOverlay}>
                <div className={`${styles.popup}`} data-page="4">
                    <div className={styles.popupHeader}>
                        <h2>Import {service === "spotify" ? "Spotify" : "Audius"} Playlists</h2>
                        <button className={styles.closeButton} onClick={closePopup}>
                            ×
                        </button>
                    </div>
                    <div className={styles.popupBody}>
                        {isLoadingSpotifyPlaylists && (
                            <div className="loadingContainer">
                                <div className={`${styles.loaderInner} ${styles.ballClipRotate}`} />
                                <p>Loading your Spotify playlists...</p>
                            </div>
                        )}

                        {spotifyPlaylistsError && (
                            <div className="errorMessage">
                                <p>Error loading playlists: {spotifyPlaylistsError}</p>
                                <button className="retryButton" onClick={goToImportPlaylistPage}>
                                    Try Again
                                </button>
                            </div>
                        )}

                        {!isLoadingSpotifyPlaylists && !spotifyPlaylistsError && spotifyPlaylists.length === 0 && (
                            <div className="noPlaylists">
                                <p>No playlists found in your Spotify account.</p>
                            </div>
                        )}

                        {!isLoadingSpotifyPlaylists && !spotifyPlaylistsError && spotifyPlaylists.length > 0 && (
                            <div className="playlistsList">
                                <p className="instructionText">Select the playlists you want to import to PlayLiMana:</p>
                                <div className="playlistsContainer">
                                    {spotifyPlaylists.map((playlist) => (
                                        <div
                                            key={playlist.id}
                                            className={`playlistItem ${selectedSpotifyPlaylists.includes(playlist.id) ? "selected" : ""}`}
                                            onClick={() => onToggleSpotifyPlaylist(playlist.id)}
                                            tabIndex={0}
                                            role="button"
                                            aria-pressed={selectedSpotifyPlaylists.includes(playlist.id)}
                                        >
                                            <div className="playlistCheckbox">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedSpotifyPlaylists.includes(playlist.id)}
                                                    onChange={() => onToggleSpotifyPlaylist(playlist.id)}
                                                    tabIndex={-1}
                                                />
                                            </div>
                                            <div className="playlistImage">
                                                {playlist.images && playlist.images.length > 0 ? (
                                                    <img src={playlist.images[0].url || "/placeholder.svg"} alt={playlist.name} />
                                                ) : (
                                                    <div className="playlistImagePlaceholder">♪</div>
                                                )}
                                            </div>
                                            <div className="playlistInfo">
                                                <h4 className="playlistName">{playlist.name}</h4>
                                                <p className="playlistDetails">
                                                    {playlist.tracks.total} songs • by {playlist.owner.display_name}
                                                </p>
                                                {playlist.description && <p className="playlistDescription">{playlist.description}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <div className={styles.popupFooter}>
                        <div className="selectionCounter">
                            {selectedSpotifyPlaylists.length > 0 && (
                                <span>
                                    {selectedSpotifyPlaylists.length} of {spotifyPlaylists.length} selected
                                </span>
                            )}
                        </div>
                        <button className={styles.backButton} disabled={isLoading} onClick={goToChooseServicePage}>
                            Back
                        </button>
                        <button
                            className={styles.okButton}
                            disabled={isLoading || selectedSpotifyPlaylists.length === 0}
                            onClick={onImportSelectedPlaylists}
                        >
                            {!isLoading ? (
                                `Import ${selectedSpotifyPlaylists.length} Playlist${selectedSpotifyPlaylists.length !== 1 ? "s" : ""}`
                            ) : (
                                <div className={`${styles.loaderInner} ${styles.ballClipRotate}`} />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return null
}

export default PlaylistPopupViews
