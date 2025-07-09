import type React from "react"
import { useState, useRef, forwardRef, useImperativeHandle } from "react"
import PlaylistPopupViews from "./PlaylistPopupViews"
import type { Playlist } from "../../../models/playlist"
import { useSpotifyContext } from "../../../context/SpotifyContext"
import { SpotifyPlaylistData } from "../../../services/playlist/playlistApi";
import { usePlaylists } from "../../../hooks/usePlaylists.ts"
import { useAudiusContext } from "../../../context/AudiusContext"
import { AudiusPlaylistData } from "../../../services/playlist/playlistApi"

export const PopupState = {
    HIDDEN: -1,
    ERROR: 0,
    ADD_PLAYLIST: 1,
    CREATE_PLAYLIST: 2,
    EDIT_PLAYLIST: 3,
    CHOOSE_SERVICE: 4,
    IMPORT_PLAYLIST: 5,
}

const VALID_CHARACTERS_REGEX = /^[\p{L}\p{N} _\-.\u2000-\u206F\u2B50\u2600-\u26FF]*$/u;

type SpotifyPlaylist = {
    id: string
    name: string
    description: string
    images: Array<{ url: string }>
    tracks: { total: number }
    public: boolean
    owner: { display_name: string }
}

type PlaylistPopupProps = {
    onPlaylistCreated: (playlist: Playlist) => void
    onPlaylistEdited: (playlist: Playlist) => void
    onPlaylistsImported: (playlists: Playlist[]) => void
}

export interface PlaylistPopupRef {
    goToAddPlaylistPage: () => void;
    goToEditPlaylistPage: (playlist: Playlist) => void;
}

