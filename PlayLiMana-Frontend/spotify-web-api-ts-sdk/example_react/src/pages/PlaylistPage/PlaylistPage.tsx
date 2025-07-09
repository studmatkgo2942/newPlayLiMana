import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { sortSongs } from '../../utils/sort.util';
import { formatDuration } from '../../utils/format.util';
import SongCard from '../../components/ui/SongCard/SongCard';
import PlaylistPopup, { PlaylistPopupRef } from '../../components/ui/PlaylistPopup/PlaylistPopup';
import { useSpotifyContext } from "../../context/SpotifyContext.tsx";
import { usePlayback } from "../../context/PlaybackContext.tsx";
import { PlaylistDropdownMenu } from '../../components/ui/PlaylistDropdownMenu/PlaylistDropdownMenu.tsx';
import PopupDialog, { PopupDialogRef } from '../../components/ui/PopupDialog/PopupDialog.tsx';
import styles from './playlist-page.module.css';
import { usePlaylists } from '../../hooks/usePlaylists.ts';
import { getSpotifyTrackId }      from "../../utils/spotify.util";
import { useAudiusContext }    from "../../context/AudiusContext";
import {Song} from "../../models/song.ts";
import { skipEndedClearRef } from "../../context/PlaybackContext";

const PlaylistPage = () => {
    const {id} = useParams();
    const playlistId = id ? +id : null;
    const {sdk} = useSpotifyContext()
    const {deviceId, playCustomAudio, stopCustomAudio, customAudioRef, loadAudiusQueue, clearQueue} = usePlayback()
    const [selectedSortCriterion, setSelectedSortCriterion] = useState('CUSTOM');
    const [isAscending, setIsAscending] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { audiusService } = useAudiusContext();

    const buttonRef = useRef<HTMLButtonElement>(null);
    const popupRef = useRef<PlaylistPopupRef>(null);
    const popupDialogRef = useRef<PopupDialogRef>(null);
    const navigate = useNavigate();

    const {
        playlistsQuery,
        updatePlaylist,
        getPlaylistById,
        setSkipFetch,
    } = usePlaylists();

    // Get playlist from cache
    const playlist = getPlaylistById(playlistId);

    const isLoading = playlistsQuery.isLoading;
    const isError = playlistsQuery.isError;

    // Initial sorting
    useEffect(() => {
        if (playlist) {
            console.log('[PlaylistPage] Playlist loaded from cache:', playlist);
            setSelectedSortCriterion(playlist.sorting ?? 'CUSTOM');
        }
    }, [playlist?.playlistId]); // Reset when ID changes

    // Sort songs
    useEffect(() => {
        if (playlist?.songs) {
            console.log('[PlaylistPage] Sorting songs with:', selectedSortCriterion, 'Ascending:', isAscending);
            sortSongs(playlist.songs, selectedSortCriterion, isAscending);
        }
    }, [playlist?.songs, selectedSortCriterion, isAscending]);

    const sortOptions = [
        { label: 'Custom', value: 'CUSTOM' },
        { label: 'Recently Added', value: 'RECENTLY_ADDED' },
        { label: 'Release Date', value: 'RELEASE_DATE' },
        { label: 'Title', value: 'TITLE' },
        { label: 'Artist', value: 'ARTIST' },
        { label: 'Album', value: 'ALBUM' },
        { label: 'Playtime', value: 'PLAYTIME' }
    ];

    const onSortSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const value = e.target.value;
        console.log('[PlaylistPage] Sort criterion changed to:', value);
        setSelectedSortCriterion(value);
    };

    const toggleSortingOrder = () => {
        const newOrder = !isAscending;
        console.log('[PlaylistPage] Toggled sorting order. Ascending:', newOrder);
        setIsAscending(newOrder);
    };
