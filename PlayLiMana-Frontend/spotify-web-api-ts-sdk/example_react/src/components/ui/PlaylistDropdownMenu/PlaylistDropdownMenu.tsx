import React, {useState, useEffect, useRef} from 'react';
import ReactDOM from 'react-dom';
import {Playlist} from '../../../models/playlist';
import styles from './playlist-dropdown-menu.module.css';
import {useSpotifyContext} from "../../../context/SpotifyContext.tsx";
import {UserProfile} from "@spotify/web-api-ts-sdk";
import axios from "axios";
import {Buffer} from 'buffer';

interface PlaylistDropdownMenuProps {
    anchorRef: React.RefObject<HTMLElement>;
    playlist: Playlist;
    onClose: () => void;
    onOpenDeleteDialog: (playlist: Playlist) => void;
    onOpenCopyDialog: (playlist: Playlist) => void;
    onOpenShareDialog: (playlist: Playlist) => void;
    onExportDialog: (playlist: Playlist) => void;
}

export const PlaylistDropdownMenu: React.FC<PlaylistDropdownMenuProps> = ({
                                                                              anchorRef,
                                                                              playlist,
                                                                              onClose,
                                                                              onOpenDeleteDialog,
                                                                              onOpenCopyDialog,
                                                                              onOpenShareDialog,
                                                                              onExportDialog
                                                                          }) => {
    const [position, setPosition] = useState<{ top: number; left: number }>({top: 0, left: 0});
    const menuRef = useRef<HTMLDivElement>(null);
    const {sdk} = useSpotifyContext()

    useEffect(() => {
        const rect = anchorRef.current?.getBoundingClientRect();
        if (rect) {
            setPosition({
                top: rect.bottom + 4,
                left: rect.left,
            });
        }

        const handleClickOutside = (e: MouseEvent) => {
            if (!(e.target instanceof Node)) return;
            if (
                !anchorRef.current?.contains(e.target) &&
                !menuRef.current?.contains(e.target)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [anchorRef, onClose]);

    const handleDelete = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        onClose();
        console.log("Delete");
        onOpenDeleteDialog(playlist);
    };

    const handleCopy = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        onClose();
        console.log("Copy");
        onOpenCopyDialog(playlist);
    };

    const handleShare = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
        e.stopPropagation();
        onClose();
        console.log("Share");
        onOpenShareDialog(playlist);
    };
    const handleExport = async () => {
        const request = {
            name: playlist.playlistName,
            public: playlist.visibility === "PUBLIC",
            collaborative: playlist.visibility === "SHARED",
            description: playlist.description
        }
        if (sdk != null) {
            const currentUser: UserProfile = await sdk.currentUser.profile()
            const createdPlaylist = await sdk.playlists.createPlaylist(currentUser.id, request)
            if (playlist.coverUrl != undefined) {
                const base64Image = await fetchImageAsBase64(playlist.coverUrl);
                await sdk.playlists.addCustomPlaylistCoverImageFromBase64String(createdPlaylist.id, base64Image)
            }
            const songsInPlaylist: string[] = playlist.songs.map(song => "spotify:track:" + song.linksForWebPlayer[0].split("/track/")[1])
            console.log("Export songs to spotify: " + songsInPlaylist)
            await sdk.playlists.addItemsToPlaylist(createdPlaylist.id,songsInPlaylist)
        }
        onExportDialog(playlist)
    }

    async function fetchImageAsBase64(imageUrl: string): Promise<string> {
        const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
        const buffer: Buffer = Buffer.from(response.data, "binary");
        return buffer.toString("base64");
    }


    return ReactDOM.createPortal(
        <div
            ref={menuRef}
            className={styles.menuContainer}
            style={{top: position.top, left: position.left}}
        >
            <button className={styles.menuItem} onClick={handleDelete}>Delete</button>
            <button className={styles.menuItem} onClick={handleCopy}>Copy</button>
            <button className={styles.menuItem} onClick={handleShare}>Share</button>
            <button className={styles.menuItem} onClick={() => handleExport()}> Export</button>
        </div>,
        document.body
    );
};