const PlaylistPopup = forwardRef<PlaylistPopupRef, PlaylistPopupProps>(
    (
        {
            onPlaylistCreated,
            onPlaylistEdited,
            onPlaylistsImported = (playlists) => {
                console.log("Playlists imported:", playlists)
            },
        },
        ref,
    ) => {
        const { sdk } = useSpotifyContext()

        const [popupPage, setPopupPage] = useState(PopupState.HIDDEN)
        const [playlistName, setPlaylistName] = useState("")
        const [playlistDescription, setPlaylistDescription] = useState("")
        const [visibility, setVisibility] = useState("Public")
        const [exportToPlayLiMana, setExportToPlayLiMana] = useState(true)
        const [exportToSpotify, setExportToSpotify] = useState(false)
        const [exportToAudius, setExportToAudius] = useState(false)
        const [isNameEmpty, setIsNameEmpty] = useState(false)
        const [hasInvalidCharsName, setHasInvalidCharsName] = useState(false)
        const [hasInvalidCharsDescription, setHasInvalidCharsDescription] = useState(false)
        const [isLoading, setIsLoading] = useState(false)
        const [errorMessage, setErrorMessage] = useState("")
        const [playlistToEdit, setPlaylistToEdit] = useState<Playlist | null>(null)
        const [service, setService] = useState<"spotify" | "audius">("spotify")

        const { create, edit, importFromSpotify, importFromAudius } = usePlaylists();

        // Spotify playlist import states
        const [spotifyPlaylists, setSpotifyPlaylists] = useState<SpotifyPlaylist[]>([])
        const [selectedSpotifyPlaylists, setSelectedSpotifyPlaylists] = useState<string[]>([])
        const [isLoadingSpotifyPlaylists, setIsLoadingSpotifyPlaylists] = useState(false)
        const [spotifyPlaylistsError, setSpotifyPlaylistsError] = useState("")

        const playlistNameRef = useRef<HTMLInputElement>(null)
        const descriptionRef = useRef<HTMLTextAreaElement>(null)
        const timeoutRef = useRef<NodeJS.Timeout | null>(null)

        useImperativeHandle(ref, () => ({
            goToAddPlaylistPage,
            goToEditPlaylistPage,
        }))

        const resetForm = () => {
            setPlaylistName("")
            setPlaylistDescription("")
            setVisibility("Public")
            setExportToPlayLiMana(true)
            setExportToSpotify(false)
            setExportToAudius(false)
            setIsNameEmpty(false)
            setHasInvalidCharsName(false)
            setHasInvalidCharsDescription(false)
            setIsLoading(false)
            setErrorMessage("")
            setPlaylistToEdit(null)
            setSpotifyPlaylists([])
            setSelectedSpotifyPlaylists([])
            setIsLoadingSpotifyPlaylists(false)
            setSpotifyPlaylistsError("")
            setService("spotify")
        }

        const focusDescription = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault()
                descriptionRef.current?.focus()
            }
        }

        const closePopup = () => setPopupPage(PopupState.HIDDEN)
        const goToAddPlaylistPage = () => setPopupPage(PopupState.ADD_PLAYLIST)
        const goToNewPlaylistPage = (reset = true) => {
            if (reset) resetForm()
            setPopupPage(PopupState.CREATE_PLAYLIST)
        }
        const goToEditPlaylistPage = (playlist: Playlist) => {
            setPlaylistToEdit(playlist)
            setPlaylistName(playlist.playlistName)
            setPlaylistDescription(playlist.description ?? "")
            setVisibility(playlist.visibility)
            setExportToPlayLiMana(true)
            setExportToSpotify(false)
            setExportToAudius(false)
            setIsNameEmpty(false)
            setHasInvalidCharsName(false)
            setHasInvalidCharsDescription(false)
            setPopupPage(PopupState.EDIT_PLAYLIST)
        }
        const goToChooseServicePage = () => setPopupPage(PopupState.CHOOSE_SERVICE)
        const goToImportPlaylistPage = async (selected: "spotify" | "audius") => {
            // remember the user’s choice (used later to decide which API branch to call)
            setService(selected);

            // show the import page immediately
            setPopupPage(PopupState.IMPORT_PLAYLIST);

            // reset per-page transient state
            setSpotifyPlaylistsError("");
            setSelectedSpotifyPlaylists([]);

            if (selected === "spotify") {
                /* ───────────────────────── Spotify branch ───────────────────────── */
                // If the user hasn’t connected Spotify yet, stop here with an inline error.
                if (!sdk) {
                    setSpotifyPlaylistsError("Please connect your Spotify account first.");
                    return;
                }

                // Otherwise fetch the playlists from the user’s Spotify account
                await fetchSpotifyPlaylists();
            } else {
                /* ────────────────────────── Audius branch ───────────────────────── */
                // Fetch the user’s Audius playlists (public API – no extra auth needed)
                await fetchAudiusPlaylistsForImport();
            }
        };
        const goToErrorPage = () => setPopupPage(PopupState.ERROR)

        const fetchSpotifyPlaylists = async () => {
            if (!sdk) {
                setSpotifyPlaylistsError("Spotify SDK not available")
                return
            }

            setIsLoadingSpotifyPlaylists(true)
            setSpotifyPlaylistsError("")

            try {
                console.log("Fetching Spotify playlists...")
                const playlistsResponse = await sdk.currentUser.playlists.playlists(50, 0)
                console.log("Spotify playlists response:", playlistsResponse)

                const playlists: SpotifyPlaylist[] = playlistsResponse.items.map((playlist) => ({
                    id: playlist.id,
                    name: playlist.name,
                    description: playlist.description || "",
                    images: playlist.images || [],
                    tracks: { total: playlist.tracks?.total ?? 0 },
                    public: playlist.public,
                    owner: { display_name: playlist.owner.display_name },
                }))

                setSpotifyPlaylists(playlists)
                console.log(`Loaded ${playlists.length} Spotify playlists`)
            } catch (error) {
                console.error("Error fetching Spotify playlists:", error)
                setSpotifyPlaylistsError("Failed to load playlists from Spotify")
            } finally {
                setIsLoadingSpotifyPlaylists(false)
            }
        }

        const { audiusService } = useAudiusContext()

        const ensureAudiusReady = async (): Promise<boolean> => {
            if (!audiusService) return false;               // no ctx

            // already there?
            if (audiusService.userProfile?.userId) return true;

            /* If the JWT exists but the profile is still null we call verifyToken –
               that forces Audius to hydrate userProfile.  One call is enough. */
            const jwt = localStorage.getItem("audius_jwt");
            if (jwt && audiusService.verifyToken) {
                try {
                    await audiusService.verifyToken(jwt);       // fills userProfile
                } catch { /* ignore – will fail below */ }
            }

            return !!audiusService.userProfile?.userId;
        };

        const fetchAudiusPlaylistsForImport = async () => {
            if (!audiusService) {
                setSpotifyPlaylistsError("Audius not connected")
                return
            }

            setIsLoadingSpotifyPlaylists(true)
            setSpotifyPlaylistsError("")
            try {
                const pls = await audiusService.getUserPlaylists()
                const mapped = pls.map((p) => ({
                    id         : p.id,
                    name       : p.playlistName,
                    description: p.description || "",
                    images     : p.artwork
                        ? [{ url: p.artwork["480x480"] || p.artwork["150x150"] || "" }]
                        : [],
                    tracks     : { total: p.trackCount },
                    public     : !p.isPrivate,
                    owner      : { display_name: p.user.handle },
                }))
                setSpotifyPlaylists(mapped)
            } catch (e) {
                console.error("Audius playlist fetch failed:", e)
                setSpotifyPlaylistsError("Failed to load playlists from Audius")
            } finally {
                setIsLoadingSpotifyPlaylists(false)
            }
        }

        const buildAudiusPlaylistData = async (plId: string): Promise<AudiusPlaylistData | null> => {
            if (!audiusService) return null
            try {
                const pl  = await audiusService.getPlaylist(plId)
                const trk = await audiusService.getPlaylistTracks(plId)
                if (!pl) return null

                return {
                    audiusId  : pl.id,
                    name      : pl.playlistName,
                    description: pl.description || "",
                    isPrivate : !!pl.isPrivate,
                    artworkUrl: pl.artwork?.["480x480"] || pl.artwork?.["150x150"] || null,
                    tracksData: trk,
                }
            } catch {
                return null
            }
        }

        const onToggleSpotifyPlaylist = (playlistId: string) => {
            setSelectedSpotifyPlaylists((prev) =>
                prev.includes(playlistId) ? prev.filter((id) => id !== playlistId) : [...prev, playlistId],
            )
        }

        const onImportSelectedPlaylists = async () => {
            if (selectedSpotifyPlaylists.length === 0) return
            setIsLoading(true)
            setErrorMessage("")

            /* ─── Spotify branch ────────────────────────────────────────── */
            if (service === "spotify") {
                if (!sdk) { setIsLoading(false); return }
                try {
                    const playlistsData: SpotifyPlaylistData[] = []
                    for (const id of selectedSpotifyPlaylists) {
                        const pl = spotifyPlaylists.find((p) => p.id === id)
                        if (!pl) continue

                        const tracks = await sdk.playlists.getPlaylistItems(
                            id,
                            "US",
                            "items(track(id,name,artists(name),album(name,images,release_date),duration_ms,preview_url,external_urls,uri))",
                        )

                        playlistsData.push({
                            spotifyId  : pl.id,
                            name       : pl.name,
                            description: pl.description || "",
                            isPublic   : pl.public,
                            images     : pl.images || [],
                            tracksData : tracks.items,
                        })
                    }

                    const imported = await importFromSpotify.mutateAsync(playlistsData)
                    onPlaylistsImported?.(imported)
                    closePopup()
                    resetForm()
                } catch (e: any) {
                    setErrorMessage(`Failed to import: ${e?.message ?? ""}`)
                    goToErrorPage()
                } finally {
                    setIsLoading(false)
                }
                return
            }

            /* ─── Audius branch ─────────────────────────────────────────── */
            try {
                const built = (
                    await Promise.all(selectedSpotifyPlaylists.map(buildAudiusPlaylistData))
                ).filter((x): x is AudiusPlaylistData => x !== null)

                if (!built.length) throw new Error("Nothing to import")

                const imported = await importFromAudius.mutateAsync(built)
                onPlaylistsImported?.(imported)
                closePopup()
                resetForm()
            } catch (e: any) {
                setErrorMessage(`Failed to import: ${e?.message ?? ""}`)
                goToErrorPage()
            } finally {
                setIsLoading(false)
            }
        }

        const onNameInput = (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value
            setPlaylistName(value)
            const invalidChars = !VALID_CHARACTERS_REGEX.test(value)
            setHasInvalidCharsName(invalidChars)
            const trimmedName = value.trim()
            if (trimmedName !== "") {
                setIsNameEmpty(false)
            }
        }

        const onDescriptionInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            const value = e.target.value
            setPlaylistDescription(value)
            const hasInvalidChars = !VALID_CHARACTERS_REGEX.test(value)
            const isEmpty = value.trim() === ""
            setHasInvalidCharsDescription(hasInvalidChars && !isEmpty)
        }

        const onOkButtonClick = async () => {
            console.log("Ok Button pressed. Playlist:", playlistToEdit)
            const trimmedName = playlistName.trim()
            const isEmpty = trimmedName === ""
            const invalidCharsName = !VALID_CHARACTERS_REGEX.test(trimmedName)
            const invalidCharsDescription = !VALID_CHARACTERS_REGEX.test(playlistDescription)
            setIsNameEmpty(isEmpty)
            setHasInvalidCharsName(!isEmpty && invalidCharsName)
            if (isEmpty || invalidCharsName) {
                setTimeout(() => playlistNameRef.current?.focus(), 0)
                return
            }
            if (invalidCharsDescription) {
                setTimeout(() => descriptionRef.current?.focus(), 0)
                return
            }
            if (popupPage === PopupState.EDIT_PLAYLIST) {
                await handleEditPlaylist()
            } else {
                await handleCreatePlaylist()
            }
        }

        const handleCreatePlaylist = async () => {
            timeoutRef.current = setTimeout(() => {
                setIsLoading(false)
                setErrorMessage("Request timed out. Please try again later.")
                goToErrorPage()
            }, 10000)
            setIsLoading(true)
            const newPlaylist: Playlist = {
                playlistId: -1,
                playlistName,
                description: playlistDescription,
                visibility: visibility.toUpperCase(),
                sorting: "CUSTOM",
                songs: [],
                numberOfSongs: 0,
                playtime: 0,
                dateAdded: new Date(),
            }
            try {
                const response = await create.mutateAsync(newPlaylist);
                clearTimeout(timeoutRef.current)
                onPlaylistCreated({ ...newPlaylist, playlistId: response.playlistId })
                closePopup()
                resetForm()
                console.log("Playlist created :)")
            } catch (err) {
                clearTimeout(timeoutRef.current)
                console.error("Error creating playlist:", err)
                setErrorMessage("Error creating playlist. Please try again later.")
                goToErrorPage()
            } finally {
                setIsLoading(false)
            }
        }

        const handleEditPlaylist = async () => {
            if (!playlistToEdit) return
            timeoutRef.current = setTimeout(() => {
                setIsLoading(false)
                setErrorMessage("Request timed out. Please try again later.")
                goToErrorPage()
            }, 10000)
            setIsLoading(true)
            const updatedPlaylist: Playlist = {
                ...playlistToEdit,
                playlistName,
                description: playlistDescription,
                visibility: visibility.toUpperCase(),
            }
            try {
                await edit.mutateAsync(updatedPlaylist);
                clearTimeout(timeoutRef.current)
                onPlaylistEdited(updatedPlaylist)
                closePopup()
                resetForm()
            } catch (err) {
                clearTimeout(timeoutRef.current)
                console.error("Error editing playlist:", err)
                setErrorMessage("Error editing playlist. Please try again later.")
                goToErrorPage()
            } finally {
                setIsLoading(false)
            }
        }

        const onTryAgainClick = () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
                timeoutRef.current = null
            }
            goToNewPlaylistPage(false)
        }

        return (
            <>
                {popupPage !== PopupState.HIDDEN && (
                    <PlaylistPopupViews
                        popupPage={popupPage}
                        errorMessage={errorMessage}
                        isLoading={isLoading}
                        isNameEmpty={isNameEmpty}
                        hasInvalidCharsName={hasInvalidCharsName}
                        hasInvalidCharsDescription={hasInvalidCharsDescription}
                        playlistName={playlistName}
                        playlistDescription={playlistDescription}
                        visibility={visibility}
                        exportToPlayLiMana={exportToPlayLiMana}
                        exportToSpotify={exportToSpotify}
                        exportToAudius={exportToAudius}
                        spotifyPlaylists={spotifyPlaylists}
                        selectedSpotifyPlaylists={selectedSpotifyPlaylists}
                        isLoadingSpotifyPlaylists={isLoadingSpotifyPlaylists}
                        spotifyPlaylistsError={spotifyPlaylistsError}
                        onNameInput={onNameInput}
                        onDescriptionInput={onDescriptionInput}
                        onOkButtonClick={onOkButtonClick}
                        closePopup={closePopup}
                        onTryAgainClick={onTryAgainClick}
                        goToNewPlaylistPage={goToNewPlaylistPage}
                        goToAddPlaylistPage={goToAddPlaylistPage}
                        goToChooseServicePage={goToChooseServicePage}
                        goToImportPlaylistPage={goToImportPlaylistPage}
                        onImportSelectedPlaylists={onImportSelectedPlaylists}
                        onToggleSpotifyPlaylist={onToggleSpotifyPlaylist}
                        focusDescription={focusDescription}
                        descriptionRef={descriptionRef}
                        playlistNameRef={playlistNameRef}
                        setVisibility={setVisibility}
                        setExportToPlayLiMana={setExportToPlayLiMana}
                        setExportToSpotify={setExportToSpotify}
                        setExportToAudius={setExportToAudius}
                        service={service}
                        setService={setService}
                    />
                )}
            </>
        )
    },
)

export default PlaylistPopup
