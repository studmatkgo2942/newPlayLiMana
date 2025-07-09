import { Playlist } from "../models/playlist.model";
import { Song } from "../models/song.model";
import { isValidDate, isValidImageUrl } from "./validate.util";

/**
 * Formats a duration (in seconds) based on the following rules:
 * - Duration < 1 hour: `mm:ss min`
 * - Duration >= 1 hour and < 24 hours: `hh:mm:ss h`
 * - Duration >= 24 hours: `24+ hours`
 * - Invalid or negative values will display as `0:00 min`.
 *
 * @param value The duration in seconds.
 * @returns A string representation of the formatted duration.
 */
export function formatDuration(value: number | undefined): string {
  if (!value || value < 0) {
    return '0:00 min';
  }
  if (value >= 24 * 60 * 60) {
    return '24+ hours';
  }
  const hours = Math.floor(value / 3600);
  const minutes = Math.floor((value % 3600) / 60);
  const seconds = value % 60;
  if (hours > 0) {
    return `${hours}:${formatWithLeadingZero(minutes)}:${formatWithLeadingZero(seconds)} h`;
  }
  return `${minutes}:${formatWithLeadingZero(seconds)} min`;
}

/**
 * Helper function: Adds leading zeros for single-digit numbers.
 * @param value A number to be formatted.
 * @returns A number formatted with a leading zero (if < 10).
 */
function formatWithLeadingZero(value: number): string {
  return value < 10 ? `0${value}` : `${value}`;
}

/**
 * Maps a SongDTO from the backend to a Song in the frontend.
 * @param songDTO 
 * @returns The mapped Song object.
 */
export function mapSongDTOToSong(songDTO: any): Song {
  return {
    songId: songDTO.songId,
    title: songDTO.title,
    artists: songDTO.artists ?? [],
    album: songDTO.album,
    genres: songDTO.genres ?? [],
    playtime: songDTO.playtime ?? 0,
    releaseDate: isValidDate(songDTO.releaseDate) ? new Date(songDTO.releaseDate) : new Date(),
    linksForWebPlayer: songDTO.linksForWebPlayer ?? [],
    coverUrl: getValidCoverUrl(songDTO.coverUrl, "song"),
    positionInPlaylist: songDTO.positionInPlaylist ?? undefined,
    addDate: isValidDate(songDTO.addDate) ? new Date(songDTO.addDate) : undefined,
  };
}

/**
 * Maps a PlaylistDTO from the backend to a Playlist in the frontend.
 * @param playlistDTO The raw playlist object from the backend.
 * @param transformSongs Whether or not to map songs (default: true).
 * @returns The mapped Playlist object.
 */
export function mapPlaylistDTOToPlaylist(playlistDTO: any, transformSongs = true): Playlist {
  return {
    playlistId: playlistDTO.playlistId,
    playlistName: playlistDTO.playlistName,
    description: playlistDTO.description ?? '',
    visibility: playlistDTO.visibility,
    sorting: playlistDTO.sorting,
    songs: transformSongs && playlistDTO.songs
      ? playlistDTO.songs.map((songDTO: any) => mapSongDTOToSong(songDTO))
      : playlistDTO.songs,
    numberOfSongs: playlistDTO.numberOfSongs,
    playtime: playlistDTO.playtime,
    dateAdded: isValidDate(playlistDTO.dateAdded) ? new Date(playlistDTO.dateAdded) : new Date(),
    coverUrl: getValidCoverUrl(playlistDTO.coverUrl, "playlist"),
  };
}

/**
 * Helper function: Checks if the given URL is valid for use as an image. If so:
 * the URL is returned; otherwise: a valid placeholder. 
 * @param url The given coverUrl which could also be invalid, null or undefined.
 * @param type Choses placeholder for 'playlist' or 'song'.
 * @returns A valid image URL (the original one or a placeholder).
 */
export function getValidCoverUrl(url: string | null | undefined, type: 'playlist' | 'song'): string {
    const playlistPlaceholder = '/assets/playlist-cover-placeholder.svg';
    const songPlaceholder = '/assets/song-cover-placeholder.svg';
    if (isValidImageUrl(url)) {
      return url as string;
    }
    return type === 'playlist' ? playlistPlaceholder : songPlaceholder;
}