/*
    const playPlayList = async () => {
        if (!playlist || !deviceId) return;
        const songIds = playlist.songs
            .map(song => song.linksForWebPlayer?.[0]?.split("/track/")[1])
            .filter(Boolean) as string[];
        if (songIds.length === 0) return;
        const firstSongId = songIds[0];
        console.log("[PlaylistPage] Starting playback with song ID:", firstSongId);
        await sdk?.player.startResumePlayback(deviceId, firstSongId);
    };*/

    const onDeleteInitiated = () => {
        setSkipFetch(true); // Block API Call
    };

    const handleDeleteSuccess = () => {
        setSkipFetch(false);
        navigate('/library');
    };

    const handleOptionsClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setMenuOpen(prev => !prev);
    };

    /** Sequentially play a list of Audius tracks using the custom player. */
    // const playAudiusPlaylist = (tracks: Song[]) => {
    //     if (!tracks.length || !audiusService) return;
    //
    //     let idx = 0;
    //     const audioEl = customAudioRef.current;   // from usePlayback()
    //
    //     /* ---------- choose best stream for ONE track ------------------------- */
    //     const pickStreamUrl = (song: Song): string | null => {
    //         // 1) stored ".../stream" url?
    //         let url = song.linksForWebPlayer?.find(u => u.includes("/stream"));
    //         if (url) {
    //             if (!/[\?&]format=/.test(url)) {
    //                 url += (url.includes("?") ? "&" : "?") + "format=mp3";
    //             }
    //             return url;
    //         }
    //         // 2) derive from permalink (already adds format=mp3)
    //         return audiusService.getStreamUrlFromPermalink(song.linksForWebPlayer?.[0]) ?? null;
    //     };
    //
    //     /* ---------- play i-th track ----------------------------------------- */
    //     const playIdx = (i: number) => {
    //         const url = pickStreamUrl(tracks[i]);
    //         if (!url) return;
    //         /* all pause/await logic is inside playCustomAudio */
    //         playCustomAudio(url, {
    //             title   : tracks[i].title,
    //             imageUrl: tracks[i].coverUrl,
    //             source  : "audius",
    //         });
    //     };
    //
    //     /* ---------- jump to the next track ---------------------------------- */
    //     const handleEnded = () => {
    //         idx += 1;
    //         if (idx < tracks.length) {
    //             skipEndedClearRef.current = true;   // tell context to keep state
    //             playIdx(idx);
    //         } else {
    //             audioEl?.removeEventListener("ended", handleEnded);
    //         }
    //     };
    //
    //     /* make sure we register only once */
    //     audioEl?.removeEventListener("ended", handleEnded);
    //     audioEl?.addEventListener("ended", handleEnded);
    //
    //     playIdx(idx);                            // kick off with track 0
    // };

    const playAudiusPlaylist = (tracks: Song[]) => {
            stopCustomAudio();     // kill current Audius playback
            clearQueue();          // drop old queue
            loadAudiusQueue(tracks);
        };

    const playPlayList = async () => {
        if (!playlist) return;

        /* 1️⃣  Spotify section ------------------------------------------------ */
        const spotifyUris = playlist.songs
            .map(s => getSpotifyTrackId(s.linksForWebPlayer?.[0]))
            .filter((id): id is string => !!id)
            .map(id => `spotify:track:${id}`);

        if (spotifyUris.length && deviceId && sdk) {
            console.log("Starting Spotify playlist with", spotifyUris.length, "tracks");
            await sdk.player.startResumePlayback(deviceId, undefined, spotifyUris);

            /*  ↳  EARLY-EXIT
                ---------------------------------------------------------
                We kicked off Spotify playback successfully, so we *don’t*
                start the Audius list right now.  When/if you want to begin
                Audius after Spotify finishes you can wire that up to a
                `player_state_changed` listener – but for now we stop here.
            */
            return;
        }

        /* 2️⃣  Audius section -------------------------------------------------- */
        const audiusTracks = playlist.songs.filter(
            s => !getSpotifyTrackId(s.linksForWebPlayer?.[0]),   // anything that is NOT Spotify
        );

        if (audiusTracks.length) {
            console.log("Starting Audius playlist with", audiusTracks.length, "tracks");
            playAudiusPlaylist(audiusTracks);
        }
    };
    if (isLoading) return null;

    if (isError) {
        return (
            <div className={styles.errorMessage}>
                <div className={styles.errorContent}>
                    <h2>Error</h2>
                    <p>Failed to load playlist.</p>
                </div>
            </div>
        );
    }

    return (
        <>
            { playlist ? (
        <div className={styles.playlistDetail}>
            <div className={styles.playlistCard}>
                <div className={styles.cover} style={{backgroundImage: `url(${playlist.coverUrl})`}}></div>
                <div className={styles.actions}>
                    <button className={`${styles.btn} ${styles.edit}`} aria-label="Edit"
                            onClick={() => popupRef.current?.goToEditPlaylistPage(playlist)}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                             className={styles.editIcon}>
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                            <path d="m15 5 4 4"/>
                        </svg>
                    </button>

                            <button className={`${styles.btn} ${styles.play}`} aria-label="Play" onClick={playPlayList}>
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    className={styles.playIcon}
                                >
                                    <polygon points="6 4 19 12 6 20 6 4" />
                                </svg>
                            </button>

                            <button
                                ref={buttonRef}
                                className={`${styles.btn} ${styles.more}`}
                                aria-label="More"
                                onClick={handleOptionsClick}>
                                <svg xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    width="1em"
                                    height="1em"
                                    style={{ verticalAlign: 'middle' }}>
                                    <circle cx="12" cy="2" r="1.9" />
                                    <circle cx="12" cy="10" r="1.9" />
                                    <circle cx="12" cy="18" r="1.9" />
                                </svg>
                            </button>
                        </div>

                        <div className={`${styles.info} scrollbar`}>
                            <h2 className={styles.playlistName}>{playlist.playlistName}</h2>
                            <p className={styles.visibility}>{playlist.visibility} Playlist</p>
                            <p className={styles.stats}>
                                {playlist.numberOfSongs} {playlist.numberOfSongs === 1 ? "song" : "songs"},{" "}
                                {formatDuration(playlist.playtime)}
                            </p>
                            {playlist.description && <p className={styles.description}>{playlist.description}</p>}
                        </div>
                    </div>

                    <div className={styles.songsSection}>
                        <div className={styles.sortMenu}>
                            <select
                                className={styles.sortDropdown}
                                value={selectedSortCriterion}
                                onChange={onSortSelectionChange}
                            >
                                {sortOptions.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                            <button
                                className={`${styles.orderToggle}${isAscending ? ' rotate' : ''}`}
                                onClick={toggleSortingOrder}
                            >
                                ↓
                            </button>
                        </div>
                        <div className={styles.songList}>
                            <SongCard songs={playlist.songs} />
                        </div>
                    </div>

                    {/* Playlist Popup for importong, creating and editing */}
                    <PlaylistPopup
                        ref={popupRef}
                        onPlaylistCreated={() => { }}
                        onPlaylistEdited={(updatedPlaylist) => {
                            updatePlaylist(updatedPlaylist);
                        }}
                        onPlaylistsImported={() => { }}
                    />

                    {/* Menu for deleting, copying and sharing */}
                    {menuOpen && (
                        <PlaylistDropdownMenu
                            anchorRef={buttonRef}
                            playlist={playlist}
                            onClose={() => setMenuOpen(false)}
                            onOpenDeleteDialog={(playlist) => popupDialogRef.current?.goToDeletePage(playlist)}
                            onOpenCopyDialog={(playlist) => popupDialogRef.current?.goToCopyPage(playlist)}
                            onOpenShareDialog={(playlist) => popupDialogRef.current?.goToSharePage(playlist)}
                            onExportDialog={(playlist) => popupDialogRef.current?.goToExportPage(playlist)}
                        />
                    )}

                    {/* Dialog for deleting, copying and sharing */}
                    <PopupDialog
                        ref={popupDialogRef}
                        onDeleteInitiated={onDeleteInitiated}
                        onDeleteSuccess={handleDeleteSuccess}
                    />
                </div>
            ) : (
                <div className={styles.deletedFallback}>
                    <h2>This Playlist can't be displayed.</h2>
                    <p>The playlist may be private or deleted.</p>
                    <button className={styles.button} onClick={() => navigate('/')}>Go Home</button>
                </div>
            )}

            {/* Wird immer gerendert, auch wenn playlist null ist */}
            <PopupDialog
                ref={popupDialogRef}
                onDeleteInitiated={onDeleteInitiated}
                onDeleteSuccess={handleDeleteSuccess}
            />
        </>
    )
};

export default PlaylistPage;
