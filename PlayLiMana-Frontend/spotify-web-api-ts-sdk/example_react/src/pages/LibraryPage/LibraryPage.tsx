import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaylistPopup, { PlaylistPopupRef } from '../../components/ui/PlaylistPopup/PlaylistPopup';
import PlaylistCard from '../../components/ui/PlaylistCard/PlaylistCard';
import { sortPlaylists } from '../../utils/sort.util';
import { formatDuration } from '../../utils/format.util';
import { Playlist } from '../../models/playlist';
import { usePlaylists } from '../../hooks/usePlaylists';
import styles from './library.module.css';
import PopupDialog, { PopupDialogRef } from '../../components/ui/PopupDialog/PopupDialog';

const Library: React.FC = () => {
  const { playlists, updatePlaylist } = usePlaylists();

  type SortCriterion = 'Recently Added' | 'Alphabetical' | 'Number of Songs' | 'Total Playtime';
  const sortOptions: SortCriterion[] = ['Recently Added', 'Alphabetical', 'Number of Songs', 'Total Playtime'];

  const [selectedSortCriterion, setSelectedSortCriterion] = useState<SortCriterion>('Recently Added');
  const [isAscending, setIsAscending] = useState(false);

  const sortedPlaylists = useMemo(() => {
    const copy = playlists.map(p => ({ ...p }));
    sortPlaylists(copy, selectedSortCriterion, isAscending);
    return copy;
  }, [playlists, selectedSortCriterion, isAscending]);

  console.log("Library: " + playlists.at(0)?.playlistName);

  const navigate = useNavigate();
  const popupRef = useRef<PlaylistPopupRef>(null);
  const popupDialogRef = useRef<PopupDialogRef>(null);

  // Sorting controls
  const onSortSelectionChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as SortCriterion;
    if (['Recently Added', 'Alphabetical', 'Number of Songs', 'Total Playtime'].includes(value)) {
      setSelectedSortCriterion(value);
    }
  };

  const toggleSortingOrder = () => {
    setIsAscending((prev) => !prev);
  };

  // Go to playlist details
  const goToPlaylist = (playlist: Playlist) => {
    console.log('Klick auf Playlist:', playlist);
    navigate(`/playlist/${playlist.playlistId}`);
  };

  return (
    <div className={styles.library}>
      {/* Library Header */}
      <div className={styles.libraryHeader}>
        <h1>My Library</h1>
        <div className={styles.libraryControls}>
          <div className={styles.sortMenu}>
            <select
              className={styles.sortDropdown}
              onChange={onSortSelectionChange}
              value={selectedSortCriterion}
            >
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <button
              className={`orderToggle ${isAscending ? 'rotate' : ''}`}
              aria-label={isAscending ? 'Ascending' : 'Descending'}
              onClick={toggleSortingOrder}
            >
              ↓
            </button>
          </div>
        </div>
      </div>

      {/* Separation Line */}
      <hr className={styles.librarySeparator} />

      {/* Playlist Grid */}
      <div className={styles.playlistGrid}>
        {/* Add Card */}
        <div
          className={`${styles.playlistCard} ${styles.addCard}`}
          onClick={() => popupRef.current?.goToAddPlaylistPage()}
        >
          <div className={styles.playlistCover}>
            <div className={styles.plusSign}>+</div>
          </div>
          <p className={styles.playlistName}>Add Playlist</p>
        </div>

        {/* Playlist Cards */}
        {sortedPlaylists
          .filter((p): p is Playlist => p !== undefined && p !== null && typeof p === 'object')
          .map((playlist) => (
            <div key={playlist.playlistId} onClick={() => goToPlaylist(playlist)}>
              <PlaylistCard playlist={playlist} popupDialogRef={popupDialogRef}>
                <div
                  className={styles.playlistCover}
                  style={{ backgroundImage: `url(${playlist.coverUrl})` }}
                >
                  <button className={styles.optionsButton}>⋮</button>
                </div>
                <p className={styles.playlistName}>{playlist.playlistName}</p>
                <p className={styles.playlistInfo}>
                  {playlist.numberOfSongs} songs, {formatDuration(playlist.playtime)}
                </p>
              </PlaylistCard>
            </div>

          ))}
      </div>

      {/* Playlist Popup for importong, creating and editing */}
      <PlaylistPopup
        ref={popupRef}
        onPlaylistCreated={() => { }}
        onPlaylistEdited={(updatedPlaylist: Playlist) => {
          updatePlaylist(updatedPlaylist);
        }}
        onPlaylistsImported={() => { }}
      />

      {/* Dialog for deleting, copying and sharing */}
      <PopupDialog
        ref={popupDialogRef}
      />

    </div>
  );
};

export default Library;
