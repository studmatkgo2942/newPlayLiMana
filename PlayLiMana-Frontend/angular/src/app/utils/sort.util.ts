import { Playlist } from "../models/playlist.model";
import { Song } from "../models/song.model";

export function sortPlaylists(playlists: Playlist[], criterion: string, isAscending: boolean): void {
      playlists.sort((a, b) => {
      let compareResult = 0;
      
      if(!isAscending) {
        [a, b] = [b, a];
      }

      // Sort by criterion
      if (criterion === 'Alphabetical') {
        compareResult = b.playlistName.localeCompare(a.playlistName);
      } else if (criterion === 'Recently Added') {
        compareResult = a.dateAdded.getTime() - b.dateAdded.getTime();
      } else if (criterion === 'Number of Songs') {
        compareResult = a.numberOfSongs - b.numberOfSongs;
      } else if (criterion === 'Total Playtime') {
        compareResult = a.playtime - b.playtime;
      }

      // Don't return yet if it's a tie
      if (compareResult !== 0) {
        return compareResult;
      }
      compareResult = b.playlistName.localeCompare(a.playlistName);
      if (compareResult !== 0) {
        return compareResult;
      }
      compareResult = new Date(a.dateAdded).getTime() - new Date(b.dateAdded).getTime();
      if (compareResult !== 0) {
        return compareResult;
      }
      compareResult = a.numberOfSongs - b.numberOfSongs;
      if (compareResult !== 0) {
        return compareResult;
      }
      return a.playtime - b.playtime;
    });
}


export function sortSongs(songs: Song[], criterion: string, isAscending: boolean): void {
      songs.sort((a, b) => {
      let compareResult = 0;
      console.log("Songs werden sortiert");
      
      if(!isAscending) {
       [a, b] = [b, a];
      }
      let a_positionInPlaylist = a.positionInPlaylist ?? (isAscending ? songs.length : 0);
      let b_positionInPlaylist = b.positionInPlaylist ?? (isAscending ? songs.length : 0);
      let a_addDate = a.addDate ?? (isAscending ? new Date(0) : new Date());
      let b_addDate = b.addDate ?? (isAscending ? new Date(0) : new Date());
      let a_album = a.album ?? (isAscending ? "\uFFFF" : "");
      let b_album = b.album ?? (isAscending ? "\uFFFF" : "");
      let a_artists = a.artists.join(", ");
      let b_artists = b.artists.join(", ");

      // Sort by criterion
      if (criterion === 'Custom') {
        compareResult = a_positionInPlaylist - b_positionInPlaylist;
      } else if (criterion === 'Title'){
        compareResult = b.title.localeCompare(a.title);
      } else if (criterion === 'Artist'){
        compareResult = b_artists.localeCompare(a_artists);
      } else if (criterion === 'Recently Added') {
        compareResult = a_addDate.getTime() - b_addDate.getTime();
      } else if (criterion === 'Release Date') {
        compareResult = a.releaseDate.getTime() - b.releaseDate.getTime();
      } else if (criterion === 'Playtime') {
        compareResult = a.playtime - b.playtime;
      } else if (criterion === 'Album') {
        compareResult = b_album.localeCompare(a_album);
      }

      // Don't return yet if it's a tie
      if (compareResult !== 0) {
        return compareResult;
      }
      compareResult = b.title.localeCompare(a.title);
      if (compareResult !== 0) {
        return compareResult;
      }
      compareResult = b_album.localeCompare(a_album);
      if (compareResult !== 0) {
        return compareResult;
      }
      compareResult = b_artists.localeCompare(a_artists);
      if (compareResult !== 0) {
        return compareResult;
      }
      compareResult = a.releaseDate.getTime() - b.releaseDate.getTime();
      if (compareResult !== 0) {
        return compareResult;
      }
      compareResult = a_addDate.getTime() - b_addDate.getTime();
      if (compareResult !== 0) {
        return compareResult;
      }
      compareResult = a.playtime - b.playtime;
      if (compareResult !== 0) {
        return compareResult;
      }
      return a_positionInPlaylist - b_positionInPlaylist;
    });
}