import React, { useRef, useState } from 'react';
import { Playlist } from '../../../models/playlist';
import { formatDuration } from '../../../utils/format.util';
import { CoverImage } from '../CoverImage/CoverImage';
import { PlaylistDropdownMenu } from '../PlaylistDropdownMenu/PlaylistDropdownMenu';
import { PopupDialogRef } from '../PopupDialog/PopupDialog';
import styles from './playlist-card.module.css';

interface PlaylistCardProps {
  playlist: Playlist;
  onPlaylistClick?: (playlist: Playlist) => void;
  popupDialogRef: React.RefObject<PopupDialogRef>;
}

const PlaylistCard: React.FC<PlaylistCardProps> = ({ playlist, onPlaylistClick, popupDialogRef }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClick = () => {
    if (onPlaylistClick) {
      onPlaylistClick(playlist);
    }
  };

  const handleOptionsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  return (
    <div className={styles.playlistCard} onClick={handleClick}>
      <div className={styles.playlistCoverWrapper}>
        <div className={styles.playlistCover}>
          <CoverImage
            src={playlist.coverUrl}
            type="playlist"
            alt={playlist.playlistName}
            className={styles.coverImage}
          />
          <div className={styles.coverOverlay}></div>
          <button
            ref={buttonRef}
            className={styles.optionsButton}
            onClick={handleOptionsClick}
          >
            ⋮
          </button>
        </div>
      </div>
      <p className={styles.playlistName}>{playlist.playlistName}</p>
      <p className={styles.playlistInfo}>
        {playlist.numberOfSongs} {playlist.numberOfSongs === 1 ? "song" : "songs"}, {formatDuration(playlist.playtime)}
      </p>

      {/* Menu for deleting, copying and sharing */}
      {menuOpen && (
        <PlaylistDropdownMenu
          anchorRef={buttonRef}
          onClose={() => setMenuOpen(false)}
          playlist={playlist}
          onOpenDeleteDialog={(playlist) => popupDialogRef.current?.goToDeletePage(playlist)}
          onOpenCopyDialog={(playlist) => popupDialogRef.current?.goToCopyPage(playlist)}
          onOpenShareDialog={(playlist) => popupDialogRef.current?.goToSharePage(playlist)}
          onExportDialog={(playlist) => popupDialogRef.current?.goToExportPage(playlist)}
        />
      )}
    </div>
  );
};

export default PlaylistCard;
